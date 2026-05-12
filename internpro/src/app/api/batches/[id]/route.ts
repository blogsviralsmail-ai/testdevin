import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { teamLeaderId, name, startDate, endDate } = body;

    const data: Record<string, unknown> = {};
    if (teamLeaderId !== undefined) data.leaderId = teamLeaderId || null;
    if (name) data.name = name;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate) data.endDate = new Date(endDate);

    const batch = await prisma.batch.update({
      where: { id },
      data,
    });

    return NextResponse.json(batch);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update batch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
