import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const body = await req.json();
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: body.name },
    });
    return NextResponse.json({ user: { id: updated.id, name: updated.name, email: updated.email } });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
