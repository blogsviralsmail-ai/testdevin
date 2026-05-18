import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create agent profile for referral code
    let agent = await prisma.agent.findUnique({
      where: { userId: session.id },
      include: {
        referrals: {
          include: {
            student: { select: { id: true, name: true, email: true, phone: true, collegeName: true, enrollments: { select: { status: true, batch: { select: { program: { select: { title: true } } } } } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Get admin commission rate setting
    const commSetting = await prisma.setting.findUnique({ where: { key: "referral_commission_rate" } });
    const defaultRate = commSetting ? parseFloat(commSetting.value) : 30;

    return NextResponse.json({
      agent,
      commissionRate: agent?.commissionRate || defaultRate,
      referralCode: agent?.referralCode || null,
      walletBalance: agent?.walletBalance || 0,
      totalEarnings: agent?.totalEarnings || 0,
      referrals: agent?.referrals || [],
    });
  } catch (error) {
    console.error("Referral fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch referral data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already has agent profile
    const existing = await prisma.agent.findUnique({ where: { userId: session.id } });
    if (existing) {
      return NextResponse.json({ referralCode: existing.referralCode, agent: existing });
    }

    // Get admin commission rate setting
    const commSetting = await prisma.setting.findUnique({ where: { key: "referral_commission_rate" } });
    const defaultRate = commSetting ? parseFloat(commSetting.value) : 30;

    // Generate unique referral code
    const body = await request.json().catch(() => ({}));
    let code = body.referralCode || `REF-${generateCode()}`;
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.agent.findUnique({ where: { referralCode: code } });
      if (!exists) break;
      code = `REF-${generateCode()}`;
      attempts++;
    }

    const agent = await prisma.agent.create({
      data: {
        userId: session.id,
        referralCode: code,
        commissionRate: defaultRate,
      },
    });

    return NextResponse.json({ referralCode: agent.referralCode, agent });
  } catch (error) {
    console.error("Referral code generation error:", error);
    return NextResponse.json({ error: "Failed to generate referral code" }, { status: 500 });
  }
}
