import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const studentId = searchParams.get("studentId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (session.role === "student") {
    where.studentId = session.id;
  } else if (session.role === "teamleader") {
    // TL only sees students in their assigned batches
    const tlBatches = await prisma.batch.findMany({
      where: { leaderId: session.id },
      select: { id: true },
    });
    where.batchId = batchId ? batchId : { in: tlBatches.map(b => b.id) };
    if (studentId) where.studentId = studentId;
  } else {
    if (studentId) where.studentId = studentId;
    if (batchId) where.batchId = batchId;
  }
  if (status) where.status = status;

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      student: {
        select: { id: true, name: true, email: true, phone: true, avatar: true, collegeName: true, degree: true, year: true, address: true, dob: true, employeeId: true, plainPassword: true, referredBy: { include: { agent: { include: { user: { select: { name: true, email: true } } } } } } },
      },
      batch: {
        include: {
          program: { select: { title: true, domain: true, feeType: true, feeAmount: true, stipendAmount: true, mode: true, duration: true } },
        },
      },
      offerLetter: true,
      experienceLetter: true,
      interviews: {
        select: { id: true, scheduledAt: true, duration: true, mode: true, meetLink: true, location: true, status: true, result: true },
        orderBy: { scheduledAt: "desc" as const },
        take: 1,
      },
      _count: { select: { attendances: true, certificates: true, payments: true, interviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(enrollments);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: session.id, batchId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already applied for this program" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: session.id,
        batchId,
        status: "applied",
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to apply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
