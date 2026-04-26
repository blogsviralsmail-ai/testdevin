import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
    const data = schema.parse(body);

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

    const user = await prisma.user.create({
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

    // Auto-seed a default agent
    await prisma.agent.create({
      data: {
        userId: user.id,
        name: "My Sales Agent",
        description: "Default AI sales agent",
        systemPrompt:
          "You are a friendly, expert sales rep. You understand the business and help customers find what they need. You handle objections gracefully and keep conversations moving toward a sale.",
        tone: "friendly",
        language: "en",
      },
    });

    // Fire-and-forget welcome email — we don't want a slow Resend call to
    // block registration, and email failures must never break signup.
    void sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
