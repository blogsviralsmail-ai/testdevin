import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "student") {
    const [enrollments, attendances, submissions, certificates, totalTasksCount] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: session.id },
        include: { batch: { include: { program: { select: { title: true, duration: true, domain: true } } } } },
      }),
      prisma.attendance.count({ where: { userId: session.id, status: "present" } }),
      prisma.submission.findMany({ where: { studentId: session.id } }),
      prisma.certificate.count({ where: { enrollment: { studentId: session.id } } }),
      prisma.task.count({ where: { batch: { enrollments: { some: { studentId: session.id } } } } }),
    ]);

    const completedTasks = submissions.filter((s) => s.status === "reviewed").length;
    const submittedTasks = submissions.length;
    const avgPercentage = submissions.filter((s) => s.percentage).reduce((acc, s) => acc + (s.percentage || 0), 0);
    const completionPercentage = submittedTasks > 0 ? Math.round(avgPercentage / submittedTasks) : 0;

    // Enrollment status for blinking badges
    const enrollmentStatuses = enrollments.map(e => e.status);
    const hasInterviewScheduled = enrollmentStatuses.includes("interview_scheduled");
    const hasSelected = enrollmentStatuses.includes("selected");
    const hasRejected = enrollmentStatuses.includes("rejected");
    const hasShortlisted = enrollmentStatuses.includes("shortlisted");
    const currentStatus = hasSelected ? "selected" : hasShortlisted ? "shortlisted" : hasInterviewScheduled ? "interview_scheduled" : hasRejected ? "rejected" : enrollmentStatuses[0] || "applied";

    // Calculate days remaining for active enrollment
    const activeEnrollment = enrollments.find(e => e.status === "selected");
    let daysRemaining = 0;
    let totalDays = 0;
    let daysElapsed = 0;
    let programName = "";
    let progressPercent = 0;
    if (activeEnrollment) {
      programName = activeEnrollment.batch.program.title;
      const durationRaw = activeEnrollment.batch.program.duration || "30 Days";
      const durationDays = parseInt(String(durationRaw)) || 30;
      totalDays = durationDays;
      const joinDate = activeEnrollment.joiningDate ? new Date(activeEnrollment.joiningDate) : new Date(activeEnrollment.createdAt);
      const now = new Date();
      daysElapsed = Math.max(0, Math.floor((now.getTime() - joinDate.getTime()) / 86400000));
      daysRemaining = Math.max(0, totalDays - daysElapsed);
      progressPercent = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
    }

    return NextResponse.json({
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.status === "selected").length,
      totalAttendance: attendances,
      totalTasks: totalTasksCount,
      submittedTasks: submittedTasks,
      completedTasks,
      completionPercentage,
      totalCertificates: certificates,
      enrollmentStatus: currentStatus,
      hasDocuments: true,
      daysRemaining,
      totalDays,
      daysElapsed,
      programName,
      progressPercent,
    });
  }

  if (session.role === "teamleader") {
    const batches = await prisma.batch.findMany({ where: { leaderId: session.id } });
    const batchIds = batches.map((b) => b.id);
    const [students, enrollments, submissions] = await Promise.all([
      prisma.enrollment.count({ where: { batchId: { in: batchIds } } }),
      prisma.enrollment.count({ where: { batchId: { in: batchIds }, status: "selected" } }),
      prisma.submission.count({ where: { task: { batchId: { in: batchIds } }, status: "submitted" } }),
    ]);

    return NextResponse.json({
      totalBatches: batches.length,
      totalStudents: students,
      activeEnrollments: enrollments,
      completedTasks: submissions,
    });
  }

  // Admin / Organization stats
  const [students, programs, batches, pendingApps, interviews, selected, certificates, payments] = await Promise.all([
    prisma.user.count({ where: { role: "student" } }),
    prisma.program.count({ where: { isPublished: true } }),
    prisma.batch.count({ where: { isActive: true } }),
    prisma.enrollment.count({ where: { status: "applied" } }),
    prisma.interview.count({ where: { status: "scheduled" } }),
    prisma.enrollment.count({ where: { status: "selected" } }),
    prisma.certificate.count(),
    prisma.payment.findMany({ where: { status: "completed" } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({
    totalStudents: students,
    totalPrograms: programs,
    totalBatches: batches,
    pendingApplications: pendingApps,
    scheduledInterviews: interviews,
    selectedStudents: selected,
    totalCertificates: certificates,
    totalRevenue,
  });
}
