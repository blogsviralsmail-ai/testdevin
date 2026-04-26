import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const ch = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!ch || ch.workspaceId !== workspace.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      status: ch.status,
      qrCode: ch.qrCode,
      phoneNumber: ch.phoneNumber,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
