import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readViberSession, sendViberMessage, verifyViberSignature } from "@/lib/viber";
import { ingestIncoming } from "@/lib/social-shared";

interface ViberWebhookPayload {
  event?: string;
  sender?: { id?: string; name?: string };
  message?: { type?: string; text?: string };
}

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const ch = await prisma.channel.findUnique({ where: { id: params.channelId } });
  if (!ch) return NextResponse.json({ error: "channel not found" }, { status: 404 });
  const session = readViberSession(ch);
  if (!session) return NextResponse.json({ error: "channel not configured" }, { status: 400 });

  const rawBody = await req.text();
  const sig = req.headers.get("x-viber-content-signature") || "";
  if (!verifyViberSignature(session.authToken, rawBody, sig)) {
    return NextResponse.json({ error: "signature mismatch" }, { status: 400 });
  }

  let body: ViberWebhookPayload;
  try {
    body = JSON.parse(rawBody) as ViberWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (body.event !== "message" || body.message?.type !== "text") {
    return NextResponse.json({ ok: true });
  }
  const senderId = body.sender?.id;
  const text = body.message?.text;
  if (!senderId || !text) return NextResponse.json({ ok: true });

  const { replyText } = await ingestIncoming({
    channelId: params.channelId,
    contactId: senderId,
    contactName: body.sender?.name,
    text,
  });
  if (replyText) {
    try {
      await sendViberMessage(params.channelId, senderId, replyText);
    } catch (err) {
      console.error("viber send failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
