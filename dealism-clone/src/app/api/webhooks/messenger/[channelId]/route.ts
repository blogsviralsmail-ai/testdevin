import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { readMessengerSession, sendMessengerMessage } from "@/lib/messenger";
import { ingestIncoming } from "@/lib/social-shared";

/**
 * GET — used once at setup time for Meta's webhook verification challenge.
 * Meta sends ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=... and
 * expects us to echo back the challenge if the verify_token matches.
 */
export async function GET(req: NextRequest, { params }: { params: { channelId: string } }) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const ch = await prisma.channel.findUnique({ where: { id: params.channelId } });
  const session = ch ? readMessengerSession(ch) : null;
  if (mode === "subscribe" && session && token === session.verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

interface MessengerEvent {
  sender?: { id?: string };
  message?: { text?: string };
}

interface MessengerEntry {
  messaging?: MessengerEvent[];
}

interface MessengerWebhookPayload {
  object?: string;
  entry?: MessengerEntry[];
}

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const ch = await prisma.channel.findUnique({ where: { id: params.channelId } });
  if (!ch) return NextResponse.json({ error: "channel not found" }, { status: 404 });
  const session = readMessengerSession(ch);
  if (!session) return NextResponse.json({ error: "channel not configured" }, { status: 400 });

  const rawBody = await req.text();

  // Meta App Secret Proof verification (X-Hub-Signature-256). Only
  // *required* once the admin has saved a messenger_app_secret — but
  // when it IS set, we enforce strictly: a missing or malformed header
  // is an outright reject, otherwise an attacker could simply omit the
  // header to bypass HMAC verification.
  const sigHeader = req.headers.get("x-hub-signature-256") || "";
  const appSecretSetting = await prisma.setting.findUnique({ where: { key: "messenger_app_secret" } });
  if (appSecretSetting?.value) {
    if (!sigHeader.startsWith("sha256=")) {
      return NextResponse.json({ error: "missing or malformed signature" }, { status: 400 });
    }
    const expected =
      "sha256=" + crypto.createHmac("sha256", appSecretSetting.value).update(rawBody).digest("hex");
    if (
      expected.length !== sigHeader.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigHeader))
    ) {
      return NextResponse.json({ error: "signature mismatch" }, { status: 400 });
    }
  }

  let body: MessengerWebhookPayload;
  try {
    body = JSON.parse(rawBody) as MessengerWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (body.object !== "page") return NextResponse.json({ ok: true });

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const text = event.message?.text;
      if (!senderId || !text) continue;
      const { replyText } = await ingestIncoming({
        channelId: params.channelId,
        contactId: senderId,
        text,
      });
      if (replyText) {
        try {
          await sendMessengerMessage(params.channelId, senderId, replyText);
        } catch (err) {
          console.error("messenger send failed", err);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
