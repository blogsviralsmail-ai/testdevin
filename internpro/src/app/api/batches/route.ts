import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");

  const where: Record<string, unknown> = {};
  if (programId) where.programId = programId;

  // Students should only see their enrolled batches
  if (session && session.role === "student") {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.id, status: { in: ["applied", "interview_scheduled", "shortlisted", "selected", "active", "completed"] } },
      select: { batchId: true },
    });
    where.id = { in: enrollments.map(e => e.batchId) };
  }

  const batches = await prisma.batch.findMany({
    where,
    include: {
      program: { select: { id: true, title: true, domain: true, mode: true } },
      leader: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true, tasks: true, resources: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(batches);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, programId, leaderId, startDate, endDate } = body;

    if (!name || !programId || !startDate || !endDate) {
      return NextResponse.json({ error: "Name, program, start date, and end date are required" }, { status: 400 });
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        programId,
        leaderId: leaderId || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create batch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
