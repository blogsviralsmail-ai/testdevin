import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Cron-triggered endpoint: sends interview reminders
// - 15 minutes before interview → email + WhatsApp to student + admin
// - At interview start time → email + WhatsApp to student + admin
// Protected by secret query param

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "kkhs-reminder-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in15Min = new Date(now.getTime() + 15 * 60 * 1000);
  const oneMinAgo = new Date(now.getTime() - 60 * 1000);

  // Find interviews needing 15-min reminder
  const upcoming15 = await prisma.interview.findMany({
    where: {
      status: "scheduled",
      reminder15Sent: false,
      scheduledAt: { gte: now, lte: in15Min },
    },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          batch: { include: { program: { select: { title: true } } } },
        },
      },
      interviewer: { select: { name: true, email: true } },
    },
  });

  // Find interviews needing start-time reminder
  const startingNow = await prisma.interview.findMany({
    where: {
      status: "scheduled",
      reminderStartSent: false,
      scheduledAt: { gte: oneMinAgo, lte: now },
    },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, email: true, phone: true } },
          batch: { include: { program: { select: { title: true } } } },
        },
      },
      interviewer: { select: { name: true, email: true } },
    },
  });

  // Get all admins for notifications
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "organization"] }, isActive: true },
    select: { id: true, name: true, email: true, phone: true },
  });

  const results: string[] = [];

  // Process 15-min reminders
  for (const interview of upcoming15) {
    const student = interview.enrollment.student;
    const program = interview.enrollment.batch.program.title;
    const scheduledAt = new Date(interview.scheduledAt);
    const timeStr = scheduledAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const dateStr = scheduledAt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
    const mode = interview.mode.charAt(0).toUpperCase() + interview.mode.slice(1);
    const meetLink = interview.meetLink;

    // Email to student
    sendEmail({
      to: student.email,
      subject: `Interview Reminder — Starting in 15 minutes! — ${program}`,
      html: buildReminderEmail(
        student.name,
        program,
        dateStr,
        timeStr,
        mode,
        meetLink,
        "15 minutes",
        "student"
      ),
    }).catch(() => {});

    // WhatsApp to student
    if (student.phone) {
      sendWhatsAppMessage({
        phone: student.phone,
        message: `🔔 Interview Reminder!\n\nHi ${student.name}, your interview for ${program} is starting in 15 minutes!\n\n📅 ${dateStr}\n⏰ ${timeStr}\n📍 Mode: ${mode}${meetLink ? `\n🔗 Join: ${meetLink}` : ""}\n\nPlease be ready and join on time.`,
      }).catch(() => {});
    }

    // Notify all admins
    for (const admin of admins) {
      sendEmail({
        to: admin.email,
        subject: `Interview Reminder — ${student.name} — Starting in 15 min — ${program}`,
        html: buildReminderEmail(
          student.name,
          program,
          dateStr,
          timeStr,
          mode,
          meetLink,
          "15 minutes",
          "admin",
          admin.name
        ),
      }).catch(() => {});

      if (admin.phone) {
        sendWhatsAppMessage({
          phone: admin.phone,
          message: `🔔 Interview Reminder!\n\nHi ${admin.name}, interview with ${student.name} for ${program} starts in 15 minutes!\n\n📅 ${dateStr}\n⏰ ${timeStr}\n📍 Mode: ${mode}${meetLink ? `\n🔗 Join: ${meetLink}` : ""}\n\nPlease be ready.`,
        }).catch(() => {});
      }
    }

    // Create in-app notification for student
    prisma.notification.create({
      data: {
        userId: student.id,
        type: "interview_reminder",
        title: "Interview in 15 minutes!",
        message: `Your interview for ${program} starts at ${timeStr}. ${meetLink ? `Join: ${meetLink}` : `Mode: ${mode}`}`,
        link: "/dashboard",
      },
    }).catch(() => {});

    // Mark as sent
    await prisma.interview.update({
      where: { id: interview.id },
      data: { reminder15Sent: true },
    });

    results.push(`15min-reminder: ${student.name} (${program})`);
  }

  // Process start-time reminders
  for (const interview of startingNow) {
    const student = interview.enrollment.student;
    const program = interview.enrollment.batch.program.title;
    const scheduledAt = new Date(interview.scheduledAt);
    const timeStr = scheduledAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const dateStr = scheduledAt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
    const mode = interview.mode.charAt(0).toUpperCase() + interview.mode.slice(1);
    const meetLink = interview.meetLink;

    // Email to student
    sendEmail({
      to: student.email,
      subject: `Interview Starting NOW! — ${program}`,
      html: buildReminderEmail(
        student.name,
        program,
        dateStr,
        timeStr,
        mode,
        meetLink,
        "now",
        "student"
      ),
    }).catch(() => {});

    // WhatsApp to student
    if (student.phone) {
      sendWhatsAppMessage({
        phone: student.phone,
        message: `🚨 Interview Starting NOW!\n\nHi ${student.name}, your interview for ${program} is starting RIGHT NOW!\n\n📅 ${dateStr}\n⏰ ${timeStr}\n📍 Mode: ${mode}${meetLink ? `\n🔗 JOIN NOW: ${meetLink}` : ""}\n\nPlease join immediately!`,
      }).catch(() => {});
    }

    // Notify all admins
    for (const admin of admins) {
      sendEmail({
        to: admin.email,
        subject: `Interview Starting NOW — ${student.name} — ${program}`,
        html: buildReminderEmail(
          student.name,
          program,
          dateStr,
          timeStr,
          mode,
          meetLink,
          "now",
          "admin",
          admin.name
        ),
      }).catch(() => {});

      if (admin.phone) {
        sendWhatsAppMessage({
          phone: admin.phone,
          message: `🚨 Interview Starting NOW!\n\nHi ${admin.name}, interview with ${student.name} for ${program} is starting NOW!\n\n📅 ${dateStr}\n⏰ ${timeStr}\n📍 Mode: ${mode}${meetLink ? `\n🔗 JOIN NOW: ${meetLink}` : ""}\n\nPlease join immediately!`,
        }).catch(() => {});
      }
    }

    // Create in-app notification for student
    prisma.notification.create({
      data: {
        userId: student.id,
        type: "interview_started",
        title: "Interview Starting NOW!",
        message: `Your interview for ${program} is starting now! ${meetLink ? `Join: ${meetLink}` : `Mode: ${mode}`}`,
        link: "/dashboard",
      },
    }).catch(() => {});

    // Mark as sent
    await prisma.interview.update({
      where: { id: interview.id },
      data: { reminderStartSent: true },
    });

    results.push(`start-reminder: ${student.name} (${program})`);
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    reminders15: upcoming15.length,
    remindersStart: startingNow.length,
    details: results,
  });
}

