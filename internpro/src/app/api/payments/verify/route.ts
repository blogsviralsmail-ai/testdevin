import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, enrollmentId, amount } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment verification data" }, { status: 400 });
    }

    // Get Razorpay secret from settings
    const settings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    for (const s of settings) sMap[s.key] = s.value;
    const keySecret = sMap.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 400 });
    }

    // Verify signature
    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Record payment
    const payment = await prisma.payment.create({
      data: {
        enrollmentId,
        amount: parseFloat(amount),
        type: "fee",
        status: "completed",
        paymentId: razorpay_payment_id,
        method: "razorpay",
        description: `Razorpay Order: ${razorpay_order_id}`,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
