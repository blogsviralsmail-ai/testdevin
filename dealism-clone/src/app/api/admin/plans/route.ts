import { NextRequest, NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    await apiRequireAdmin();
    const { plans } = await req.json();
    await prisma.$transaction(async (tx) => {
      await tx.plan.deleteMany();
      for (const p of plans) {
        await tx.plan.create({
          data: {
            name: p.name,
            slug: p.slug,
            priceMonthly: p.priceMonthly,
            priceAnnual: p.priceAnnual,
            conversationsQuota: p.conversationsQuota,
            features: p.features,
            isPopular: !!p.isPopular,
            sortOrder: p.sortOrder ?? 0,
            isActive: true,
          },
        });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
