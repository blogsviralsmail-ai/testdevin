import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all programs with batches and enrollments
  const programs = await prisma.program.findMany({
    where: { isPublished: true },
    select: {
      id: true, title: true, duration: true,
      batches: {
        select: {
          id: true, name: true,
          enrollments: {
            where: { status: { in: ["selected", "completed"] } },
            select: {
              id: true, status: true, joiningDate: true,
              attendances: { select: { date: true, status: true } },
              student: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  const analytics = programs.map(program => {
    let totalStudents = 0;
    let activeStudents = 0;
    let totalAttendanceDays = 0;
    let totalPresentDays = 0;
    let completedStudents = 0;
    const batchStats = program.batches.map(batch => {
      const students = batch.enrollments.length;
      totalStudents += students;

      const active = batch.enrollments.filter(e => e.status === "selected").length;
      activeStudents += active;
      const completed = batch.enrollments.filter(e => e.status === "completed").length;
      completedStudents += completed;

      let batchPresent = 0;
      let batchTotal = 0;
      batch.enrollments.forEach(e => {
        batchTotal += e.attendances.length;
        batchPresent += e.attendances.filter(a => a.status === "present").length;
      });
      totalAttendanceDays += batchTotal;
      totalPresentDays += batchPresent;

      return {
        batchId: batch.id,
        batchName: batch.name,
        totalStudents: students,
        activeStudents: active,
        completedStudents: completed,
        attendanceRate: batchTotal > 0 ? Math.round((batchPresent / batchTotal) * 100) : 0,
      };
    });

    const dropOffRate = totalStudents > 0 ? Math.round(((totalStudents - activeStudents - completedStudents) / totalStudents) * 100) : 0;

    return {
      programId: program.id,
      programTitle: program.title,
      duration: program.duration,
      totalStudents,
      activeStudents,
      completedStudents,
      dropOffRate: Math.max(0, dropOffRate),
      attendanceRate: totalAttendanceDays > 0 ? Math.round((totalPresentDays / totalAttendanceDays) * 100) : 0,
      batches: batchStats,
    };
  });

  // Overall stats
  const overall = {
    totalPrograms: programs.length,
    totalStudents: analytics.reduce((s, a) => s + a.totalStudents, 0),
    activeStudents: analytics.reduce((s, a) => s + a.activeStudents, 0),
    completedStudents: analytics.reduce((s, a) => s + a.completedStudents, 0),
    avgAttendanceRate: analytics.length > 0 ? Math.round(analytics.reduce((s, a) => s + a.attendanceRate, 0) / analytics.filter(a => a.totalStudents > 0).length || 1) : 0,
  };

  return NextResponse.json({ overall, programs: analytics });
}
