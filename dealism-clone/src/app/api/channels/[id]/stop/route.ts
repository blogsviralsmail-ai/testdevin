import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stopChannel } from "@/lib/whatsapp";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    const ch = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!ch || ch.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await stopChannel(params.id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
