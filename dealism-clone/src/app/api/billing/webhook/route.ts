import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig, verifyWebhookSignature } from "@/lib/razorpay";

/**
 * Server-to-server webhook from Razorpay. Configured in their dashboard
 * with the same `webhook_secret` saved in admin settings. Idempotent —
 * we look up the order's notes.userId + planSlug and apply the upgrade.
 *
 * Important: we MUST read the raw body before JSON-parsing it because
 * the HMAC is computed over the exact bytes Razorpay sent.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  const config = await getRazorpayConfig();
  if (!config || !config.webhookSecret) {
    return NextResponse.json({ error: "Razorpay webhook secret not configured" }, { status: 503 });
  }

  if (!verifyWebhookSignature({ rawBody, signature, webhookSecret: config.webhookSecret })) {
    return NextResponse.json({ error: "signature mismatch" }, { status: 400 });
  }

  let payload: { event?: string; payload?: Record<string, unknown> };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // We only care about successful captures for now. Subscription cancel
  // / pause events can be added when subscription product is wired up.
  if (payload.event !== "payment.captured" && payload.event !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: payload.event });
  }

  const order = (payload.payload as Record<string, unknown> | undefined)?.order as
    | { entity?: { notes?: { userId?: string; planSlug?: string } } }
    | undefined;
  const payment = (payload.payload as Record<string, unknown> | undefined)?.payment as
    | { entity?: { notes?: { userId?: string; planSlug?: string } } }
    | undefined;

  const notes = order?.entity?.notes ?? payment?.entity?.notes ?? {};
  const userId = notes.userId;
  const planSlug = notes.planSlug;

  if (!userId || !planSlug) {
    // No notes — likely a subscription event we don't handle yet.
    return NextResponse.json({ ok: true, ignored: "no notes" });
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) return NextResponse.json({ ok: true, ignored: "unknown plan" });

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: plan.slug,
      conversationsQuota: plan.conversationsQuota,
      conversationsUsed: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
