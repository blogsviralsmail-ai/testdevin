import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    const item = await prisma.knowledgeItem.findUnique({ where: { id: params.id } });
    if (!item || item.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.knowledgeItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
