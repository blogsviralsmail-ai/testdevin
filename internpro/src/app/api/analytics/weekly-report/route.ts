import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (session.role === "student") {
    // Student weekly report
    const submissions = await prisma.submission.findMany({
      where: { studentId: session.id, createdAt: { gte: weekAgo } },
      include: { task: { select: { title: true, maxPoints: true } } },
    });

    const attendances = await prisma.attendance.findMany({
      where: { userId: session.id, date: { gte: weekAgo } },
    });

    const points = await prisma.gamificationPoint.aggregate({
      where: { userId: session.id, createdAt: { gte: weekAgo } },
      _sum: { points: true },
    });

    return NextResponse.json({
      period: { from: weekAgo.toISOString().split("T")[0], to: now.toISOString().split("T")[0] },
      tasksCompleted: submissions.length,
      tasksTotal: await prisma.task.count({ where: { batch: { enrollments: { some: { studentId: session.id } } }, createdAt: { gte: weekAgo } } }),
      attendanceDays: attendances.filter(a => a.status === "present").length,
      totalDays: 7,
      pointsEarned: points._sum.points || 0,
      submissions: submissions.map(s => ({ task: s.task.title, score: s.percentage, status: s.status })),
    });
  }

  // Admin/TL report
  const totalSubmissions = await prisma.submission.count({ where: { createdAt: { gte: weekAgo } } });
  const avgAttendance = await prisma.attendance.count({ where: { date: { gte: weekAgo }, status: "present" } });
  const newStudents = await prisma.user.count({ where: { role: "student", createdAt: { gte: weekAgo } } });
  const completions = await prisma.enrollment.count({ where: { completedAt: { gte: weekAgo } } });

  return NextResponse.json({
    period: { from: weekAgo.toISOString().split("T")[0], to: now.toISOString().split("T")[0] },
    totalSubmissions,
    avgAttendance,
    newStudents,
    completions,
  });
}
