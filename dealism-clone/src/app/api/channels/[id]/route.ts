import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stopChannel } from "@/lib/whatsapp";

async function assertOwn(userId: string, id: string) {
  const ch = await prisma.channel.findUnique({ where: { id } });
  if (!ch || ch.userId !== userId) throw new Error("Not found");
  return ch;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    await assertOwn(user.id, params.id);
    const body = await req.json();
    if (body.agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: body.agentId } });
      if (!agent || agent.userId !== user.id) {
        return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
      }
    }
    const ch = await prisma.channel.update({
      where: { id: params.id },
      data: { name: body.name, agentId: body.agentId ?? null },
    });
    return NextResponse.json({ channel: ch });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    await assertOwn(user.id, params.id);
    await stopChannel(params.id).catch(() => {});
    await prisma.channel.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
