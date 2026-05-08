import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const enrollmentId = searchParams.get("enrollmentId");

  const where: Record<string, unknown> = {};
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
          student: { select: { id: true, name: true, email: true, phone: true, collegeName: true, degree: true } },
          batch: { include: { program: { select: { title: true, domain: true } } } },
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

    // Send email notification to student
    const student = interview.enrollment.student;
    const programTitle = interview.enrollment.batch.program.title;
    const interviewDate = new Date(scheduledAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const interviewTime = new Date(scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const interviewMode = (mode || "online").charAt(0).toUpperCase() + (mode || "online").slice(1);

    fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3005"}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: student.email,
        subject: `Interview Scheduled — ${programTitle}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#4338ca;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h2 style="margin:0">Interview Scheduled!</h2>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>Your interview for <strong>${programTitle}</strong> has been scheduled. Please find the details below:</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Date</td><td style="padding:8px;border:1px solid #e2e8f0">${interviewDate}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Time</td><td style="padding:8px;border:1px solid #e2e8f0">${interviewTime}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Mode</td><td style="padding:8px;border:1px solid #e2e8f0">${interviewMode}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Duration</td><td style="padding:8px;border:1px solid #e2e8f0">${duration || 30} minutes</td></tr>
              ${meetLink ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Meeting Link</td><td style="padding:8px;border:1px solid #e2e8f0"><a href="${meetLink}" style="color:#4338ca">${meetLink}</a></td></tr>` : ""}
              ${location ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Location</td><td style="padding:8px;border:1px solid #e2e8f0">${location}</td></tr>` : ""}
            </table>
            <p>Please be on time and keep your documents ready.</p>
            <p>Best regards,<br/><strong>KKHS Media Private Limited</strong></p>
          </div>
        </div>`,
      }),
    }).catch(() => {});

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

    // Update enrollment status based on result
    if (result === "selected" || result === "shortlisted" || result === "rejected") {
      await prisma.enrollment.update({
        where: { id: interview.enrollmentId },
        data: { status: result },
      });
    }

    return NextResponse.json(interview);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update interview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
