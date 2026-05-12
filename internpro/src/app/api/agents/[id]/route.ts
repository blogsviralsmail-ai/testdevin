import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
      referrals: { include: { student: { select: { name: true, email: true, phone: true, enrollments: { select: { status: true, batch: { select: { program: { select: { title: true } } } } } } } } }, orderBy: { createdAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(agent);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const data = await request.json();

  const updated = await prisma.agent.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (agent) {
    await prisma.agent.delete({ where: { id } });
    await prisma.user.delete({ where: { id: agent.userId } });
  }
  return NextResponse.json({ success: true });
}
