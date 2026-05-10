import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");

  const where: Record<string, unknown> = {};
  if (enrollmentId) where.enrollmentId = enrollmentId;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { name: true, email: true } },
          batch: { include: { program: { select: { title: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, amount, type, method, description } = body;

    if (!enrollmentId || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Enrollment ID and amount are required" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: "Amount must be a valid number" }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        enrollmentId,
        amount: parsedAmount,
        type: type || "fee",
        method: method || null,
        description: description || null,
        status: "completed",
      },
    });

    // Calculate agent commission only when student pays company (feeType = "paid")
    // No commission for stipend (company pays student) or free enrollments
    try {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { studentId: true, feeType: true },
      });
      if (enrollment && enrollment.feeType === "paid") {
        const referral = await prisma.referral.findFirst({
          where: { studentId: enrollment.studentId },
          include: { agent: true },
        });
        if (referral && referral.agent) {
          const commissionAmount = (parsedAmount * referral.agent.commissionRate) / 100;
          await prisma.referral.update({
            where: { id: referral.id },
            data: { amount: { increment: parsedAmount }, commission: { increment: commissionAmount }, status: "converted" },
          });
          await prisma.agent.update({
            where: { id: referral.agent.id },
            data: { totalEarnings: { increment: commissionAmount }, walletBalance: { increment: commissionAmount } },
          });
        }
      }
    } catch { /* commission calculation failed, payment still recorded */ }

    logActivity("payment_received", "payment", payment.id, `Payment ₹${parsedAmount} received for enrollment`, session.id, session.name).catch(() => {});

    return NextResponse.json(payment, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to record payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
