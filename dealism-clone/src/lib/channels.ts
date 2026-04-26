/**
 * Channel-type dispatcher. Each channel type has its own connection
 * manager; this module routes API-level start/stop/send calls to the
 * right one based on `channel.type` so the route handlers don't have
 * to switch on type themselves.
 */
import { prisma } from "./prisma";
import {
  startChannel as startWhatsApp,
  stopChannel as stopWhatsApp,
  destroyChannel as destroyWhatsApp,
  sendChannelMessage as sendWhatsApp,
} from "./whatsapp";
import { startTelegramChannel, stopTelegramChannel, sendTelegramMessage } from "./telegram";
import { startMessengerChannel, stopMessengerChannel, sendMessengerMessage } from "./messenger";
import { startLineChannel, stopLineChannel, sendLineMessage } from "./line";
import { startViberChannel, stopViberChannel, sendViberMessage } from "./viber";

export type ChannelType = "whatsapp" | "telegram" | "messenger" | "line" | "viber";

export const SUPPORTED_CHANNEL_TYPES: ChannelType[] = [
  "whatsapp",
  "telegram",
  "messenger",
  "line",
  "viber",
];

async function getType(channelId: string): Promise<ChannelType | null> {
  const ch = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!ch) return null;
  switch (ch.type) {
    case "telegram":
    case "messenger":
    case "line":
    case "viber":
      return ch.type;
    default:
      return "whatsapp"; // legacy + explicit "whatsapp"
  }
}

export async function startChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  const type = await getType(channelId);
  if (!type) return { ok: false, error: "Channel not found" };
  switch (type) {
    case "telegram":
      return startTelegramChannel(channelId);
    case "messenger":
      return startMessengerChannel(channelId);
    case "line":
      return startLineChannel(channelId);
    case "viber":
      return startViberChannel(channelId);
    default:
      return startWhatsApp(channelId);
  }
}

export async function stopChannel(channelId: string): Promise<void> {
  const type = await getType(channelId);
  if (!type) return;
  switch (type) {
    case "telegram":
      return stopTelegramChannel(channelId);
    case "messenger":
      return stopMessengerChannel(channelId);
    case "line":
      return stopLineChannel(channelId);
    case "viber":
      return stopViberChannel(channelId);
    default:
      return stopWhatsApp(channelId);
  }
}

/**
 * Tear-down used by the channel-delete route. For WhatsApp this also
 * wipes the persisted Baileys auth directory; other providers don't
 * have on-disk session state, so destroyChannel === stopChannel.
 */
export async function destroyChannel(channelId: string): Promise<void> {
  const type = await getType(channelId);
  if (!type) return;
  if (type === "whatsapp") return destroyWhatsApp(channelId);
  return stopChannel(channelId);
}

export async function sendChannelMessage(
  channelId: string,
  to: string,
  text: string,
): Promise<void> {
  const type = await getType(channelId);
  if (!type) throw new Error("Channel not found");
  switch (type) {
    case "telegram":
      return sendTelegramMessage(channelId, to, text);
    case "messenger":
      return sendMessengerMessage(channelId, to, text);
    case "line":
      return sendLineMessage(channelId, to, text);
    case "viber":
      return sendViberMessage(channelId, to, text);
    default:
      return sendWhatsApp(channelId, to, text);
  }
}
