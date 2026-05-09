import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
  if (!discussion) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const authorIds = [discussion.authorId, ...discussion.replies.map(r => r.authorId)];
  const authors = await prisma.user.findMany({ where: { id: { in: [...new Set(authorIds)] } }, select: { id: true, name: true, role: true, avatar: true } });
  const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

  return NextResponse.json({
    ...discussion,
    author: authorMap[discussion.authorId],
    replies: discussion.replies.map(r => ({ ...r, author: authorMap[r.authorId] })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.isResolved !== undefined) data.isResolved = body.isResolved;
  if (body.isPinned !== undefined) data.isPinned = body.isPinned;

  const discussion = await prisma.discussion.update({ where: { id }, data });
  return NextResponse.json(discussion);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.discussion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
