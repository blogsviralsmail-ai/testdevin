/**
 * Telegram Bot channel manager.
 *
 * Each Channel of type "telegram" stores its bot token in `sessionData`
 * (JSON: { botToken, offset }). We use long-polling against
 * api.telegram.org to keep the integration self-contained — no webhook
 * server / public URL required.
 *
 * Runtime: a single Node process per channel polls getUpdates with a
 * 25-second timeout. When messages arrive we mirror the WhatsApp flow:
 * upsert conversation, store message, generate AI reply (respecting
 * isAutoReply + quota), send back via sendMessage.
 */
import { prisma } from "./prisma";
import { generateAgentReply } from "./chat-engine";
import { generateEmbedding } from "./openai";
import { maybeSendQuotaWarning } from "./email";

const API_BASE = "https://api.telegram.org";

interface TelegramSession {
  botToken: string;
  offset?: number;
}

interface BotEntry {
  abort: AbortController;
  botToken: string;
  username?: string;
  offset: number;
}

const bots = new Map<string, BotEntry>();
const intentionalStops = new Set<string>();

function readSession(channel: { sessionData: string | null }): TelegramSession | null {
  if (!channel.sessionData) return null;
  try {
    return JSON.parse(channel.sessionData) as TelegramSession;
  } catch {
    return null;
  }
}

async function tg<T>(token: string, method: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const data = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result;
}

export async function setTelegramBotToken(channelId: string, botToken: string) {
  const trimmed = botToken.trim();
  // Validate the token with getMe so admins find typos immediately.
  const me = await tg<{ id: number; username: string }>(trimmed, "getMe");
  await prisma.channel.update({
    where: { id: channelId },
    data: {
      sessionData: JSON.stringify({ botToken: trimmed, offset: 0 } satisfies TelegramSession),
      phoneNumber: me.username,
      status: "disconnected",
    },
  });
}

export async function startTelegramChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  if (bots.has(channelId)) return { ok: true };

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return { ok: false, error: "Channel not found" };
  const session = readSession(channel);
  if (!session?.botToken) return { ok: false, error: "Bot token not set" };

  intentionalStops.delete(channelId);

  let me: { id: number; username: string };
  try {
    me = await tg(session.botToken, "getMe");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid bot token" };
  }

  const abort = new AbortController();
  const entry: BotEntry = { abort, botToken: session.botToken, username: me.username, offset: session.offset || 0 };
  bots.set(channelId, entry);

  await prisma.channel.update({
    where: { id: channelId },
    data: { status: "connected", phoneNumber: me.username, qrCode: null },
  });

  // Spin off the polling loop. The first transient error after we've gone
  // online schedules a reconnect (3s) unless the operator explicitly stopped.
  void pollLoop(channelId, entry).catch(async (err) => {
    if (intentionalStops.delete(channelId)) return;
    bots.delete(channelId);
    try {
      await prisma.channel.update({
        where: { id: channelId },
        data: { status: "disconnected" },
      });
    } catch {
      // channel deleted while running — nothing to update
    }
    if (!(err instanceof Error) || err.name !== "AbortError") {
      setTimeout(() => startTelegramChannel(channelId).catch(() => {}), 3000);
    }
  });

  return { ok: true };
}

export async function stopTelegramChannel(channelId: string) {
  const entry = bots.get(channelId);
  intentionalStops.add(channelId);
  if (entry) {
    entry.abort.abort();
    bots.delete(channelId);
  }
  try {
    await prisma.channel.update({
      where: { id: channelId },
      data: { status: "disconnected", qrCode: null },
    });
  } catch {
    // channel was deleted — nothing to do
  }
}

export async function sendTelegramMessage(channelId: string, chatId: string | number, text: string) {
  const entry = bots.get(channelId);
  if (!entry) throw new Error("Channel not connected");
  await tg(entry.botToken, "sendMessage", { chat_id: chatId, text });
}

interface TgUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
  };
}

