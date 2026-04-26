import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, verifyOrderSignature } from "@/lib/razorpay";

/**
 * Frontend posts here after the Razorpay Checkout widget closes with
 * success. We:
 *   1. Verify the HMAC signature against orderId|paymentId.
 *   2. Fetch the order from Razorpay and read planSlug + userId from
 *      the server-set `notes` (so a malicious client can't switch
 *      plan after paying for a cheaper one).
 *   3. Upgrade the user's plan + reset usage counter.
 *
 * The webhook (/api/billing/webhook) remains the canonical source of
 * truth; this endpoint just lets us flip the plan instantly without
 * waiting on Razorpay's server-to-server callback.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const { orderId, paymentId, signature } = (await req.json()) as {
      orderId?: string;
      paymentId?: string;
      signature?: string;
    };
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    const rp = await getRazorpayClient();
    if (!rp) return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });

    const ok = verifyOrderSignature({
      orderId,
      paymentId,
      signature,
      keySecret: rp.config.keySecret,
    });
    if (!ok) return NextResponse.json({ error: "signature mismatch" }, { status: 400 });

    // Read the authoritative plan + user from the server-set notes on
    // the order itself. The client is *not* trusted for either field —
    // even though the user is authenticated, we still cross-check that
    // the order was created for this user.
    type OrderNotes = { planSlug?: string; userId?: string };
    interface FetchedOrder {
      notes?: OrderNotes | null;
      status?: string;
    }
    const order = (await rp.client.orders.fetch(orderId)) as FetchedOrder;
    const notes: OrderNotes = order?.notes ?? {};
    if (!notes.planSlug) {
      return NextResponse.json({ error: "order has no planSlug" }, { status: 400 });
    }
    // Reject orders that lack a userId note OR belong to a different user.
    // The original `notes.userId && ...` left a hole: if a Razorpay-dashboard
    // operator created an order without setting userId, any authenticated
    // session that knew the orderId/paymentId/signature triplet could claim it.
    if (!notes.userId || notes.userId !== user.id) {
      // Order belongs to a different user — refuse to upgrade.
      return NextResponse.json({ error: "order does not belong to user" }, { status: 403 });
    }

    const plan = await prisma.plan.findUnique({ where: { slug: notes.planSlug } });
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
