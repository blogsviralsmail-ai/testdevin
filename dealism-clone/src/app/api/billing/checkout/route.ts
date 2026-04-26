import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

/**
 * Create a Razorpay Order for a given plan slug + cycle (monthly|annual).
 * The frontend picks up { orderId, keyId, amount, currency } and opens
 * the Razorpay Checkout widget client-side. On success the widget posts
 * back to /api/billing/verify which validates the signature.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const { planSlug, cycle } = (await req.json()) as {
      planSlug?: string;
      cycle?: "monthly" | "annual";
    };
    if (!planSlug) return NextResponse.json({ error: "planSlug required" }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    const cyc = cycle === "annual" && plan.priceAnnual ? "annual" : "monthly";
    const amountInr = cyc === "annual" ? plan.priceAnnual ?? plan.priceMonthly : plan.priceMonthly;
    if (amountInr <= 0) {
      return NextResponse.json({ error: "Free plans don't need checkout" }, { status: 400 });
    }
    const amountPaise = Math.round(amountInr * 100);

    const rp = await getRazorpayClient();
    if (!rp) return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });

    const order = await rp.client.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `u_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        planSlug,
        cycle: cyc,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      keyId: rp.config.keyId,
      amount: amountPaise,
      currency: "INR",
      planSlug,
      cycle: cyc,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
