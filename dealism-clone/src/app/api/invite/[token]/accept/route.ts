import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: NextRequest, { params }: { params: { token: string } }) {
  try {
    const user = await apiRequireUser();
    const inv = await prisma.invitation.findUnique({ where: { token: params.token } });
    if (!inv) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    if (inv.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }
    if (inv.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
    }
    if (inv.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is for a different email address" },
        { status: 403 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Idempotent membership upsert.
      await tx.membership.upsert({
        where: {
          workspaceId_userId: { workspaceId: inv.workspaceId, userId: user.id },
        },
        update: {},
        create: { workspaceId: inv.workspaceId, userId: user.id, role: inv.role },
      });
      await tx.invitation.update({
        where: { id: inv.id },
        data: { acceptedAt: new Date() },
      });
      // Make the new workspace the active one — easier UX than asking the
      // user to manually switch after accepting.
      await tx.user.update({
        where: { id: user.id },
        data: { activeWorkspaceId: inv.workspaceId },
      });
    });

    return NextResponse.json({ ok: true, workspaceId: inv.workspaceId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
