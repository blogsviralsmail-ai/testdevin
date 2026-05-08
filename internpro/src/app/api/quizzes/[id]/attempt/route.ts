import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { answers, timeTaken } = await request.json();
  if (!answers) return NextResponse.json({ error: "Answers required" }, { status: 400 });

  // Check if already attempted
  const existing = await prisma.quizAttempt.findUnique({ where: { quizId_userId: { quizId: id, userId: session.id } } });
  if (existing) return NextResponse.json({ error: "Already attempted" }, { status: 400 });

  const quiz = await prisma.quiz.findUnique({ where: { id }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // Calculate score
  let score = 0;
  let totalPoints = 0;
  quiz.questions.forEach((q, i) => {
    totalPoints += q.points;
    if (answers[i] === q.correctAnswer) score += q.points;
  });

  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  const passed = percentage >= quiz.passingScore;

  const attempt = await prisma.quizAttempt.create({
    data: { quizId: id, userId: session.id, answers: JSON.stringify(answers), score: percentage, totalPoints, passed, timeTaken, completedAt: new Date() },
  });

  // Award points for quiz
  if (passed) {
    await prisma.gamificationPoint.create({ data: { userId: session.id, points: Math.round(percentage / 2), reason: `Quiz passed: ${quiz.title}`, category: "quiz" } });
  }

  return NextResponse.json({ ...attempt, score: percentage, passed });
}
