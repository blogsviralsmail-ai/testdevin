import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, ids, data } = await request.json();
  if (!action || !ids?.length) return NextResponse.json({ error: "action and ids required" }, { status: 400 });

  let count = 0;

  switch (action) {
    case "bulk_select": {
      for (const id of ids) {
        await prisma.enrollment.update({ where: { id }, data: { status: "selected" } });
        count++;
      }
      await logActivity("bulk_select", "enrollment", undefined, `Selected ${count} students`, session.id, session.name);
      break;
    }

    case "bulk_reject": {
      for (const id of ids) {
        await prisma.enrollment.update({ where: { id }, data: { status: "rejected" } });
        count++;
      }
      await logActivity("bulk_reject", "enrollment", undefined, `Rejected ${count} students`, session.id, session.name);
      break;
    }

    case "bulk_email": {
      const { subject, message } = data || {};
      if (!subject || !message) return NextResponse.json({ error: "subject and message required" }, { status: 400 });

      const enrollments = await prisma.enrollment.findMany({
        where: { id: { in: ids } },
        include: { student: { select: { email: true, name: true } } },
      });

      for (const e of enrollments) {
        const html = `<p>Dear ${e.student.name},</p><p>${message}</p>`;
        await sendEmail({ to: e.student.email, subject, html });
        count++;
      }
      await logActivity("bulk_email", "enrollment", undefined, `Emailed ${count} students: ${subject}`, session.id, session.name);
      break;
    }

    case "bulk_attendance": {
      const { date, status } = data || {};
      if (!date || !status) return NextResponse.json({ error: "date and status required" }, { status: 400 });

      for (const enrollmentId of ids) {
        const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, select: { studentId: true } });
        if (!enrollment) continue;

        await prisma.attendance.upsert({
          where: { enrollmentId_date: { enrollmentId, date: new Date(date) } },
          create: { enrollmentId, userId: enrollment.studentId, date: new Date(date), status, method: "bulk" },
          update: { status, method: "bulk" },
        });
        count++;
      }
      await logActivity("bulk_attendance", "attendance", undefined, `Marked ${count} students ${status} on ${date}`, session.id, session.name);
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ success: true, count });
}
