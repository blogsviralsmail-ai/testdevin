import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");
  if (!enrollmentId) return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { select: { name: true, email: true } },
      batch: { include: { program: { select: { title: true, mode: true, duration: true } } } },
    },
  });

  if (!enrollment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: enrollment.id,
    status: enrollment.status,
    feeType: enrollment.feeType,
    feeAmount: enrollment.feeAmount || 0,
    paymentStatus: enrollment.paymentStatus,
    batch: enrollment.batch,
    student: enrollment.student,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { enrollmentId, paymentMethod, transactionId } = body;

  if (!enrollmentId || !transactionId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: true,
      batch: { include: { program: { include: { organization: true } } } },
    },
  });

  if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  if (enrollment.paymentStatus === "completed") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  const amount = enrollment.feeAmount || 0;

  // Record payment
  const payment = await prisma.payment.create({
    data: {
      enrollmentId,
      amount,
      type: "fee",
      status: "completed",
      paymentId: transactionId,
      method: paymentMethod || "upi",
      description: `Fee payment for ${enrollment.batch.program.title}`,
    },
  });

  // Update enrollment payment status
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { paymentStatus: "completed" },
  });

  // Agent commission calculation
  const referral = await prisma.referral.findFirst({ where: { studentId: enrollment.studentId } });
  if (referral && enrollment.feeType === "paid" && amount > 0) {
    const agent = await prisma.agent.findUnique({ where: { id: referral.agentId } });
    if (agent) {
      const commission = amount * (agent.commissionRate / 100);
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: "converted", amount, commission },
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

  // Now generate offer letter (trigger the same flow)
  try {
    const offerRes = await fetch(new URL("/api/offer-letters/generate-after-payment", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ enrollmentId }),
    });
    if (!offerRes.ok) {
      console.error("[student-payment] Offer letter generation failed:", await offerRes.text());
    }
  } catch (e) {
    console.error("[student-payment] Offer letter generation error:", e);
  }

  logActivity("payment_received", "payment", payment.id, `₹${amount} fee from ${enrollment.student.name} for ${enrollment.batch.program.title} (${paymentMethod}: ${transactionId})`, session.id, session.name).catch(() => {});

  return NextResponse.json({ success: true, paymentId: payment.id });
}
