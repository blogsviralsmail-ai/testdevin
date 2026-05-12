import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { generateOfferLetterForEnrollment } from "@/lib/generate-offer-letter";

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
  const isCash = paymentMethod === "cash";
  const paymentStatus = isCash ? "pending_approval" : "completed";

  // Record payment
  const payment = await prisma.payment.create({
    data: {
      enrollmentId,
      amount,
      type: "fee",
      status: paymentStatus,
      paymentId: transactionId,
      method: paymentMethod || "upi",
      description: isCash
        ? `Cash payment for ${enrollment.batch.program.title} (pending admin approval)`
        : `Fee payment for ${enrollment.batch.program.title}`,
    },
  });

  if (isCash) {
    // For cash, keep enrollment paymentStatus as "pending" — admin will approve
    logActivity("cash_payment_submitted", "payment", payment.id, `₹${amount} cash payment from ${enrollment.student.name} for ${enrollment.batch.program.title} — awaiting admin approval`, session.id, session.name).catch(() => {});
    return NextResponse.json({ success: true, paymentId: payment.id, pendingApproval: true });
  }

  // For non-cash, complete immediately
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

  // Generate offer letter directly
  const olResult = await generateOfferLetterForEnrollment(enrollmentId, session.id, session.name);
  if (!olResult.success) {
    console.error("[student-payment] Offer letter generation failed:", olResult.error);
  }

  logActivity("payment_received", "payment", payment.id, `₹${amount} fee from ${enrollment.student.name} for ${enrollment.batch.program.title} (${paymentMethod}: ${transactionId})`, session.id, session.name).catch(() => {});

  return NextResponse.json({ success: true, paymentId: payment.id });
}

// PATCH: Admin approves cash payment
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { paymentId, action } = body; // action: "approve" or "reject"

  if (!paymentId || !action) {
    return NextResponse.json({ error: "Missing paymentId or action" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        include: {
          student: true,
          batch: { include: { program: { include: { organization: true } } } },
        },
      },
    },
  });

  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending_approval") return NextResponse.json({ error: "Payment is not pending approval" }, { status: 400 });

  if (action === "reject") {
    await prisma.payment.update({ where: { id: paymentId }, data: { status: "rejected" } });
    logActivity("payment_rejected", "payment", paymentId, `Cash payment of ₹${payment.amount} from ${payment.enrollment.student.name} rejected`, session.id, session.name).catch(() => {});
    return NextResponse.json({ success: true, message: "Payment rejected" });
  }

  // Approve
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "completed" } });
  await prisma.enrollment.update({
    where: { id: payment.enrollmentId },
    data: { paymentStatus: "completed" },
  });

  const enrollment = payment.enrollment;
  const amount = payment.amount;

  // Agent commission
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

  // Generate offer letter directly
  const olResult = await generateOfferLetterForEnrollment(enrollment.id, session.id, session.name);
  if (!olResult.success) {
    console.error("[admin-approve] Offer letter generation failed:", olResult.error);
  }

  logActivity("payment_approved", "payment", paymentId, `Cash payment of ₹${amount} from ${enrollment.student.name} approved — offer letter generated`, session.id, session.name).catch(() => {});

  return NextResponse.json({ success: true, message: "Payment approved, offer letter generated" });
}
