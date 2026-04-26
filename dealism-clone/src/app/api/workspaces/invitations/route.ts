import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { apiRequireUserWithWorkspace, normalizeEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace } from "@/lib/workspace";
import { sendWorkspaceInviteEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).optional(),
});

const TOKEN_BYTES = 32;
const INVITE_TTL_DAYS = 7;

/**
 * Trusted public origin for invite emails.
 *
 * We deliberately do NOT fall back to the request's Host / X-Forwarded-Proto
 * headers — those are attacker-controlled (Host header poisoning) and an
 * authenticated workspace admin could otherwise craft a request that makes
 * the server email a phishing acceptUrl to a victim. Falls back to the
 * `public_app_url` Setting row so admins can override without redeploying.
 */
async function trustedPublicAppUrl(): Promise<string | null> {
  const fromEnv = (process.env.NEXTAUTH_URL || process.env.APP_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const { getSetting } = await import("@/lib/settings");
  const fromSetting = (await getSetting("public_app_url"))?.trim();
  if (fromSetting) return fromSetting.replace(/\/$/, "");
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { user, workspace } = await apiRequireUserWithWorkspace();
    if (!canManageWorkspace(workspace.role)) {
      return NextResponse.json({ error: "Only owners and admins can invite" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = schema.parse(body);
    const email = normalizeEmail(parsed.email);
    const role = parsed.role;

    // Resolve the trusted origin BEFORE creating any DB rows. If we can't
    // build a safe acceptUrl there's no point persisting the invitation —
    // the admin would just see an error and be left with an orphan record.
    const origin = await trustedPublicAppUrl();
    if (!origin) {
      return NextResponse.json(
        {
          error:
            "Cannot send invitation: NEXTAUTH_URL / APP_URL env or public_app_url setting must be configured.",
        },
        { status: 500 },
      );
    }

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
      // Re-inviting the same email — refresh expiry to the full TTL so
      // the invitee always gets a fresh window (the prior row may have
      // been near expiration), and reflect any new role the admin picked.
      const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
      invitation = await prisma.invitation.update({
        where: { id: existing.id },
        data: {
          role: role ?? existing.role,
          expiresAt,
        },
      });
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

    const acceptUrl = `${origin}/invite/${invitation.token}`;
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
