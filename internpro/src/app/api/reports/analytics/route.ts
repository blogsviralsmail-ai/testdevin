import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type") || "overview";

  if (type === "overview") {
    const [
      totalStudents, activeStudents, completedStudents,
      totalPrograms, totalBatches, totalPayments,
      enrollmentsByStatus, monthlyEnrollments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "student", deletedAt: null } }),
      prisma.enrollment.count({ where: { status: "selected" } }),
      prisma.enrollment.count({ where: { status: "completed" } }),
      prisma.program.count(),
      prisma.batch.count(),
      prisma.payment.findMany({ where: { status: "completed" } }),
      prisma.enrollment.groupBy({ by: ["status"], _count: true }),
      prisma.enrollment.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalRevenue = totalPayments.reduce((sum, p) => sum + p.amount, 0);

    // Monthly enrollment trend (last 12 months)
    const monthlyTrend: Record<string, number> = {};
    for (const e of monthlyEnrollments) {
      const month = new Date(e.createdAt).toISOString().slice(0, 7);
      monthlyTrend[month] = (monthlyTrend[month] || 0) + 1;
    }

    return NextResponse.json({
      totalStudents, activeStudents, completedStudents,
      dropoutCount: enrollmentsByStatus.find(e => e.status === "rejected")?._count || 0,
      totalPrograms, totalBatches,
      totalRevenue,
      enrollmentsByStatus: Object.fromEntries(enrollmentsByStatus.map(e => [e.status, e._count])),
      monthlyTrend,
    });
  }

  if (type === "batch-comparison") {
    const batches = await prisma.batch.findMany({
      where: { isActive: true },
      include: {
        program: { select: { title: true } },
        _count: { select: { enrollments: true } },
        enrollments: {
          include: {
            student: { select: { name: true } },
          },
        },
      },
    });

    const batchStats = await Promise.all(
      batches.map(async (batch) => {
        const studentIds = batch.enrollments.map(e => e.studentId);
        const [attendanceCount, submissionCount, avgScore] = await Promise.all([
          prisma.attendance.count({ where: { userId: { in: studentIds }, status: "present" } }),
          prisma.submission.count({ where: { studentId: { in: studentIds } } }),
          prisma.submission.aggregate({ where: { studentId: { in: studentIds }, percentage: { not: null } }, _avg: { percentage: true } }),
        ]);

        return {
          batchName: batch.name,
          programName: batch.program.title,
          studentCount: batch._count.enrollments,
          totalAttendance: attendanceCount,
          avgAttendancePerStudent: studentIds.length > 0 ? Math.round(attendanceCount / studentIds.length) : 0,
          totalSubmissions: submissionCount,
          avgScore: Math.round(avgScore._avg.percentage || 0),
        };
      })
    );

    return NextResponse.json({ batchStats });
  }

  if (type === "revenue") {
    const payments = await prisma.payment.findMany({
      where: { status: "completed" },
      include: {
        enrollment: { include: { batch: { include: { program: { select: { title: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const monthlyRevenue: Record<string, number> = {};
    const programRevenue: Record<string, number> = {};
    for (const p of payments) {
      const month = new Date(p.createdAt).toISOString().slice(0, 7);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.amount;
      const prog = p.enrollment?.batch?.program?.title || "Unknown";
      programRevenue[prog] = (programRevenue[prog] || 0) + p.amount;
    }

    return NextResponse.json({
      totalRevenue: payments.reduce((s, p) => s + p.amount, 0),
      totalPayments: payments.length,
      monthlyRevenue,
      programRevenue,
      recentPayments: payments.slice(0, 20).map(p => ({
        amount: p.amount,
        date: p.createdAt,
        program: p.enrollment?.batch?.program?.title || "Unknown",
        method: p.method,
      })),
    });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
