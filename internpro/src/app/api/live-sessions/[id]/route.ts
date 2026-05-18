import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.title) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.meetLink !== undefined) data.meetLink = body.meetLink;
  if (body.platform) data.platform = body.platform;
  if (body.scheduledAt) data.scheduledAt = new Date(body.scheduledAt);
  if (body.duration) data.duration = body.duration;
  if (body.status) data.status = body.status;
  if (body.recordingUrl !== undefined) data.recordingUrl = body.recordingUrl;

  const liveSession = await prisma.liveSession.update({ where: { id }, data });
  return NextResponse.json(liveSession);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.liveSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
