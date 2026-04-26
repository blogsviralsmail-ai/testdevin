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
    | { entity?: { id?: string; notes?: { userId?: string; planSlug?: string } } }
    | undefined;
  const payment = (payload.payload as Record<string, unknown> | undefined)?.payment as
    | {
        entity?: {
          id?: string;
          order_id?: string;
          notes?: { userId?: string; planSlug?: string };
        };
      }
    | undefined;

  const notes = order?.entity?.notes ?? payment?.entity?.notes ?? {};
  const userId = notes.userId;
  const planSlug = notes.planSlug;
  const paymentId = payment?.entity?.id;
  const orderId = payment?.entity?.order_id ?? order?.entity?.id;

  if (!userId || !planSlug) {
    // No notes — likely a subscription event we don't handle yet.
    return NextResponse.json({ ok: true, ignored: "no notes" });
  }
  if (!paymentId || !orderId) {
    // Without a paymentId we can't dedupe — refuse rather than risk
    // applying twice on retry.
    return NextResponse.json({ ok: true, ignored: "no payment id" });
  }

  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan) return NextResponse.json({ ok: true, ignored: "unknown plan" });

  // Idempotency: Razorpay retries deliveries on timeouts, so the same
  // paymentId can arrive multiple times. Apply the upgrade exactly once
  // by inserting into ProcessedPayment first; the @unique constraint on
  // paymentId means a retry hits P2002 and we short-circuit.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.processedPayment.create({
        data: {
          paymentId,
          orderId,
          userId,
          planSlug: plan.slug,
          source: "webhook",
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          plan: plan.slug,
          conversationsQuota: plan.conversationsQuota,
          conversationsUsed: 0,
        },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // P2002 = unique constraint on paymentId → already processed (e.g.
    // /api/billing/verify beat us to it, or this is a delivery retry).
    // Always respond 200 so Razorpay stops retrying.
    if (message.includes("P2002")) {
      return NextResponse.json({ ok: true, alreadyApplied: true });
    }
    console.error(
      `[billing/webhook] failed to apply upgrade for user=${userId} plan=${planSlug}: ${message}`,
    );
    return NextResponse.json({ ok: true, ignored: "user-update-failed" });
  }

  return NextResponse.json({ ok: true });
}
