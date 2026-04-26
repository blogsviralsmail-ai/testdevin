import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace } from "@/lib/workspace";
import { sendWorkspaceInviteEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).optional(),
});

const TOKEN_BYTES = 32;
const INVITE_TTL_DAYS = 7;

function publicAppUrl(req: NextRequest): string {
  const fromEnv = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  // Fall back to the request's own origin — works behind nginx as long as
  // the proxy forwards the Host header.
  const host = req.headers.get("host") ?? "localhost:3030";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const { user, workspace } = await apiRequireUserWithWorkspace();
    if (!canManageWorkspace(workspace.role)) {
      return NextResponse.json({ error: "Only owners and admins can invite" }, { status: 403 });
    }
    const body = await req.json();
    const { email, role } = schema.parse(body);

    // Already a member?
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const m = await prisma.membership.findUnique({
        where: {
          workspaceId_userId: { workspaceId: workspace.id, userId: existingUser.id },
        },
      });
      if (m) return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // Reuse a pending invite for the same email instead of stacking duplicates.
    const existing = await prisma.invitation.findFirst({
      where: { workspaceId: workspace.id, email, acceptedAt: null },
    });
    let invitation;
    if (existing && existing.expiresAt > new Date()) {
      invitation = existing;
    } else {
      const token = randomBytes(TOKEN_BYTES).toString("hex");
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
      invitation = await prisma.invitation.create({
        data: {
          workspaceId: workspace.id,
          email,
          role: role ?? "member",
          token,
          expiresAt,
          invitedById: user.id,
        },
      });
    }

    const acceptUrl = `${publicAppUrl(req)}/invite/${invitation.token}`;
    const inviterName = user.name?.trim() || user.email;
    void sendWorkspaceInviteEmail({
      to: email,
      inviterName,
      workspaceName: workspace.name,
      acceptUrl,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      acceptUrl,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}

export async function GET() {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    if (!canManageWorkspace(workspace.role)) {
      return NextResponse.json({ invitations: [] });
    }
    const invitations = await prisma.invitation.findMany({
      where: { workspaceId: workspace.id, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invitations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
