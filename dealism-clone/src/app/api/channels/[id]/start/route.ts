import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startChannel } from "@/lib/channels";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const ch = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!ch || ch.workspaceId !== workspace.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await startChannel(params.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
