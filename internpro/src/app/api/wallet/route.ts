import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: session.id },
      select: { walletBalance: true, totalEarnings: true },
    });

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      balance: agent?.walletBalance || 0,
      totalEarnings: agent?.totalEarnings || 0,
      transactions,
      withdrawals,
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet data" }, { status: 500 });
  }
}
