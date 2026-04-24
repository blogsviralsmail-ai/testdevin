import { NextRequest, NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await apiRequireAdmin();
    const body = await req.json();
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        role: body.role,
        plan: body.plan,
        conversationsQuota: body.conversationsQuota,
      },
    });
    return NextResponse.json({ user });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await apiRequireAdmin();
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
