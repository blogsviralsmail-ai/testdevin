import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startChannel } from "@/lib/whatsapp";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    const ch = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!ch || ch.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await startChannel(params.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
