import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts = await prisma.quizAttempt.findMany({
    include: {
      user: { select: { name: true, email: true, avatar: true } },
      quiz: { select: { title: true, dayNumber: true, passingScore: true, programId: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const programIds = [...new Set(attempts.map(a => a.quiz.programId).filter(Boolean))] as string[];
  const programs = programIds.length > 0
    ? await prisma.program.findMany({ where: { id: { in: programIds } }, select: { id: true, title: true } })
    : [];
  const programMap = Object.fromEntries(programs.map(p => [p.id, p.title]));

  return NextResponse.json(attempts.map(a => ({
    ...a,
    quiz: {
      ...a.quiz,
      program: a.quiz.programId ? { title: programMap[a.quiz.programId] || "Unknown" } : null,
    },
  })));
}
