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
  if (batchId) where.batchId = batchId;
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
      batch: {
        include: {
          program: { select: { title: true, domain: true, feeType: true, feeAmount: true, stipendAmount: true } },
        },
      },
      _count: { select: { attendances: true, certificates: true, payments: true } },
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
    const { studentId, batchId } = body;

    const useStudentId = (studentId && ["admin", "organization", "mentor"].includes(session.role)) ? studentId : session.id;

    const existing = await prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: useStudentId, batchId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already enrolled in this batch" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: useStudentId,
        batchId,
        status: session.role === "student" ? "pending" : "approved",
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to enroll";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
