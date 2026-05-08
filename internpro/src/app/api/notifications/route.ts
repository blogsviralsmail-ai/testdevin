import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}

// Mark as read
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAll } = await request.json();

  if (markAll) {
    await prisma.notification.updateMany({ where: { userId: session.id, isRead: false }, data: { isRead: true } });
  } else if (id) {
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  return NextResponse.json({ success: true });
}
