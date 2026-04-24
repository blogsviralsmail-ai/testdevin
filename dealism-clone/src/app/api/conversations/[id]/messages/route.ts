import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
    if (!convo || convo.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
