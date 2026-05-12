import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateWorkingDay } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["admin", "organization", "teamleader"].includes(session.role);
  const where: Record<string, unknown> = { status: { in: ["selected", "completed"] } };
  if (!isAdmin) where.studentId = session.id;

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true, avatar: true } },
      batch: { include: { program: { select: { title: true, domain: true, duration: true } } } },
      attendances: { select: { id: true, date: true, status: true } },
      _count: { select: { certificates: true } },
    },
  });

  const progress = enrollments.map(e => {
    const currentWorkDay = e.joiningDate ? calculateWorkingDay(e.joiningDate) : e.currentWorkDay;
    const totalDays = e.batch.program.duration;
    const completionPercent = Math.min(100, Math.round((currentWorkDay / totalDays) * 100));
    const presentDays = e.attendances.filter(a => a.status === "present").length;

    // Calculate streak
    let streak = 0;
    const sortedDates = e.attendances
      .filter(a => a.status === "present")
      .map(a => new Date(a.date).toISOString().split("T")[0])
      .sort()
      .reverse();

    if (sortedDates.length > 0) {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (diff <= 2) streak++;
          else break;
        }
      }
    }

    return {
      id: e.id,
      studentId: e.studentId,
      student: e.student,
      program: e.batch.program,
      batchName: e.batch.name,
      batchId: e.batchId,
      status: e.status,
      joiningDate: e.joiningDate,
      currentWorkDay,
      totalDays,
      completionPercent,
      presentDays,
      submissionsCount: 0,
      certificatesCount: e._count.certificates,
      streak,
    };
  });

  // Get submission counts per student
  const studentIds = progress.map(p => p.studentId);
  if (studentIds.length > 0) {
    const submissionCounts = await prisma.submission.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(submissionCounts.map(s => [s.studentId, s._count.id]));
    progress.forEach(p => { p.submissionsCount = countMap[p.studentId] || 0; });
  }

  return NextResponse.json(progress);
}
