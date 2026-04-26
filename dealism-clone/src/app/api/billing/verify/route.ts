import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayConfig, verifyOrderSignature } from "@/lib/razorpay";

/**
 * Frontend posts here after the Razorpay Checkout widget closes
 * with success. We verify the HMAC signature, then upgrade the user's
 * plan + reset their usage counter. Webhook is the canonical source of
 * truth (see /api/billing/webhook), but verifying client-side too lets
 * us flip the user's plan instantly without waiting on Razorpay's
 * server-to-server callback.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const { orderId, paymentId, signature, planSlug } = (await req.json()) as {
      orderId?: string;
      paymentId?: string;
      signature?: string;
      planSlug?: string;
    };
    if (!orderId || !paymentId || !signature || !planSlug) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const config = await getRazorpayConfig();
    if (!config) return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });

    const ok = verifyOrderSignature({
      orderId,
      paymentId,
      signature,
      keySecret: config.keySecret,
    });
    if (!ok) return NextResponse.json({ error: "signature mismatch" }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) return NextResponse.json({ error: "plan not found" }, { status: 404 });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: plan.slug,
        conversationsQuota: plan.conversationsQuota,
        conversationsUsed: 0,
      },
    });

    return NextResponse.json({ ok: true, plan: plan.slug });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
