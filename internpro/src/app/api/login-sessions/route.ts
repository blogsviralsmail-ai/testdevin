import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = { user: { deletedAt: null } };
  if (session.role === "student") {
    where.userId = session.id;
  } else if (studentId) {
    where.userId = studentId;
  }

  const sessions = await prisma.loginSession.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { date: "desc" },
    take: 60,
  });

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  if (action === "heartbeat") {
    const existing = await prisma.loginSession.findUnique({
      where: { userId_date: { userId: session.id, date: today } },
    });

    if (existing) {
      const loginParts = existing.loginTime.split(":");
      const loginMin = parseInt(loginParts[0]) * 60 + parseInt(loginParts[1]);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const totalMinutes = Math.max(0, nowMin - loginMin);

      await prisma.loginSession.update({
        where: { userId_date: { userId: session.id, date: today } },
        data: { logoutTime: timeStr, totalMinutes },
      });
    } else {
      await prisma.loginSession.create({
        data: { userId: session.id, date: today, loginTime: timeStr },
      });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
