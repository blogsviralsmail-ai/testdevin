import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.role === "admin" || session.role === "organization";

    // Exclude soft-deleted users
    const deletedUsers = await prisma.user.findMany({ where: { deletedAt: { not: null } }, select: { id: true } });
    const deletedIds = deletedUsers.map(u => u.id);
    const where: Record<string, unknown> = deletedIds.length ? { userId: { notIn: deletedIds } } : {};
    if (!isAdmin) {
      where.userId = session.id;
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Get user names for admin view
    if (isAdmin && withdrawals.length > 0) {
      const userIds = [...new Set(withdrawals.map(w => w.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });
      const userMap = new Map(users.map(u => [u.id, u]));
      const enriched = withdrawals.map(w => ({
        ...w,
        user: userMap.get(w.userId) || null,
      }));
      return NextResponse.json(enriched);
    }

    return NextResponse.json(withdrawals);
  } catch (error) {
    console.error("Withdrawal fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method, bankName, accountNumber, ifscCode, upiId, remarks } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    // Check wallet balance
    const agent = await prisma.agent.findUnique({ where: { userId: session.id } });
    if (!agent || agent.walletBalance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // Check for pending withdrawal
    const pending = await prisma.withdrawalRequest.findFirst({
      where: { userId: session.id, status: "pending" },
    });
    if (pending) {
      return NextResponse.json({ error: "You already have a pending withdrawal request" }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: session.id,
        amount,
        method: method || "bank_transfer",
        bankName: bankName || agent.bankName,
        accountNumber: accountNumber || agent.accountNumber,
        ifscCode: ifscCode || agent.ifscCode,
        upiId: upiId || agent.upiId,
        remarks,
      },
    });

    return NextResponse.json(withdrawal);
  } catch (error) {
    console.error("Withdrawal create error:", error);
    return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, adminRemarks } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!withdrawal) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Can only process pending requests" }, { status: 400 });
    }

    if (status === "approved") {
      // Deduct from wallet
      const agent = await prisma.agent.findUnique({ where: { userId: withdrawal.userId } });
      if (!agent || agent.walletBalance < withdrawal.amount) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }

      await prisma.agent.update({
        where: { userId: withdrawal.userId },
        data: { walletBalance: { decrement: withdrawal.amount } },
      });

      // Record wallet transaction
      await prisma.walletTransaction.create({
        data: {
          userId: withdrawal.userId,
          type: "withdrawal",
          amount: -withdrawal.amount,
          balance: agent.walletBalance - withdrawal.amount,
          description: `Withdrawal processed — ₹${withdrawal.amount}`,
          reference: withdrawal.id,
        },
      });
    }

    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status,
        adminRemarks,
        processedAt: new Date(),
        processedBy: session.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Withdrawal process error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}
