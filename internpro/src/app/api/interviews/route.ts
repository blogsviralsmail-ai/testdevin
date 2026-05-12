import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyApplicationStatusChange } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

function generateICS(summary: string, description: string, startDate: Date, durationMins: number, location: string, organizer: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatDate = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const end = new Date(startDate.getTime() + durationMins * 60000);
  const uid = `interview-${Date.now()}@internpro`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//InternPro//Interview//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : "",
    `ORGANIZER:mailto:${organizer}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Interview Reminder",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Interview in 10 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const enrollmentId = searchParams.get("enrollmentId");

  const where: Record<string, unknown> = { enrollment: { student: { deletedAt: null } } };
  if (status) where.status = status;
  if (enrollmentId) where.enrollmentId = enrollmentId;

  // Students can only see their own interviews
  if (session.role === "student") {
    const studentEnrollments = await prisma.enrollment.findMany({
      where: { studentId: session.id },
      select: { id: true },
    });
    where.enrollmentId = { in: studentEnrollments.map(e => e.id) };
  }

  const interviews = await prisma.interview.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, email: true, phone: true, collegeName: true, degree: true, avatar: true, referredBy: { include: { agent: { include: { user: { select: { name: true, email: true } } } } } } } },
          batch: { select: { id: true, name: true, program: { select: { id: true, title: true, domain: true } } } },
        },
      },
      interviewer: { select: { name: true, email: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(interviews);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, scheduledAt, duration, mode, meetLink, location } = body;

    if (!enrollmentId || !scheduledAt) {
      return NextResponse.json({ error: "Enrollment ID and scheduled date are required" }, { status: 400 });
    }

    const interview = await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "interview_scheduled" },
      });

      return tx.interview.create({
        data: {
          enrollmentId,
          scheduledAt: new Date(scheduledAt),
          duration: duration || 30,
          mode: mode || "online",
          meetLink: meetLink || null,
          location: location || null,
          interviewerId: session.id,
        },
        include: {
          enrollment: {
            include: {
              student: { select: { name: true, email: true } },
              batch: { include: { program: { select: { title: true } } } },
            },
          },
        },
      });
    });

    // Send email notification to BOTH student and admin with calendar invite
    const student = interview.enrollment.student;
    const programTitle = interview.enrollment.batch.program.title;
    const startDt = new Date(scheduledAt);
    const interviewDate = startDt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const interviewTime = startDt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const interviewMode = (mode || "online").charAt(0).toUpperCase() + (mode || "online").slice(1);
    const dur = duration || 30;

    // Generate .ics calendar invite
    const icsContent = generateICS(
      `Interview — ${programTitle} — ${student.name}`,
      `Interview for ${programTitle} internship. Candidate: ${student.name}. Mode: ${interviewMode}.${meetLink ? ` Link: ${meetLink}` : ""}`,
      startDt,
      dur,
      meetLink || location || "",
      session.email || "hari@kkhsmedia.com"
    );
    const icsBuffer = Buffer.from(icsContent, "utf-8");
    const calendarAttachment = { filename: "interview.ics", content: icsBuffer, contentType: "text/calendar" };

    const emailBody = `
      <h2 style="color:#1f2937;margin:0 0 16px;">Interview Scheduled!</h2>
      <p style="color:#4b5563;">Interview for <strong>${programTitle}</strong> has been scheduled.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Candidate</td><td style="padding:8px;border:1px solid #e2e8f0">${student.name} (${student.email})</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Date</td><td style="padding:8px;border:1px solid #e2e8f0">${interviewDate}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Time</td><td style="padding:8px;border:1px solid #e2e8f0">${interviewTime}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Mode</td><td style="padding:8px;border:1px solid #e2e8f0">${interviewMode}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Duration</td><td style="padding:8px;border:1px solid #e2e8f0">${dur} minutes</td></tr>
        ${meetLink ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Meeting Link</td><td style="padding:8px;border:1px solid #e2e8f0"><a href="${meetLink}" style="color:#0EA5B8">${meetLink}</a></td></tr>` : ""}
        ${location ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Location</td><td style="padding:8px;border:1px solid #e2e8f0">${location}</td></tr>` : ""}
      </table>
      <p style="color:#4b5563;">A calendar invite (.ics) is attached — open it to add this event to your Google Calendar / Outlook with automatic reminders.</p>
    `;

    // Send to student
    sendEmail({
      to: student.email,
      subject: `Interview Scheduled — ${programTitle}`,
      html: `<p style="color:#4b5563;">Dear <strong>${student.name}</strong>,</p>
        <p style="color:#4b5563;">Your interview has been scheduled. Please be on time and keep your documents ready.</p>
        ${emailBody}`,
      attachments: [calendarAttachment],
    }).catch(() => {});

    // Send to all admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ["admin", "organization"] } },
      select: { email: true, name: true },
    });
    for (const admin of admins) {
      sendEmail({
        to: admin.email,
        subject: `Interview Scheduled — ${student.name} — ${programTitle}`,
        html: `<p style="color:#4b5563;">Hi ${admin.name},</p>
          <p style="color:#4b5563;">A new interview has been scheduled.</p>
          ${emailBody}`,
        attachments: [calendarAttachment],
      }).catch(() => {});
    }

    // Create in-app notification for student
    prisma.notification.create({
      data: {
        userId: interview.enrollment.studentId,
        type: "interview_scheduled",
        title: "Interview Scheduled",
        message: `Your interview for ${programTitle} is scheduled on ${interviewDate} at ${interviewTime}. Mode: ${interviewMode}${meetLink ? `. Link: ${meetLink}` : ""}`,
      },
    }).catch(() => {});

    return NextResponse.json(interview, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to schedule interview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, feedback, rating, result, meetLink } = body;

    if (!id) {
      return NextResponse.json({ error: "Interview ID is required" }, { status: 400 });
    }

    const interview = await prisma.interview.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(feedback !== undefined && { feedback }),
        ...(rating !== undefined && { rating }),
        ...(result && { result }),
        ...(meetLink !== undefined && { meetLink }),
      },
    });

    // Update enrollment status based on result and send email
    if (result === "selected" || result === "shortlisted" || result === "rejected") {
      const enrollment = await prisma.enrollment.update({
        where: { id: interview.enrollmentId },
        data: { status: result },
        include: { student: { select: { email: true, name: true } }, batch: { include: { program: { select: { title: true } } } } },
      });
      notifyApplicationStatusChange(enrollment.student.email, enrollment.student.name, result, enrollment.batch.program.title).catch(() => {});
    }

    return NextResponse.json(interview);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update interview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
