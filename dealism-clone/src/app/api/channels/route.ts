import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const body = await req.json();
    const channel = await prisma.channel.create({
      data: {
        userId: user.id,
        name: body.name || "WhatsApp",
        type: body.type || "whatsapp",
        agentId: body.agentId || null,
      },
    });
    return NextResponse.json({ channel });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const user = await apiRequireUser();
    const channels = await prisma.channel.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ channels });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
