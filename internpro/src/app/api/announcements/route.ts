import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const announcements = await prisma.announcement.findMany({
    where: { OR: [{ targetRole: "all" }, { targetRole: session.role }] },
    include: { author: { select: { name: true, avatar: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(announcements);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, category, isPinned, targetRole } = await request.json();
  if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

  const announcement = await prisma.announcement.create({
    data: { title, content, category: category || "general", isPinned: isPinned || false, targetRole: targetRole || "all", authorId: session.id },
  });

  return NextResponse.json(announcement);
}
