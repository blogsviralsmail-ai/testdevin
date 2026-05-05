import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "mentor"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.status === "completed") data.completedAt = new Date();

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data,
    });

    return NextResponse.json(enrollment);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update enrollment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
