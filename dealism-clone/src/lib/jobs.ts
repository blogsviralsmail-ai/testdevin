/**
 * Background-job handlers. registerJobs() is called once at process
 * startup (see src/instrumentation.ts) so handlers are available for
 * both Redis-backed and inline-fallback queueing.
 */
import { prisma } from "./prisma";
import { sendChannelMessage } from "./channels";
import { registerWorker } from "./queue";

export interface FollowUpPayload {
  conversationId: string;
  text: string;
}

let registered = false;

export function registerJobs(): void {
  if (registered) return;
  registered = true;

  /**
   * Send a follow-up message to a conversation. Used to gently re-engage
   * leads who've gone quiet ("Hey, just checking in — any questions?").
   * Skipped if the conversation has been closed or moved off auto-reply
   * since the job was scheduled.
   */
  registerWorker<FollowUpPayload>("send_followup", async (payload) => {
    const convo = await prisma.conversation.findUnique({
      where: { id: payload.conversationId },
    });
    if (!convo || convo.status === "closed" || !convo.channelId || !convo.contactNumber) return;

    await prisma.message.create({
      data: { conversationId: convo.id, role: "assistant", content: payload.text },
    });
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: new Date() },
    });
    try {
      await sendChannelMessage(convo.channelId, convo.contactNumber, payload.text);
    } catch {
      // Channel may have been disconnected — message stays in our DB so the
      // operator sees the intent even if delivery fails.
    }
  });
}
