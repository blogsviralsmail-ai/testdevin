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
      quiz: { select: { title: true, dayNumber: true, passingScore: true, program: { select: { title: true } } } },
    },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(attempts);
}
