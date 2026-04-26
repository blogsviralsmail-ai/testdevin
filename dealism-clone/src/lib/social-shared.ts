/**
 * Shared "incoming-message" pipeline used by webhook-based social
 * channels (messenger, line, viber, …). Centralises:
 *   - upsert conversation by (channelId, contactNumber)
 *   - persist user message
 *   - quota gate / manual-mode gate
 *   - generate AI reply via chat-engine
 *   - persist assistant message + bump lastMessageAt
 *   - quota-counter increment on first message of a new conversation
 *   - opportunistic auto-learn into KnowledgeItem
 *
 * Each provider only needs to implement transport (send + receive) and
 * call this helper with the parsed event.
 */
import { prisma } from "./prisma";
import { generateAgentReply } from "./chat-engine";
import { generateEmbedding } from "./openai";
import { maybeSendQuotaWarning } from "./email";

export async function ingestIncoming(opts: {
  channelId: string;
  contactId: string;
  contactName?: string;
  text: string;
}): Promise<{ replyText: string | null; conversationId: string | null }> {
  const channel = await prisma.channel.findUnique({ where: { id: opts.channelId } });
  if (!channel || !channel.agentId) return { replyText: null, conversationId: null };

  let convo = await prisma.conversation.findFirst({
    where: { channelId: channel.id, contactNumber: opts.contactId, status: { not: "closed" } },
    orderBy: { lastMessageAt: "desc" },
  });
  let convoIsNew = false;
  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        userId: channel.userId,
        agentId: channel.agentId,
        channelId: channel.id,
        contactName: opts.contactName ?? opts.contactId,
        contactNumber: opts.contactId,
      },
    });
    convoIsNew = true;
  }

  await prisma.message.create({
    data: { conversationId: convo.id, role: "user", content: opts.text },
  });

  const user = await prisma.user.findUnique({ where: { id: channel.userId } });
  if (!user) return { replyText: null, conversationId: convo.id };
  if (user.conversationsUsed >= user.conversationsQuota) {
    return {
      replyText: "Assistant is currently unavailable. Please try again later.",
      conversationId: convo.id,
    };
  }

  if (!convo.isAutoReply) {
    // Manual mode — bubble the conversation to the top of the dashboard
    // but don't auto-reply.
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: new Date() },
    });
    return { replyText: null, conversationId: convo.id };
  }

  const reply = await generateAgentReply({
    agentId: channel.agentId,
    conversationId: convo.id,
    userMessage: opts.text,
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
      where: { id: channel.userId },
      data: { conversationsUsed: { increment: 1 } },
    });
    void maybeSendQuotaWarning({
      userId: updated.id,
      email: updated.email,
      used: updated.conversationsUsed,
      quota: updated.conversationsQuota,
    }).catch(() => {});
  }

  // Opportunistic auto-learn — same heuristic as Telegram/WhatsApp.
  if (opts.text.length > 20 && reply.length > 20 && Math.random() < 0.15) {
    const content = `Customer: ${opts.text}\nAgent: ${reply}`;
    const emb = await generateEmbedding(content).catch(() => null);
    void prisma.knowledgeItem
      .create({
        data: {
          userId: channel.userId,
          agentId: channel.agentId,
          title: `Auto-learned: ${opts.text.slice(0, 40)}`,
          content,
          sourceType: "text",
          embedding: emb ? JSON.stringify(emb) : null,
        },
      })
      .catch(() => {});
  }

  return { replyText: reply, conversationId: convo.id };
}
