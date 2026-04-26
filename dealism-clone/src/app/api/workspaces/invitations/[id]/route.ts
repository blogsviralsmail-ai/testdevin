import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace } from "@/lib/workspace";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    if (!canManageWorkspace(workspace.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const inv = await prisma.invitation.findUnique({ where: { id: params.id } });
    if (!inv || inv.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.invitation.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
