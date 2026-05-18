import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, type, url, fileUrl, dayNumber, order, batchId } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (type !== undefined) data.type = type;
    if (url !== undefined) data.url = url;
    if (fileUrl !== undefined) data.fileUrl = fileUrl;
    if (dayNumber !== undefined) data.dayNumber = dayNumber ? parseInt(dayNumber) : null;
    if (order !== undefined) data.order = parseInt(order);
    if (batchId !== undefined) data.batchId = batchId;

    const resource = await prisma.resource.update({ where: { id }, data });
    return NextResponse.json(resource);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
