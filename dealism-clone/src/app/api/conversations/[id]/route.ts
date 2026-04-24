import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
    if (!convo || convo.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json();
    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: {
        isAutoReply: body.isAutoReply,
        status: body.status,
      },
    });
    return NextResponse.json({ conversation: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
