/**
 * LINE Messaging API channel.
 *
 * Each Channel of type "line" stores its channel access token + channel
 * secret in `sessionData`. Inbound events come via the webhook at
 * /api/webhooks/line/[channelId]; we verify the X-Line-Signature header
 * before trusting any payload.
 *
 * Setup (per "Provider" → "Channel" in LINE Developers Console):
 *   1. Create a Messaging API channel.
 *   2. Copy the "Channel access token (long-lived)" + "Channel secret".
 *   3. Set webhook URL: https://<your-domain>/api/webhooks/line/<channelId>
 *   4. Enable "Use webhook" + disable auto-reply messages from LINE.
 */
import crypto from "node:crypto";
import { prisma } from "./prisma";

const API = "https://api.line.me/v2/bot";

export interface LineSession {
  channelAccessToken: string;
  channelSecret: string;
}

export function readLineSession(channel: { sessionData: string | null }): LineSession | null {
  if (!channel.sessionData) return null;
  try {
    return JSON.parse(channel.sessionData) as LineSession;
  } catch {
    return null;
  }
}

export async function setLineCredentials(channelId: string, opts: LineSession) {
  if (!opts.channelAccessToken || !opts.channelSecret) {
    throw new Error("channelAccessToken and channelSecret are required");
  }
  // Validate by calling /info
  const res = await fetch(`${API}/info`, {
    headers: { Authorization: `Bearer ${opts.channelAccessToken}` },
  });
  if (!res.ok) {
    throw new Error("Channel access token rejected by LINE");
  }
  await prisma.channel.update({
    where: { id: channelId },
    data: {
      sessionData: JSON.stringify(opts satisfies LineSession),
      status: "connected",
    },
  });
}

export function verifyLineSignature(channelSecret: string, rawBody: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function startLineChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) return { ok: false, error: "Channel not found" };
  if (!readLineSession(ch)) return { ok: false, error: "Credentials not set" };
  await prisma.channel.update({ where: { id: channelId }, data: { status: "connected" } });
  return { ok: true };
}

export async function stopLineChannel(channelId: string): Promise<void> {
  await prisma.channel.update({ where: { id: channelId }, data: { status: "disconnected" } });
}

export async function sendLineMessage(channelId: string, recipientId: string, text: string): Promise<void> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) throw new Error("Channel not found");
  const session = readLineSession(ch);
  if (!session) throw new Error("Channel not configured");
  const res = await fetch(`${API}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.channelAccessToken}`,
    },
    body: JSON.stringify({
      to: recipientId,
      messages: [{ type: "text", text }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE send failed: ${err.slice(0, 200)}`);
  }
}
