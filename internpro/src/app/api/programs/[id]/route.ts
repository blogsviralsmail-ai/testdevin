import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      organization: true,
      batches: {
        include: {
          mentor: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true, tasks: true, resources: true } },
        },
      },
    },
  });

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  return NextResponse.json(program);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, domain, mode, duration, feeType, feeAmount, stipendAmount, maxSeats, isPublished, thumbnail } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (domain !== undefined) data.domain = domain;
    if (mode !== undefined) data.mode = mode;
    if (duration !== undefined) data.duration = duration;
    if (feeType !== undefined) data.feeType = feeType;
    if (feeAmount !== undefined) data.feeAmount = feeAmount;
    if (stipendAmount !== undefined) data.stipendAmount = stipendAmount;
    if (maxSeats !== undefined) data.maxSeats = maxSeats;
    if (isPublished !== undefined) data.isPublished = isPublished;
    if (thumbnail !== undefined) data.thumbnail = thumbnail;

    const program = await prisma.program.update({
      where: { id },
      data,
    });

    return NextResponse.json(program);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update program";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.program.delete({ where: { id } });

    return NextResponse.json({ message: "Program deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete program";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
