import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRequireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Tight bounds on every field. Plan must reference an existing slug
// (validated below). Quota is non-negative and capped to a sane upper
// bound so a typo / hostile payload can't write absurd values.
const patchSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  plan: z.string().min(1).max(64).optional(),
  conversationsQuota: z.number().int().min(0).max(10_000_000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await apiRequireAdmin();
    const body = await req.json();
    const parsed = patchSchema.parse(body);

    if (admin.id === params.id && parsed.role && parsed.role !== "admin") {
      return NextResponse.json(
        { error: "Cannot demote your own account" },
        { status: 400 },
      );
    }

    if (parsed.plan) {
      const exists = await prisma.plan.findUnique({ where: { slug: parsed.plan } });
      if (!exists) {
        return NextResponse.json({ error: `Unknown plan slug: ${parsed.plan}` }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: parsed,
    });
    return NextResponse.json({ user });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await apiRequireAdmin();
    if (admin.id === params.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
