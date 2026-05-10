import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();

  const isAdmin = session && ["admin", "organization", "teamleader"].includes(session.role);

  // For students, only show quizzes that belong to their enrolled program/batch
  let where: Record<string, unknown> = isAdmin ? {} : { isPublished: true };
  if (session && session.role === "student") {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.id, status: { in: ["selected", "active", "completed"] } },
      include: { batch: { select: { id: true, programId: true } } },
    });
    if (enrollments.length > 0) {
      const batchIds = enrollments.map(e => e.batchId);
      const programIds = enrollments.map(e => e.batch.programId);
      where = {
        isPublished: true,
        OR: [
          { batchId: { in: batchIds } },
          { programId: { in: programIds } },
          { batchId: null, programId: null },
        ],
      };
    }
  }

  const quizzes = await prisma.quiz.findMany({
    where,
    include: { questions: { select: { id: true } }, attempts: session ? (isAdmin ? { select: { id: true } } : { where: { userId: session.id } }) : { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(quizzes.map(q => ({
    ...q,
    questionCount: q.questions.length,
    attemptCount: q.attempts.length,
    myAttempt: session && !isAdmin ? q.attempts[0] || null : undefined,
    questions: undefined,
    attempts: undefined,
  })));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, batchId, programId, timeLimit, passingScore, questions } = await request.json();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      title, description, batchId, programId, timeLimit, passingScore: passingScore || 60, createdBy: session.id,
      questions: questions?.length ? { create: questions.map((q: { question: string; options: string[]; correctAnswer: number; points?: number }, i: number) => ({
        question: q.question, options: JSON.stringify(q.options), correctAnswer: q.correctAnswer, points: q.points || 10, order: i,
      })) } : undefined,
    },
    include: { questions: true },
  });

  return NextResponse.json(quiz);
}
