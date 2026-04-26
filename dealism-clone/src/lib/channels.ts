/**
 * Channel-type dispatcher. Each channel type has its own connection
 * manager (whatsapp.ts, telegram.ts, …); this module routes API-level
 * calls to the right one based on channel.type so the routes don't have
 * to switch on type themselves.
 */
import { prisma } from "./prisma";
import { startChannel as startWhatsApp, stopChannel as stopWhatsApp, sendChannelMessage as sendWhatsApp } from "./whatsapp";
import { startTelegramChannel, stopTelegramChannel, sendTelegramMessage } from "./telegram";

export type ChannelType = "whatsapp" | "telegram";

async function getType(channelId: string): Promise<ChannelType | null> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) return null;
  if (ch.type === "telegram") return "telegram";
  return "whatsapp"; // default for legacy rows + the original whatsapp type
}

export async function startChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  const type = await getType(channelId);
  if (!type) return { ok: false, error: "Channel not found" };
  if (type === "telegram") return startTelegramChannel(channelId);
  return startWhatsApp(channelId);
}

export async function stopChannel(channelId: string): Promise<void> {
  const type = await getType(channelId);
  if (!type) return;
  if (type === "telegram") return stopTelegramChannel(channelId);
  return stopWhatsApp(channelId);
}

export async function sendChannelMessage(channelId: string, to: string, text: string): Promise<void> {
  const type = await getType(channelId);
  if (!type) throw new Error("Channel not found");
  if (type === "telegram") return sendTelegramMessage(channelId, to, text);
  return sendWhatsApp(channelId, to, text);
}
