import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const listRooms = searchParams.get("listRooms");

  if (listRooms === "true") {
    const messages = await prisma.chatMessage.findMany({
      where: { OR: [{ senderId: session.id }, { receiverId: session.id }] },
      orderBy: { createdAt: "desc" },
    });

    const roomMap = new Map<string, { roomId: string; lastMessage: string; lastTime: Date; unread: number; otherUserId: string }>();
    for (const m of messages) {
      if (!roomMap.has(m.roomId)) {
        const otherUserId = m.senderId === session.id ? (m.receiverId || "") : m.senderId;
        roomMap.set(m.roomId, {
          roomId: m.roomId,
          lastMessage: m.message,
          lastTime: m.createdAt,
          unread: (!m.isRead && m.senderId !== session.id) ? 1 : 0,
          otherUserId,
        });
      } else if (!m.isRead && m.senderId !== session.id) {
        const room = roomMap.get(m.roomId)!;
        room.unread++;
      }
    }

    const rooms = Array.from(roomMap.values());
    const userIds = [...new Set(rooms.map(r => r.otherUserId).filter(Boolean))];
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, avatar: true, role: true } });
    const userMap = new Map(users.map(u => [u.id, u]));

    const roomsWithUsers = rooms.map(r => ({ ...r, otherUser: userMap.get(r.otherUserId) || null }));
    return NextResponse.json({ rooms: roomsWithUsers });
  }

  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  await prisma.chatMessage.updateMany({
    where: { roomId, receiverId: session.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, message } = await request.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  let targetId = receiverId;
  if (!targetId && session.role === "student") {
    const admin = await prisma.user.findFirst({ where: { role: "admin" }, select: { id: true } });
    targetId = admin?.id;
  }

  if (!targetId) return NextResponse.json({ error: "No receiver specified" }, { status: 400 });

  const ids = [session.id, targetId].sort();
  const roomId = `chat_${ids[0]}_${ids[1]}`;

  const chatMessage = await prisma.chatMessage.create({
    data: { senderId: session.id, receiverId: targetId, roomId, message: message.trim() },
  });

  await prisma.notification.create({
    data: {
      userId: targetId,
      title: "New Message",
      message: `${session.name}: ${message.trim().substring(0, 100)}`,
      type: "chat",
      link: "/dashboard/chat",
    },
  }).catch(() => {});

  return NextResponse.json({ chatMessage });
}
