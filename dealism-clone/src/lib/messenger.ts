/**
 * Facebook Messenger (Page) channel.
 *
 * Uses the Meta Graph API. Each Channel of type "messenger" stores its
 * Page Access Token + verify token in `sessionData`. Inbound DMs come
 * via the webhook at /api/webhooks/messenger/[channelId] (Meta calls
 * us). Outbound messages POST to graph.facebook.com.
 *
 * Setup checklist for the admin (per Page they want to connect):
 *   1. Create a Meta App + add the Messenger product.
 *   2. Generate a Page Access Token for the Page.
 *   3. Subscribe the App to the Page's `messages` + `messaging_postbacks`.
 *   4. Configure the webhook URL: https://<your-domain>/api/webhooks/messenger/<channelId>
 *   5. Use the same `verify_token` here and in the dashboard.
 */
import { prisma } from "./prisma";

const GRAPH = "https://graph.facebook.com/v20.0";

export interface MessengerSession {
  pageAccessToken: string;
  verifyToken: string;
  pageId?: string;
}

export function readMessengerSession(channel: { sessionData: string | null }): MessengerSession | null {
  if (!channel.sessionData) return null;
  try {
    return JSON.parse(channel.sessionData) as MessengerSession;
  } catch {
    return null;
  }
}

export async function setMessengerCredentials(channelId: string, opts: MessengerSession) {
  if (!opts.pageAccessToken || !opts.verifyToken) {
    throw new Error("pageAccessToken and verifyToken are required");
  }
  // Verify the token works by hitting /me
  const res = await fetch(`${GRAPH}/me?access_token=${encodeURIComponent(opts.pageAccessToken)}`);
  const data = (await res.json()) as { id?: string; name?: string; error?: { message?: string } };
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || "Page Access Token rejected by Meta");
  }
  await prisma.channel.update({
    where: { id: channelId },
    data: {
      sessionData: JSON.stringify({ ...opts, pageId: data.id } satisfies MessengerSession),
      phoneNumber: data.name ?? null,
      status: "connected",
    },
  });
}

export async function startMessengerChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  // Webhook-based — nothing to "start" beyond marking connected.
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) return { ok: false, error: "Channel not found" };
  if (!readMessengerSession(ch)) return { ok: false, error: "Credentials not set" };
  await prisma.channel.update({ where: { id: channelId }, data: { status: "connected" } });
  return { ok: true };
}

export async function stopMessengerChannel(channelId: string): Promise<void> {
  await prisma.channel.update({
    where: { id: channelId },
    data: { status: "disconnected" },
  });
}

export async function sendMessengerMessage(channelId: string, recipientId: string, text: string): Promise<void> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) throw new Error("Channel not found");
  const session = readMessengerSession(ch);
  if (!session) throw new Error("Channel not configured");
  const res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(session.pageAccessToken)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Messenger send failed: ${err.slice(0, 200)}`);
  }
}
