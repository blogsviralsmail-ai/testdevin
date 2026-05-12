import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true, collegeName: true, degree: true, year: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId, status: { in: ["selected", "completed"] } },
    include: {
      batch: { include: { program: { select: { title: true, domain: true, duration: true, mode: true } } } },
      certificates: { select: { certNumber: true, type: true, issueDate: true } },
    },
  });

  const submissions = await prisma.submission.findMany({
    where: { studentId: userId, status: "reviewed" },
    select: { id: true, task: { select: { title: true, batchId: true } }, percentage: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId, passed: true },
    include: { quiz: { select: { title: true, programId: true } } },
    orderBy: { completedAt: "desc" },
  });

  const skills = [...new Set(enrollments.map(e => e.batch.program.domain))];

  return NextResponse.json({
    profile: user,
    skills,
    programs: enrollments.map(e => ({
      title: e.batch.program.title,
      domain: e.batch.program.domain,
      duration: e.batch.program.duration,
      status: e.status,
      certificates: e.certificates,
      topSubmissions: submissions.filter(s => s.task.batchId === e.batchId).slice(0, 10),
    })),
    quizzes: quizAttempts.map(a => ({
      title: a.quiz.title,
      score: Math.round(a.score),
      completedAt: a.completedAt,
    })),
  });
}
