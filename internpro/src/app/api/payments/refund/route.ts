import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentId, amount, reason } = await request.json();
  if (!paymentId) return NextResponse.json({ error: "paymentId required" }, { status: 400 });

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { enrollment: { include: { student: { select: { name: true, email: true } } } } },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status === "refunded") return NextResponse.json({ error: "Already refunded" }, { status: 400 });

  const refundAmount = amount ? parseFloat(amount) : payment.amount;
  if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > payment.amount) {
    return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 });
  }

  const isPartial = refundAmount < payment.amount;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: isPartial ? "partial_refund" : "refunded",
      description: `${payment.description || ""}\n[REFUND: ₹${refundAmount}${reason ? ` — ${reason}` : ""}]`.trim(),
    },
  });

  const refundRecord = await prisma.payment.create({
    data: {
      enrollmentId: payment.enrollmentId,
      amount: -refundAmount,
      type: "refund",
      method: payment.method,
      description: `Refund for payment ${paymentId}${reason ? `: ${reason}` : ""}`,
      status: "completed",
    },
  });

  logActivity("refund_processed", "payment", refundRecord.id,
    `Refund ₹${refundAmount} for ${payment.enrollment?.student?.name || "student"}`,
    session.id, session.name,
  ).catch(() => {});

  return NextResponse.json({ refund: refundRecord, originalPayment: paymentId, refundAmount });
}
