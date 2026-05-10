import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDiscussionEmail } from "@/lib/email";

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

  // Students see only their enrolled program's discussions + general discussions
  if (session.role === "student" && !programId && !batchId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.id, status: { in: ["selected", "active", "completed"] } },
      include: { batch: { select: { programId: true } } },
    });
    if (enrollments.length > 0) {
      const myProgramIds = enrollments.map(e => e.batch.programId);
      const myBatchIds = enrollments.map(e => e.batchId);
      where.OR = [
        { programId: { in: myProgramIds } },
        { batchId: { in: myBatchIds } },
        { programId: null, batchId: null },
      ];
    }
  }

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

  // Email all students in the batch/program about new discussion (non-blocking)
  if (batchId || programId) {
    const enrollWhere: Record<string, unknown> = { status: { in: ["selected", "active"] } };
    if (batchId) enrollWhere.batchId = batchId;
    const enrollments = await prisma.enrollment.findMany({ where: enrollWhere, select: { student: { select: { name: true, email: true } } } });
    for (const e of enrollments) {
      if (e.student.email) sendDiscussionEmail(e.student.name, e.student.email, title, "New Discussion Posted").catch(() => {});
    }
  }

  return NextResponse.json(discussion, { status: 201 });
}
