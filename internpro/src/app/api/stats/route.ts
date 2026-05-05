import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "admin" || session.role === "organization") {
      const [totalStudents, totalPrograms, totalBatches, activeEnrollments, totalCertificates, totalPayments] =
        await Promise.all([
          prisma.user.count({ where: { role: "student" } }),
          prisma.program.count(),
          prisma.batch.count(),
          prisma.enrollment.count({ where: { status: { in: ["active", "approved"] } } }),
          prisma.certificate.count(),
          prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "completed", type: "fee" } }),
        ]);

      return NextResponse.json({
        totalStudents,
        totalPrograms,
        totalBatches,
        activeEnrollments,
        totalCertificates,
        totalRevenue: totalPayments._sum.amount || 0,
      });
    }

    if (session.role === "student") {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: session.id },
        include: {
          batch: { include: { program: true } },
          attendances: true,
          certificates: true,
          _count: { select: { attendances: true } },
        },
      });

      const totalTasks = await prisma.task.count({
        where: {
          batchId: { in: enrollments.map((e) => e.batchId) },
        },
      });

      const completedTasks = await prisma.submission.count({
        where: {
          studentId: session.id,
          status: { in: ["submitted", "approved"] },
        },
      });

      return NextResponse.json({
        totalEnrollments: enrollments.length,
        activeEnrollments: enrollments.filter((e) => e.status === "active" || e.status === "approved").length,
        totalAttendance: enrollments.reduce((sum, e) => sum + e.attendances.length, 0),
        totalCertificates: enrollments.reduce((sum, e) => sum + e.certificates.length, 0),
        totalTasks,
        completedTasks,
      });
    }

    return NextResponse.json({});
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
