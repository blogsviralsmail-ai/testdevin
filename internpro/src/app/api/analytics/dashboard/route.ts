import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Program completion rates
  const enrollments = await prisma.enrollment.findMany({
    select: { status: true, batch: { select: { program: { select: { title: true } } } } },
  });

  const programStats: Record<string, { total: number; completed: number }> = {};
  enrollments.forEach(e => {
    const prog = e.batch.program.title;
    if (!programStats[prog]) programStats[prog] = { total: 0, completed: 0 };
    programStats[prog].total++;
    if (e.status === "completed") programStats[prog].completed++;
  });

  // Attendance stats (last 30 days)
  const attendances = await prisma.attendance.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    select: { status: true, date: true },
  });

  const attendanceByDay: Record<string, { present: number; absent: number }> = {};
  attendances.forEach(a => {
    const day = a.date.toISOString().split("T")[0];
    if (!attendanceByDay[day]) attendanceByDay[day] = { present: 0, absent: 0 };
    if (a.status === "present") attendanceByDay[day].present++;
    else attendanceByDay[day].absent++;
  });

  // Task completion trends
  const submissions = await prisma.submission.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { status: true, createdAt: true, percentage: true },
  });

  const tasksByWeek: Record<string, { submitted: number; reviewed: number; avgScore: number }> = {};
  submissions.forEach(s => {
    const week = getWeekNumber(s.createdAt);
    if (!tasksByWeek[week]) tasksByWeek[week] = { submitted: 0, reviewed: 0, avgScore: 0 };
    tasksByWeek[week].submitted++;
    if (s.status === "reviewed") tasksByWeek[week].reviewed++;
  });

  // Revenue
  const payments = await prisma.payment.findMany({
    where: { status: "completed" },
    select: { amount: true, createdAt: true },
  });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const monthlyRevenue: Record<string, number> = {};
  payments.forEach(p => {
    const month = p.createdAt.toISOString().substring(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.amount;
  });

  // Student performance heatmap
  const studentPerformance = await prisma.submission.groupBy({
    by: ["studentId"],
    _avg: { percentage: true },
    _count: { id: true },
  });

  // Overall stats
  const totalStudents = await prisma.user.count({ where: { role: "student" } });
  const activeStudents = await prisma.enrollment.count({ where: { status: { in: ["active", "selected"] } } });
  const totalTasks = await prisma.task.count();
  const avgAttendance = attendances.length > 0 ? (attendances.filter(a => a.status === "present").length / attendances.length * 100) : 0;

  return NextResponse.json({
    overview: { totalStudents, activeStudents, totalTasks, totalRevenue, avgAttendance: Math.round(avgAttendance) },
    programCompletion: Object.entries(programStats).map(([name, stats]) => ({ name, ...stats, rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0 })),
    attendanceTrend: Object.entries(attendanceByDay).sort().slice(-14).map(([date, stats]) => ({ date, ...stats })),
    taskTrends: Object.entries(tasksByWeek).map(([week, stats]) => ({ week, ...stats })),
    monthlyRevenue: Object.entries(monthlyRevenue).sort().map(([month, amount]) => ({ month, amount })),
    studentPerformance: studentPerformance.slice(0, 20),
  });
}

function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}
