import { prisma } from "./prisma";
import { generateEmbedding, cosineSimilarity } from "./openai";
import { getLLMClient } from "./llm";

interface RAGContext {
  agentId: string;
  workspaceId: string | null;
  query: string;
  topK?: number;
}

export async function retrieveRelevantKnowledge({ agentId, workspaceId, query, topK = 4 }: RAGContext) {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return [];

  // Pull every knowledge item visible to the agent's workspace —
  // either bound directly to the agent or workspace-wide (agentId=null).
  // Backward-compat: if the agent has no workspaceId yet (pre-backfill),
  // we restrict by ownerUserId via the agent's userId.
  const items = workspaceId
    ? await prisma.knowledgeItem.findMany({
        where: { workspaceId, OR: [{ agentId }, { agentId: null }] },
      })
    : [];

  const scored = items
    .map((item) => {
      if (!item.embedding) return { item, score: 0 };
      try {
        const emb = JSON.parse(item.embedding) as number[];
        return { item, score: cosineSimilarity(queryEmbedding, emb) };
      } catch {
        return { item, score: 0 };
      }
    })
    .filter((x) => x.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((s) => s.item);
}

export async function generateAgentReply(opts: {
  agentId: string;
  conversationId: string;
  userMessage: string;
}): Promise<string> {
  const { agentId, conversationId, userMessage } = opts;

  const llm = await getLLMClient();
  if (!llm) {
    return "⚠️ AI provider not configured. Admin, please set provider + API key in Admin → Settings.";
  }
  const { client, config } = llm;

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return "Agent not found.";

  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  recentMessages.reverse();

  const relevantKnowledge = await retrieveRelevantKnowledge({
    agentId,
    workspaceId: agent.workspaceId,
    query: userMessage,
  });
  const kbContext = relevantKnowledge.length
    ? `\n\nRelevant knowledge base entries:\n${relevantKnowledge.map((k) => `- ${k.title}: ${k.content.slice(0, 500)}`).join("\n")}`
    : "";

  const systemPrompt = `${agent.systemPrompt}

You are an AI sales rep. Your tone is ${agent.tone ?? "friendly and professional"}.
You respond in ${agent.language === "hi" ? "Hindi" : agent.language === "es" ? "Spanish" : agent.language === "pt" ? "Portuguese" : "English"}.
Keep replies short (1-3 sentences), conversational, and focused on moving the deal forward.
If user asks something you don't know, politely ask for clarification or escalate to a human.
${kbContext}`;

  // Per-agent model wins; otherwise fall back to the platform-wide default model.
  const model = agent.model || config.model;

  // recentMessages already includes the just-saved user turn; only append it
  // explicitly if the DB fetch didn't pick it up (e.g. future caller that
  // hasn't persisted it yet). This avoids sending the same message twice.
  const last = recentMessages[recentMessages.length - 1];
  const alreadyIncluded = last && last.role === "user" && last.content === userMessage;

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: agent.temperature,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
        ...(alreadyIncluded ? [] : [{ role: "user" as const, content: userMessage }]),
      ],
    });
    return completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return `⚠️ AI error: ${msg}`;
  }
}
