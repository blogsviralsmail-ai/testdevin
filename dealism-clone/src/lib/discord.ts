/**
 * Discord Bot channel.
 *
 * Each Channel of type "discord" runs its own discord.js gateway
 * connection. Direct messages to the bot trigger the standard
 * "ingest -> AI reply -> send" pipeline (mirrors Telegram). We listen
 * on the GuildMessages + DirectMessages + MessageContent intents — the
 * admin must enable "Message Content Intent" in the Discord developer
 * portal for this bot.
 *
 * Setup checklist:
 *   1. Create an Application at https://discord.com/developers/applications
 *   2. "Bot" tab → reset/copy token, paste here
 *   3. Enable Privileged Gateway Intents → Message Content Intent
 *   4. OAuth2 → URL Generator → scopes: bot, applications.commands;
 *      permissions: Send Messages, Read Message History, View Channels;
 *      paste resulting invite URL into your guild's browser.
 */
import { Client, Events, GatewayIntentBits, Partials, type Message } from "discord.js";
import { prisma } from "./prisma";
import { ingestIncoming } from "./social-shared";

interface DiscordSession {
  botToken: string;
  username?: string;
}

interface BotEntry {
  client: Client;
  botToken: string;
}

const bots = new Map<string, BotEntry>();
const intentionalStops = new Set<string>();

function readSession(channel: { sessionData: string | null }): DiscordSession | null {
  if (!channel.sessionData) return null;
  try {
    return JSON.parse(channel.sessionData) as DiscordSession;
  } catch {
    return null;
  }
}

export async function setDiscordBotToken(channelId: string, botToken: string) {
  const trimmed = botToken.trim();
  // Validate by spinning up a one-shot client.
  const probe = new Client({ intents: [GatewayIntentBits.Guilds] });
  try {
    await probe.login(trimmed);
    const username = probe.user?.username;
    await prisma.channel.update({
      where: { id: channelId },
      data: {
        sessionData: JSON.stringify({ botToken: trimmed, username } satisfies DiscordSession),
        phoneNumber: username ?? null,
        status: "disconnected",
      },
    });
  } finally {
    await probe.destroy().catch(() => {});
  }
}

export async function startDiscordChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  if (bots.has(channelId)) return { ok: true };

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return { ok: false, error: "Channel not found" };
  const session = readSession(channel);
  if (!session?.botToken) return { ok: false, error: "Bot token not set" };

  intentionalStops.delete(channelId);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.once(Events.ClientReady, async (c) => {
    await prisma.channel.update({
      where: { id: channelId },
      data: { status: "connected", phoneNumber: c.user.username },
    });
  });

  client.on(Events.MessageCreate, async (msg: Message) => {
    try {
      if (msg.author.bot) return;
      if (!msg.content) return;
      const me = client.user?.id;
      // Reply to: DMs always; in guilds only when @-mentioned (avoid spam).
      const isDm = !msg.guildId;
      const mentioned = me ? msg.mentions.users.has(me) : false;
      if (!isDm && !mentioned) return;

      // Strip our own mention from the text so the AI sees a clean user query.
      const text = msg.content.replace(new RegExp(`<@!?${me}>`, "g"), "").trim();
      if (!text) return;

      const contactId = isDm ? `dm:${msg.author.id}` : `guild:${msg.guildId}:${msg.channelId}:${msg.author.id}`;
      const { replyText } = await ingestIncoming({
        channelId,
        contactId,
        contactName: msg.author.username,
        text,
      });
      if (replyText) {
        try {
          await msg.reply(replyText);
        } catch {
          // Reply API can fail if message was deleted; fall back to channel.send
          // when the channel actually supports it (PartialGroupDMChannel etc. don't).
          const ch = msg.channel as unknown as { send?: (text: string) => Promise<unknown> };
          if (typeof ch.send === "function") {
            await ch.send(replyText).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error("discord MessageCreate handler error", err);
    }
  });

  client.on(Events.Error, (err) => {
    console.error("discord client error", err);
  });

  client.on(Events.ShardDisconnect, () => {
    if (intentionalStops.has(channelId)) return;
    // discord.js auto-reconnects on transient drops; nothing for us to do.
  });

  try {
    await client.login(session.botToken);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Login failed" };
  }

  bots.set(channelId, { client, botToken: session.botToken });
  return { ok: true };
}

export async function stopDiscordChannel(channelId: string): Promise<void> {
  intentionalStops.add(channelId);
  const entry = bots.get(channelId);
  if (entry) {
    await entry.client.destroy().catch(() => {});
    bots.delete(channelId);
  }
  await prisma.channel.update({
    where: { id: channelId },
    data: { status: "disconnected" },
  });
}

/**
 * Sends a message via the active gateway client. `to` follows the same
 * scheme produced by the inbound handler:
 *   - "dm:<userId>"      → DM the user
 *   - "guild:<g>:<c>:<u>" → post in that channel (and ping user)
 */
export async function sendDiscordMessage(channelId: string, to: string, text: string): Promise<void> {
  const entry = bots.get(channelId);
  if (!entry) throw new Error("Discord channel not connected");
  const c = entry.client;
  if (to.startsWith("dm:")) {
    const userId = to.slice(3);
    const user = await c.users.fetch(userId);
    await user.send(text);
    return;
  }
  if (to.startsWith("guild:")) {
    const [, , chanId, userId] = to.split(":");
    const ch = await c.channels.fetch(chanId);
    if (ch && "send" in ch && typeof ch.send === "function") {
      await ch.send(`<@${userId}> ${text}`);
      return;
    }
  }
  throw new Error(`Unknown Discord recipient format: ${to}`);
}
