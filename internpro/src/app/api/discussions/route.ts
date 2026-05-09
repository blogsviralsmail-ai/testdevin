import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");
  const batchId = searchParams.get("batchId");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (programId) where.programId = programId;
  if (batchId) where.batchId = batchId;
  if (category) where.category = category;

  const discussions = await prisma.discussion.findMany({
    where,
    include: { replies: { select: { id: true, authorId: true, createdAt: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  // Fetch author names
  const authorIds = [...new Set(discussions.map(d => d.authorId))];
  const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, role: true, avatar: true } });
  const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

  return NextResponse.json(discussions.map(d => ({
    ...d,
    author: authorMap[d.authorId] || { name: "Unknown", role: "student" },
    replyCount: d.replies.length,
    replies: undefined,
  })));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content, programId, batchId, category } = await request.json();
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

  const discussion = await prisma.discussion.create({
    data: { title, content, authorId: session.id, programId, batchId, category: category || "doubt" },
  });

  return NextResponse.json(discussion, { status: 201 });
}
