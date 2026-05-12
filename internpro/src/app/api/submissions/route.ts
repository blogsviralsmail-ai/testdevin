import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyTaskSubmitted } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = { student: { deletedAt: null } };
  if (taskId) where.taskId = taskId;
  if (session.role === "student") {
    where.studentId = session.id;
  } else if (studentId) {
    where.studentId = studentId;
  }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
      task: { select: { title: true, maxPoints: true, dayNumber: true, batch: { select: { name: true, program: { select: { title: true } } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, content, fileUrl } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const submission = await prisma.submission.upsert({
      where: {
        taskId_studentId: { taskId, studentId: session.id },
      },
      update: {
        content: content || null,
        fileUrl: fileUrl || null,
        status: "submitted",
        percentage: null,
        feedback: null,
        reviewedBy: null,
      },
      create: {
        taskId,
        studentId: session.id,
        content: content || null,
        fileUrl: fileUrl || null,
      },
    });

    // Notify admins about task submission
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { title: true, batch: { select: { program: { select: { title: true } } } } } });
    if (task) {
      notifyTaskSubmitted(session.name, task.title, task.batch.program.title).catch(() => {});
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
