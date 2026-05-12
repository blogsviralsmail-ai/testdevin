import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId, amount, method, reference } = await request.json();
  if (!agentId || !amount) return NextResponse.json({ error: "agentId and amount required" }, { status: 400 });

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (agent.walletBalance < amount) return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });

  // Create payout and deduct from wallet
  const payout = await prisma.agentPayout.create({
    data: { agentId, amount, method: method || "manual", status: "completed", reference },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { walletBalance: { decrement: amount } },
  });

  return NextResponse.json(payout);
}
