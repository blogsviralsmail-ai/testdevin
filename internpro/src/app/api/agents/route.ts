import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Agent sees own profile, admin sees all
  if (session.role === "agent") {
    const agent = await prisma.agent.findUnique({
      where: { userId: session.id },
      include: { user: { select: { name: true, email: true, phone: true, avatar: true } }, referrals: { include: { student: { select: { name: true, email: true, phone: true } } }, orderBy: { createdAt: "desc" } }, payouts: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json(agent);
  }

  if (!["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }, referrals: { select: { id: true, status: true, commission: true } }, payouts: { select: { id: true, amount: true, status: true } } },
    orderBy: { totalEarnings: "desc" },
  });

  return NextResponse.json(agents);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone, password, commissionRate, bankName, accountNumber, ifscCode, upiId } = await request.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Name, email, password required" }, { status: 400 });

  const bcrypt = await import("bcryptjs");
  const hashed = await bcrypt.hash(password, 10);

  // Create user with agent role
  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed, role: "agent" },
  });

  // Generate unique referral code
  const code = `KKHS-${name.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const agent = await prisma.agent.create({
    data: { userId: user.id, referralCode: code, commissionRate: commissionRate || 30, bankName, accountNumber, ifscCode, upiId },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(agent);
}
