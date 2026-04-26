/**
 * Viber Bot channel.
 *
 * Each Channel of type "viber" stores its bot auth token. Inbound events
 * come via the webhook at /api/webhooks/viber/[channelId]; Viber signs
 * payloads with the same auth token (HMAC-SHA256 over the raw body).
 *
 * Setup (Viber Bot Admin Panel → Create Bot):
 *   1. Create a Bot account, get the auth token.
 *   2. Programmatically register the webhook (we call setWebhook() the
 *      first time the channel is started).
 */
import crypto from "node:crypto";
import { prisma } from "./prisma";

const API = "https://chatapi.viber.com/pa";

export interface ViberSession {
  authToken: string;
  botName?: string;
}

export function readViberSession(channel: { sessionData: string | null }): ViberSession | null {
  if (!channel.sessionData) return null;
  try {
    return JSON.parse(channel.sessionData) as ViberSession;
  } catch {
    return null;
  }
}

export async function setViberCredentials(channelId: string, opts: ViberSession) {
  if (!opts.authToken) throw new Error("authToken is required");
  // Validate by calling /get_account_info
  const res = await fetch(`${API}/get_account_info`, {
    method: "POST",
    headers: { "X-Viber-Auth-Token": opts.authToken, "Content-Type": "application/json" },
    body: "{}",
  });
  const data = (await res.json()) as { status?: number; status_message?: string; name?: string };
  if (data.status !== 0) {
    throw new Error(data.status_message || "Auth token rejected by Viber");
  }
  await prisma.channel.update({
    where: { id: channelId },
    data: {
      sessionData: JSON.stringify({ ...opts, botName: data.name } satisfies ViberSession),
      phoneNumber: data.name ?? null,
      status: "connected",
    },
  });
}

export function verifyViberSignature(authToken: string, rawBody: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", authToken).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function startViberChannel(
  channelId: string,
  webhookUrl?: string,
): Promise<{ ok: boolean; error?: string }> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) return { ok: false, error: "Channel not found" };
  const session = readViberSession(ch);
  if (!session) return { ok: false, error: "Credentials not set" };

  if (webhookUrl) {
    const res = await fetch(`${API}/set_webhook`, {
      method: "POST",
      headers: {
        "X-Viber-Auth-Token": session.authToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        event_types: ["message", "subscribed", "unsubscribed", "conversation_started"],
      }),
    });
    const data = (await res.json()) as { status?: number; status_message?: string };
    if (data.status !== 0) {
      return { ok: false, error: data.status_message || "Failed to register webhook" };
    }
  }

  await prisma.channel.update({ where: { id: channelId }, data: { status: "connected" } });
  return { ok: true };
}

export async function stopViberChannel(channelId: string): Promise<void> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  const session = ch ? readViberSession(ch) : null;
  if (session) {
    // Unregister the webhook so Viber stops calling us.
    await fetch(`${API}/set_webhook`, {
      method: "POST",
      headers: { "X-Viber-Auth-Token": session.authToken, "Content-Type": "application/json" },
      body: JSON.stringify({ url: "" }),
    }).catch(() => {});
  }
  await prisma.channel.update({ where: { id: channelId }, data: { status: "disconnected" } });
}

export async function sendViberMessage(channelId: string, receiverId: string, text: string): Promise<void> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) throw new Error("Channel not found");
  const session = readViberSession(ch);
  if (!session) throw new Error("Channel not configured");
  const res = await fetch(`${API}/send_message`, {
    method: "POST",
    headers: { "X-Viber-Auth-Token": session.authToken, "Content-Type": "application/json" },
    body: JSON.stringify({
      receiver: receiverId,
      sender: { name: session.botName || "Bot" },
      type: "text",
      text,
    }),
  });
  const data = (await res.json()) as { status?: number; status_message?: string };
  if (data.status !== 0) {
    throw new Error(`Viber send failed: ${data.status_message}`);
  }
}