function buildReminderEmail(
  studentName: string,
  program: string,
  dateStr: string,
  timeStr: string,
  mode: string,
  meetLink: string | null,
  timing: "15 minutes" | "now",
  recipient: "student" | "admin",
  adminName?: string
): string {
  const isNow = timing === "now";
  const urgency = isNow ? "🚨" : "🔔";
  const headingColor = isNow ? "#dc2626" : "#f59e0b";
  const heading = isNow
    ? "Interview Starting NOW!"
    : "Interview Starting in 15 Minutes!";

  const greeting = recipient === "student"
    ? `Dear <strong>${studentName}</strong>,`
    : `Hi <strong>${adminName}</strong>,`;

  const mainMessage = recipient === "student"
    ? isNow
      ? `Your interview for <strong>${program}</strong> is starting <strong>RIGHT NOW</strong>! Please join immediately.`
      : `Your interview for <strong>${program}</strong> is starting in <strong>15 minutes</strong>. Please be ready and join on time.`
    : isNow
      ? `Interview with <strong>${studentName}</strong> for <strong>${program}</strong> is starting <strong>RIGHT NOW</strong>!`
      : `Interview with <strong>${studentName}</strong> for <strong>${program}</strong> starts in <strong>15 minutes</strong>.`;

  const joinButton = meetLink
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${meetLink}" style="background:${isNow ? "#dc2626" : "#0EA5B8"};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
          ${urgency} ${isNow ? "JOIN NOW" : "Join Interview"}
        </a>
      </div>`
    : "";

  return `
    <h2 style="color:${headingColor};margin:0 0 16px;">${urgency} ${heading}</h2>
    <p style="color:#4b5563;line-height:1.6;">${greeting}</p>
    <p style="color:#4b5563;line-height:1.6;">${mainMessage}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${recipient === "admin" ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Candidate</td><td style="padding:8px;border:1px solid #e2e8f0">${studentName}</td></tr>` : ""}
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Program</td><td style="padding:8px;border:1px solid #e2e8f0">${program}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Date</td><td style="padding:8px;border:1px solid #e2e8f0">${dateStr}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Time</td><td style="padding:8px;border:1px solid #e2e8f0">${timeStr}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Mode</td><td style="padding:8px;border:1px solid #e2e8f0">${mode}</td></tr>
      ${meetLink ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Meeting Link</td><td style="padding:8px;border:1px solid #e2e8f0"><a href="${meetLink}" style="color:#0EA5B8">${meetLink}</a></td></tr>` : ""}
    </table>
    ${joinButton}
    <p style="color:#9ca3af;font-size:13px;">${isNow ? "This is an urgent notification. Please join immediately!" : "Please ensure you are available and ready at the scheduled time."}</p>
  `;
}
