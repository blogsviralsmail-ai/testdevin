/* eslint-disable react-hooks/rules-of-hooks */
/**
 * WhatsApp connection manager using Baileys (QR-scan / Linked Devices).
 * This is an in-memory manager — for production, persist auth state to disk/DB per channel.
 *
 * Each Channel row corresponds to one Baileys socket. Auth state is stored under
 * ./baileys-auth/<channelId>/. QR codes are written to DB so the UI can poll them.
 */
import { makeWASocket, useMultiFileAuthState, DisconnectReason, WASocket } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import pino from "pino";
import { prisma } from "./prisma";
import { generateAgentReply } from "./chat-engine";
import { generateEmbedding } from "./openai";

const AUTH_ROOT = path.resolve(process.cwd(), "baileys-auth");

interface SocketEntry {
  sock: WASocket;
  qr?: string;
}

const sockets = new Map<string, SocketEntry>();
// Tracks channels the operator explicitly asked to stop, so the close
// handler doesn't schedule an auto-reconnect right after stopChannel().
const intentionalStops = new Set<string>();
const logger = pino({ level: "silent" });

export async function startChannel(channelId: string): Promise<{ ok: boolean; error?: string }> {
  if (sockets.has(channelId)) return { ok: true };

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return { ok: false, error: "Channel not found" };

  // Clear any leftover stop flag from a previous session — stopChannel
  // adds one unconditionally even when no socket was running, which would
  // otherwise suppress auto-reconnect on the first transient drop.
  intentionalStops.delete(channelId);

  const authDir = path.join(AUTH_ROOT, channelId);
  fs.mkdirSync(authDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["Dealism Clone", "Chrome", "1.0.0"],
  });

  sockets.set(channelId, { sock });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      sockets.set(channelId, { sock, qr });
      await prisma.channel.update({
        where: { id: channelId },
        data: { qrCode: qr, status: "connecting" },
      });
    }
    if (connection === "open") {
      await prisma.channel.update({
        where: { id: channelId },
        data: {
          status: "connected",
          qrCode: null,
          phoneNumber: sock.user?.id?.split(":")[0] ?? null,
        },
      });
    }
    if (connection === "close") {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      sockets.delete(channelId);
      await prisma.channel.update({
        where: { id: channelId },
        data: { status: "disconnected", qrCode: null },
      });
      const wasIntentional = intentionalStops.delete(channelId);
      if (!wasIntentional && code !== DisconnectReason.loggedOut) {
        setTimeout(() => startChannel(channelId).catch(() => {}), 3000);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid) continue;
      if (remoteJid.endsWith("@g.us")) continue; // skip group messages for now
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";
      if (!text.trim()) continue;

      const contactNumber = remoteJid.split("@")[0];
      const contactName = msg.pushName ?? contactNumber;

      const ch = await prisma.channel.findUnique({ where: { id: channelId } });
      if (!ch || !ch.agentId) continue;

      let convo = await prisma.conversation.findFirst({
        where: { channelId, contactNumber, status: { not: "closed" } },
        orderBy: { lastMessageAt: "desc" },
      });
      if (!convo) {
        convo = await prisma.conversation.create({
          data: {
            userId: ch.userId,
            agentId: ch.agentId,
            channelId,
            contactName,
            contactNumber,
          },
        });
      }

      await prisma.message.create({
        data: { conversationId: convo.id, role: "user", content: text },
      });

      const user = await prisma.user.findUnique({ where: { id: ch.userId } });
      if (!user) continue;
      if (user.conversationsUsed >= user.conversationsQuota) {
        await sock
          .sendMessage(remoteJid, { text: "Assistant is currently unavailable. Please try again later." })
          .catch(() => {});
        continue;
      }

      if (!convo.isAutoReply) {
        // Manual-reply mode: bubble the conversation to the top so the human
        // operator sees the new incoming message in the dashboard.
        await prisma.conversation.update({
          where: { id: convo.id },
          data: { lastMessageAt: new Date() },
        });
        continue;
      }

      const reply = await generateAgentReply({
        agentId: ch.agentId,
        conversationId: convo.id,
        userMessage: text,
      });

      await prisma.message.create({
        data: { conversationId: convo.id, role: "assistant", content: reply },
      });
      await prisma.conversation.update({
        where: { id: convo.id },
        data: { lastMessageAt: new Date() },
      });
      await prisma.user.update({
        where: { id: ch.userId },
        data: { conversationsUsed: { increment: 1 } },
      });
      await sock.sendMessage(remoteJid, { text: reply }).catch(() => {});

      // Auto-learn: store conversation snippet as knowledge (lightweight self-learning)
      if (text.length > 20 && reply.length > 20 && Math.random() < 0.15) {
        const content = `Customer: ${text}\nAgent: ${reply}`;
        const emb = await generateEmbedding(content).catch(() => null);
        await prisma.knowledgeItem.create({
          data: {
            userId: ch.userId,
            agentId: ch.agentId,
            title: `Auto-learned: ${text.slice(0, 40)}`,
            content,
            sourceType: "text",
            embedding: emb ? JSON.stringify(emb) : null,
          },
        });
      }
    }
  });

  return { ok: true };
}

export async function stopChannel(channelId: string) {
  const entry = sockets.get(channelId);
  intentionalStops.add(channelId);
  if (entry) {
    try {
      entry.sock.end(undefined);
    } catch {}
    sockets.delete(channelId);
  }
  const authDir = path.join(AUTH_ROOT, channelId);
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
  }
  await prisma.channel.update({
    where: { id: channelId },
    data: { status: "disconnected", qrCode: null, sessionData: null },
  });
}

export function getChannelQR(channelId: string): string | null {
  return sockets.get(channelId)?.qr ?? null;
}

export async function sendChannelMessage(channelId: string, to: string, text: string) {
  const entry = sockets.get(channelId);
  if (!entry) throw new Error("Channel not connected");
  const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;
  await entry.sock.sendMessage(jid, { text });
}
