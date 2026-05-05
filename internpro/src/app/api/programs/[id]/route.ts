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

    const program = await prisma.program.update({
      where: { id },
      data: body,
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
