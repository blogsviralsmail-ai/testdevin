import { NextRequest, NextResponse } from "next/server";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendChannelMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await apiRequireUser();
    const convo = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: { channel: true },
    });
    if (!convo || convo.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

    // Save message
    await prisma.message.create({
      data: { conversationId: params.id, role: "assistant", content: text },
    });
    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    });

    // Send via channel if connected
    if (convo.channel && convo.channel.status === "connected" && convo.contactNumber) {
      try {
        await sendChannelMessage(convo.channel.id, convo.contactNumber, text);
      } catch (e) {
        console.error("send failed", e);
      }
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
