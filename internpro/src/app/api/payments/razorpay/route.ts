import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Razorpay from "razorpay";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, amount } = body;

    if (!enrollmentId || !amount) {
      return NextResponse.json({ error: "Enrollment ID and amount required" }, { status: 400 });
    }

    // Get Razorpay keys from settings
    const settings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    for (const s of settings) sMap[s.key] = s.value;

    const keyId = sMap.razorpay_key_id || process.env.RAZORPAY_KEY_ID;
    const keySecret = sMap.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Payment gateway not configured. Contact admin." }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true, batch: { include: { program: true } } },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `enroll_${enrollmentId.substring(0, 16)}`,
      notes: {
        enrollmentId,
        studentName: enrollment.student.name,
        program: enrollment.batch.program.title,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create payment order";
    console.error("[razorpay-order] Error:", error);
    return NextResponse.json({ error: `Payment order creation failed: ${message}` }, { status: 500 });
  }
}
