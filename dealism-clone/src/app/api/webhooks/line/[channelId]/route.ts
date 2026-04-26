import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readLineSession, sendLineMessage, verifyLineSignature } from "@/lib/line";
import { ingestIncoming } from "@/lib/social-shared";

interface LineEvent {
  type?: string;
  source?: { userId?: string };
  message?: { type?: string; text?: string };
}

interface LineWebhookPayload {
  events?: LineEvent[];
}

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const ch = await prisma.channel.findUnique({ where: { id: params.channelId } });
  if (!ch) return NextResponse.json({ error: "channel not found" }, { status: 404 });
  const session = readLineSession(ch);
  if (!session) return NextResponse.json({ error: "channel not configured" }, { status: 400 });

  const rawBody = await req.text();
  const sig = req.headers.get("x-line-signature") || "";
  if (!verifyLineSignature(session.channelSecret, rawBody, sig)) {
    return NextResponse.json({ error: "signature mismatch" }, { status: 400 });
  }

  let body: LineWebhookPayload;
  try {
    body = JSON.parse(rawBody) as LineWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  for (const event of body.events ?? []) {
    if (event.type !== "message" || event.message?.type !== "text") continue;
    const userId = event.source?.userId;
    const text = event.message?.text;
    if (!userId || !text) continue;
    const { replyText } = await ingestIncoming({
      channelId: params.channelId,
      contactId: userId,
      text,
    });
    if (replyText) {
      try {
        await sendLineMessage(params.channelId, userId, replyText);
      } catch (err) {
        console.error("line send failed", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
