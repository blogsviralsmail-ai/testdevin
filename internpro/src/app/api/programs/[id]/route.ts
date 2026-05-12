import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      organization: true,
      batches: {
        include: {
          leader: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true, tasks: true, resources: true } },
        },
      },
    },
  });

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  return NextResponse.json(program);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (session.role === "organization") {
      const program = await prisma.program.findUnique({
        where: { id },
        include: { organization: true },
      });
      if (!program || program.organization.adminId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { title, description, domain, mode, duration, feeType, feeAmount, stipendAmount, maxSeats, isPublished, thumbnail } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (domain !== undefined) data.domain = domain;
    if (mode !== undefined) data.mode = mode;
    if (duration !== undefined) data.duration = duration;
    if (feeType !== undefined) data.feeType = feeType;
    if (feeAmount !== undefined) data.feeAmount = feeAmount;
    if (stipendAmount !== undefined) data.stipendAmount = stipendAmount;
    if (maxSeats !== undefined) data.maxSeats = maxSeats;
    if (isPublished !== undefined) data.isPublished = isPublished;
    if (thumbnail !== undefined) data.thumbnail = thumbnail;

    const updatedProgram = await prisma.program.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedProgram);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update program";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Cascade delete: quizQuestions → quizAttempts → quizzes, resources, submissions → tasks, enrollments, batches, then program
    const batches = await prisma.batch.findMany({ where: { programId: id }, select: { id: true } });
    const batchIds = batches.map(b => b.id);

    if (batchIds.length > 0) {
      // Delete quiz-related
      const quizzes = await prisma.quiz.findMany({ where: { OR: [{ batchId: { in: batchIds } }, { programId: id }] }, select: { id: true } });
      const quizIds = quizzes.map(q => q.id);
      if (quizIds.length > 0) {
        await prisma.quizQuestion.deleteMany({ where: { quizId: { in: quizIds } } });
        await prisma.quizAttempt.deleteMany({ where: { quizId: { in: quizIds } } });
        await prisma.quiz.deleteMany({ where: { id: { in: quizIds } } });
      }

      // Delete resources
      await prisma.resource.deleteMany({ where: { batchId: { in: batchIds } } });

      // Delete task submissions then tasks
      const tasks = await prisma.task.findMany({ where: { batchId: { in: batchIds } }, select: { id: true } });
      if (tasks.length > 0) {
        await prisma.submission.deleteMany({ where: { taskId: { in: tasks.map(t => t.id) } } });
      }
      await prisma.task.deleteMany({ where: { batchId: { in: batchIds } } });

      // Delete enrollment-related
      const enrollments = await prisma.enrollment.findMany({ where: { batchId: { in: batchIds } }, select: { id: true } });
      const enrollmentIds = enrollments.map(e => e.id);
      if (enrollmentIds.length > 0) {
        await prisma.attendance.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await prisma.interview.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await prisma.offerLetter.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await prisma.experienceLetter.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await prisma.certificate.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
        await prisma.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
      }

      // Delete batches
      await prisma.batch.deleteMany({ where: { programId: id } });
    }

    // Also delete quizzes linked directly to program
    const programQuizzes = await prisma.quiz.findMany({ where: { programId: id }, select: { id: true } });
    if (programQuizzes.length > 0) {
      const pqIds = programQuizzes.map(q => q.id);
      await prisma.quizQuestion.deleteMany({ where: { quizId: { in: pqIds } } });
      await prisma.quizAttempt.deleteMany({ where: { quizId: { in: pqIds } } });
      await prisma.quiz.deleteMany({ where: { id: { in: pqIds } } });
    }

    await prisma.program.delete({ where: { id } });

    return NextResponse.json({ message: "Program deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete program";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
