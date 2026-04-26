import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace } from "@/lib/workspace";

/**
 * Patch a membership: change role, or remove from workspace.
 * Only owners/admins can manage. Owners cannot be demoted/removed
 * via this endpoint — workspace ownership transfer is a separate flow.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, workspace } = await apiRequireUserWithWorkspace();
    if (!canManageWorkspace(workspace.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const m = await prisma.membership.findUnique({ where: { id: params.id } });
    if (!m || m.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (m.role === "owner") {
      return NextResponse.json({ error: "Cannot modify the workspace owner" }, { status: 400 });
    }
    if (m.userId === user.id) {
      return NextResponse.json({ error: "Cannot modify your own membership" }, { status: 400 });
    }
    const body = await req.json();
    if (body.role && !["admin", "member"].includes(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const updated = await prisma.membership.update({
      where: { id: params.id },
      data: { role: body.role },
    });
    return NextResponse.json({ membership: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, workspace } = await apiRequireUserWithWorkspace();
    if (!canManageWorkspace(workspace.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const m = await prisma.membership.findUnique({ where: { id: params.id } });
    if (!m || m.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (m.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
    }
    if (m.userId === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself; ask another admin" }, { status: 400 });
    }
    // If the removed user had this as their active workspace, fall back
    // to their personal workspace next request.
    await prisma.$transaction(async (tx) => {
      await tx.membership.delete({ where: { id: params.id } });
      await tx.user.updateMany({
        where: { id: m.userId, activeWorkspaceId: workspace.id },
        data: { activeWorkspaceId: null },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
