import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { generateOfferLetterForEnrollment } from "@/lib/generate-offer-letter";
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

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        batch: { include: { program: { include: { organization: true } } } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
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

    // Update enrollment payment status
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { paymentStatus: "completed" },
    });

    // Agent commission calculation
    const referral = await prisma.referral.findFirst({ where: { studentId: enrollment.studentId } });
    if (referral && enrollment.feeType === "paid" && parseFloat(amount) > 0) {
      const agent = await prisma.agent.findUnique({ where: { id: referral.agentId } });
      if (agent) {
        const commission = parseFloat(amount) * (agent.commissionRate / 100);
        await prisma.referral.update({
          where: { id: referral.id },
          data: { status: "converted", amount: parseFloat(amount), commission },
        });
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            totalEarnings: { increment: commission },
            walletBalance: { increment: commission },
          },
        });
      }
    }

    // Generate offer letter
    const olResult = await generateOfferLetterForEnrollment(enrollmentId, session.id, session.name);
    if (!olResult.success) {
      console.error("[razorpay-verify] Offer letter generation failed:", olResult.error);
    }

    logActivity("payment_received", "payment", payment.id, `₹${amount} Razorpay payment from ${enrollment.student.name} for ${enrollment.batch.program.title} (${razorpay_payment_id})`, session.id, session.name).catch(() => {});

    return NextResponse.json({ success: true, payment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Payment verification failed";
    console.error("[razorpay-verify] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