async function pollLoop(channelId: string, entry: BotEntry) {
  while (!entry.abort.signal.aborted) {
    let updates: TgUpdate[];
    try {
      updates = await tg<TgUpdate[]>(
        entry.botToken,
        "getUpdates",
        { offset: entry.offset + 1, timeout: 25, allowed_updates: ["message"] },
        entry.abort.signal,
      );
    } catch (err) {
      if (entry.abort.signal.aborted) return;
      if (err instanceof Error && err.name === "AbortError") return;
      // transient — short backoff then retry
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    for (const update of updates) {
      entry.offset = Math.max(entry.offset, update.update_id);
      try {
        await handleUpdate(channelId, entry, update);
      } catch {
        // Per-message errors must never crash the loop.
      }
    }
    if (updates.length > 0) {
      // Persist offset so a restart doesn't replay old messages.
      try {
        await prisma.channel.update({
          where: { id: channelId },
          data: {
            sessionData: JSON.stringify({ botToken: entry.botToken, offset: entry.offset } satisfies TelegramSession),
          },
        });
      } catch {
        // channel deleted — exit cleanly
        return;
      }
    }
  }
}

async function handleUpdate(channelId: string, entry: BotEntry, update: TgUpdate) {
  const msg = update.message;
  if (!msg?.text || msg.chat.type !== "private") return; // skip groups/channels for v1

  const chatId = String(msg.chat.id);
  const contactName = msg.from?.first_name ?? msg.from?.username ?? chatId;
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch || !ch.agentId) return;

  let convo = await prisma.conversation.findFirst({
    where: { channelId, contactNumber: chatId, status: { not: "closed" } },
    orderBy: { lastMessageAt: "desc" },
  });
  let convoIsNew = false;
  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        userId: ch.userId,
        workspaceId: ch.workspaceId,
        agentId: ch.agentId,
        channelId,
        contactName,
        contactNumber: chatId,
      },
    });
    convoIsNew = true;
  }

  await prisma.message.create({
    data: { conversationId: convo.id, role: "user", content: msg.text },
  });

  const user = await prisma.user.findUnique({ where: { id: ch.userId } });
  if (!user) return;
  if (user.conversationsUsed >= user.conversationsQuota) {
    await tg(entry.botToken, "sendMessage", {
      chat_id: chatId,
      text: "Assistant is currently unavailable. Please try again later.",
    }).catch(() => {});
    return;
  }

  if (!convo.isAutoReply) {
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: new Date() },
    });
    return;
  }

  const reply = await generateAgentReply({
    agentId: ch.agentId,
    conversationId: convo.id,
    userMessage: msg.text,
  });
  await prisma.message.create({
    data: { conversationId: convo.id, role: "assistant", content: reply },
  });
  await prisma.conversation.update({
    where: { id: convo.id },
    data: { lastMessageAt: new Date() },
  });
  if (convoIsNew) {
    const updated = await prisma.user.update({
      where: { id: ch.userId },
      data: { conversationsUsed: { increment: 1 } },
    });
    void maybeSendQuotaWarning({
      userId: updated.id,
      email: updated.email,
      used: updated.conversationsUsed,
      quota: updated.conversationsQuota,
    }).catch(() => {});
  }
  await tg(entry.botToken, "sendMessage", { chat_id: chatId, text: reply }).catch(() => {});

  if (msg.text.length > 20 && reply.length > 20 && Math.random() < 0.15) {
    const content = `Customer: ${msg.text}\nAgent: ${reply}`;
    const emb = await generateEmbedding(content).catch(() => null);
    await prisma.knowledgeItem
      .create({
        data: {
          userId: ch.userId,
          agentId: ch.agentId,
          title: `Auto-learned: ${msg.text.slice(0, 40)}`,
          content,
          sourceType: "text",
          embedding: emb ? JSON.stringify(emb) : null,
        },
      })
      .catch(() => {});
  }
}
