import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateUniqueId, escapeHtml } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where: Record<string, unknown> = {};
  if (session.role === "student") where.userId = session.id;

  const cards = await prisma.employeeCard.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatar: true, collegeName: true, address: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, designation, department, validFrom, validUntil, photoUrl } = body;

    if (!userId || !designation) {
      return NextResponse.json({ error: "User ID and designation are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.employeeCard.findFirst({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: "Card already exists for this user. Delete existing card first." }, { status: 400 });
    }

    const cardNumber = generateUniqueId("ID");

    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => { settingsMap[s.key] = s.value; });

    const companyName = escapeHtml(settingsMap.company_name || "InternPro");
    const companyLogo = settingsMap.company_logo || "";
    const companyAddress = escapeHtml(settingsMap.company_address || "");
    const safeName = escapeHtml(user.name);
    const safeDesignation = escapeHtml(designation);
    const safeDept = department ? escapeHtml(department) : "";
    const safeEmail = escapeHtml(user.email);
    const safePhone = user.phone ? escapeHtml(user.phone) : "";
    const photo = photoUrl || user.avatar || "";

    const qrCode = `${settingsMap.website_url || "https://internship.kkhsmedia.com"}/verify/card/${cardNumber}`;

    const card = await prisma.employeeCard.create({
      data: {
        userId,
        cardNumber,
        designation,
        department: department || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        photoUrl: photo || null,
        qrCode: JSON.stringify({
          cardNumber,
          name: safeName,
          designation: safeDesignation,
          company: companyName,
          verifyUrl: qrCode,
          companyLogo,
          companyAddress,
          email: safeEmail,
          phone: safePhone,
          department: safeDept,
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create employee card";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
