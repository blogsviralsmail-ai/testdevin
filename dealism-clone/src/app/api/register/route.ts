import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { sendWelcomeEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    // Canonical lowercase form so the @unique constraint actually
    // dedupes "User@x.com" and "user@x.com".
    const data = { ...parsed, email: normalizeEmail(parsed.email) };

    const [allowSignups, quotaSetting] = await Promise.all([
      getSetting("allow_signups"),
      getSetting("default_trial_quota"),
    ]);
    if (allowSignups === "false") {
      return NextResponse.json(
        { error: "Registration is currently closed. Contact the administrator." },
        { status: 403 }
      );
    }

    const parsedQuota = quotaSetting ? parseInt(quotaSetting, 10) : NaN;
    const conversationsQuota = Number.isFinite(parsedQuota) && parsedQuota > 0 ? parsedQuota : 100;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const hashed = await bcrypt.hash(data.password, 10);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    // Create user + personal workspace + default agent atomically. If
    // anything fails we don't want a half-provisioned account.
    const wsName = (data.name?.trim() || data.email.split("@")[0]) + "'s Workspace";
    const { user, workspace } = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashed,
          role: "user",
          plan: "trial",
          trialEndsAt: trialEnd,
          conversationsQuota,
        },
      });
      const ws = await tx.workspace.create({
        data: {
          name: wsName,
          ownerId: u.id,
          memberships: { create: { userId: u.id, role: "owner" } },
        },
      });
      await tx.user.update({
        where: { id: u.id },
        data: { activeWorkspaceId: ws.id },
      });
      await tx.agent.create({
        data: {
          userId: u.id,
          workspaceId: ws.id,
          name: "My Sales Agent",
          description: "Default AI sales agent",
          systemPrompt:
            "You are a friendly, expert sales rep. You understand the business and help customers find what they need. You handle objections gracefully and keep conversations moving toward a sale.",
          tone: "friendly",
          language: "en",
        },
      });
      return { user: u, workspace: ws };
    });
    void workspace; // keep variable name for clarity even if unused below

    // Fire-and-forget welcome email — we don't want a slow Resend call to
    // block registration, and email failures must never break signup.
    void sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
