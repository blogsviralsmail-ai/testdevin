import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, isAnswer } = await request.json();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const reply = await prisma.discussionReply.create({
    data: { discussionId: id, authorId: session.id, content, isAnswer: isAnswer || false },
  });

  return NextResponse.json(reply, { status: 201 });
}
