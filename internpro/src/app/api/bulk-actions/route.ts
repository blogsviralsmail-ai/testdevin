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

    case "bulk_delete_enrollments": {
      for (const id of ids) {
        await prisma.enrollment.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "enrollment", undefined, `Deleted ${count} enrollments`, session.id, session.name);
      break;
    }

    case "bulk_delete_users": {
      for (const id of ids) {
        await prisma.user.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "user", undefined, `Deleted ${count} users`, session.id, session.name);
      break;
    }

    case "bulk_delete_programs": {
      for (const id of ids) {
        await prisma.program.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "program", undefined, `Deleted ${count} programs`, session.id, session.name);
      break;
    }

    case "bulk_delete_holidays": {
      for (const id of ids) {
        await prisma.holiday.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "holiday", undefined, `Deleted ${count} holidays`, session.id, session.name);
      break;
    }

    case "bulk_delete_announcements": {
      for (const id of ids) {
        await prisma.announcement.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "announcement", undefined, `Deleted ${count} announcements`, session.id, session.name);
      break;
    }

    case "bulk_delete_discussions": {
      for (const id of ids) {
        await prisma.discussion.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "discussion", undefined, `Deleted ${count} discussions`, session.id, session.name);
      break;
    }

    case "bulk_delete_jobs": {
      for (const id of ids) {
        await prisma.jobPosting.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "job", undefined, `Deleted ${count} jobs`, session.id, session.name);
      break;
    }

    case "bulk_delete_testimonials": {
      for (const id of ids) {
        await prisma.testimonial.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "testimonial", undefined, `Deleted ${count} testimonials`, session.id, session.name);
      break;
    }

    case "bulk_delete_campaigns": {
      for (const id of ids) {
        await prisma.emailCampaign.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "campaign", undefined, `Deleted ${count} campaigns`, session.id, session.name);
      break;
    }

    case "bulk_delete_sessions": {
      for (const id of ids) {
        await prisma.liveSession.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "liveSession", undefined, `Deleted ${count} live sessions`, session.id, session.name);
      break;
    }

    case "bulk_delete_leaves": {
      for (const id of ids) {
        await prisma.leaveRequest.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "leaveRequest", undefined, `Deleted ${count} leave requests`, session.id, session.name);
      break;
    }

    case "bulk_delete_tasks": {
      for (const id of ids) {
        await prisma.task.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "task", undefined, `Deleted ${count} tasks`, session.id, session.name);
      break;
    }

    case "bulk_delete_resources": {
      for (const id of ids) {
        await prisma.resource.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "resource", undefined, `Deleted ${count} resources`, session.id, session.name);
      break;
    }

    case "bulk_delete_quizzes": {
      for (const id of ids) {
        await prisma.quiz.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "quiz", undefined, `Deleted ${count} quizzes`, session.id, session.name);
      break;
    }

    case "bulk_delete_salaries": {
      for (const id of ids) {
        await prisma.salary.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "salary", undefined, `Deleted ${count} salary records`, session.id, session.name);
      break;
    }

    case "bulk_delete_submissions": {
      for (const id of ids) {
        await prisma.submission.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "submission", undefined, `Deleted ${count} submissions`, session.id, session.name);
      break;
    }

    case "bulk_delete_templates": {
      for (const id of ids) {
        await prisma.offerLetterTemplate.delete({ where: { id } }).catch(() => {});
        count++;
      }
      await logActivity("bulk_delete", "template", undefined, `Deleted ${count} templates`, session.id, session.name);
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ success: true, count });
}
