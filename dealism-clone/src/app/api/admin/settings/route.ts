import { NextRequest, NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    await apiRequireAdmin();
    const body = await req.json();
    const entries: Array<{ key: string; value: string; category?: string }> = body.settings ?? [];
    for (const e of entries) {
      await prisma.setting.upsert({
        where: { key: e.key },
        update: { value: e.value, category: e.category ?? "general" },
        create: { key: e.key, value: e.value, category: e.category ?? "general" },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function GET() {
  try {
    await apiRequireAdmin();
    const settings = await prisma.setting.findMany();
    return NextResponse.json({ settings });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
