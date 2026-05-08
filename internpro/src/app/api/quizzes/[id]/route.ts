import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } }, attempts: { include: { user: { select: { name: true, avatar: true } } }, orderBy: { score: "desc" } } },
  });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // For students, hide correct answers if not attempted
  if (session.role === "student") {
    const myAttempt = quiz.attempts.find(a => a.userId === session.id);
    return NextResponse.json({
      ...quiz,
      questions: quiz.questions.map(q => ({ ...q, options: JSON.parse(q.options), correctAnswer: myAttempt ? q.correctAnswer : undefined })),
      attempts: myAttempt ? [myAttempt] : [],
    });
  }

  return NextResponse.json({ ...quiz, questions: quiz.questions.map(q => ({ ...q, options: JSON.parse(q.options) })) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const data = await request.json();

  const { questions, ...quizData } = data;
  const updated = await prisma.quiz.update({ where: { id }, data: quizData });

  if (questions) {
    await prisma.quizQuestion.deleteMany({ where: { quizId: id } });
    await prisma.quizQuestion.createMany({
      data: questions.map((q: { question: string; options: string[]; correctAnswer: number; points?: number }, i: number) => ({
        quizId: id, question: q.question, options: JSON.stringify(q.options), correctAnswer: q.correctAnswer, points: q.points || 10, order: i,
      })),
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.quiz.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
