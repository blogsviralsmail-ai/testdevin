import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

const adminRemarks = [
  "Excellent work! Consistently delivers high-quality output.",
  "Outstanding performance. Shows great initiative and dedication.",
  "Very good work ethic. Reliable and produces quality results.",
  "Impressive progress. Demonstrates strong skills and commitment.",
  "Exceptional contribution to the team. Highly recommended.",
  "Great attention to detail. Completes tasks efficiently.",
  "Remarkable dedication. Goes above and beyond expectations.",
  "Superb quality of work. A valuable team member.",
  "Consistently meets deadlines with excellent output quality.",
  "Shows excellent problem-solving skills and proactive approach.",
];

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { enrollmentIds, joiningDate: jdOverride } = body;

  if (!enrollmentIds?.length) {
    return NextResponse.json({ error: "enrollmentIds required" }, { status: 400 });
  }

  let totalAttendance = 0;
  let totalTasks = 0;
  let totalRemarks = 0;

  for (const enrollmentId of enrollmentIds) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { batch: { select: { id: true, programId: true } } },
    });
    if (!enrollment) continue;

    // Use override DOJ or existing joiningDate
    const doj = jdOverride ? new Date(jdOverride) : enrollment.joiningDate;
    if (!doj) continue;

    // Update joiningDate if override provided
    if (jdOverride) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { joiningDate: new Date(jdOverride) },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(doj);
    startDate.setHours(0, 0, 0, 0);

    // Generate attendance for each working day (skip Sundays) from DOJ to today
    let workDay = 0;
    const current = new Date(startDate);
    while (current <= today) {
      const dayOfWeek = current.getDay(); // 0 = Sunday
      if (dayOfWeek !== 0) {
        workDay++;
        const dateStr = current.toISOString().split("T")[0];
        const attendanceDate = new Date(dateStr);

        // Create attendance (skip if exists)
        try {
          await prisma.attendance.upsert({
            where: { enrollmentId_date: { enrollmentId, date: attendanceDate } },
            create: {
              enrollmentId,
              userId: enrollment.studentId,
              date: attendanceDate,
              status: "present",
              workDay,
              checkIn: "09:30",
              checkOut: "18:30",
              method: "bulk-autofill",
              notes: null,
            },
            update: {},
          });
          totalAttendance++;
        } catch {
          // Skip duplicates
        }
      }
      current.setDate(current.getDate() + 1);
    }

    // Auto-complete tasks for this batch up to current working day
    const tasks = await prisma.task.findMany({
      where: { batchId: enrollment.batch.id },
      orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
    });

    for (const task of tasks) {
      if (task.dayNumber && task.dayNumber > workDay) continue;
      try {
        await prisma.submission.upsert({
          where: { taskId_studentId: { taskId: task.id, studentId: enrollment.studentId } },
          create: {
            taskId: task.id,
            studentId: enrollment.studentId,
            content: "Completed",
            status: "reviewed",
            percentage: 85 + Math.floor(Math.random() * 16), // 85-100
            feedback: adminRemarks[Math.floor(Math.random() * adminRemarks.length)],
            reviewedBy: session.id,
          },
          update: {},
        });
        totalTasks++;
      } catch {
        // Skip duplicates
      }
    }

    // Update admin remarks on enrollment
    const remark = adminRemarks[Math.floor(Math.random() * adminRemarks.length)];
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        adminRemarks: remark,
        currentWorkDay: workDay,
        status: enrollment.status === "applied" ? "selected" : enrollment.status,
      },
    });
    totalRemarks++;
  }

  await logActivity(
    "bulk_autofill", "enrollment", undefined,
    `Auto-filled ${totalAttendance} attendance records, ${totalTasks} task submissions, ${totalRemarks} admin remarks for ${enrollmentIds.length} enrollments`,
    session.id, session.name
  );

  return NextResponse.json({
    ok: true,
    attendance: totalAttendance,
    tasks: totalTasks,
    remarks: totalRemarks,
    enrollments: enrollmentIds.length,
  });
}
