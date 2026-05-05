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

    // Update enrollment status
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "interview_scheduled" },
    });

    const interview = await prisma.interview.create({
      data: {
        enrollmentId,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 30,
        mode: mode || "online",
        meetLink: meetLink || null,
        location: location || null,
        interviewerId: session.id,
      },
    });

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
    const { id, status, feedback, rating, result } = body;

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
