import { prisma } from "./prisma";
import { getOpenAIClient, generateEmbedding, cosineSimilarity } from "./openai";
import { getOpenAIModel } from "./settings";

interface RAGContext {
  agentId: string;
  userId: string;
  query: string;
  topK?: number;
}

export async function retrieveRelevantKnowledge({ agentId, userId, query, topK = 4 }: RAGContext) {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return [];

  const items = await prisma.knowledgeItem.findMany({
    where: { userId, OR: [{ agentId }, { agentId: null }] },
  });

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

  const client = await getOpenAIClient();
  if (!client) {
    return "⚠️ OpenAI API key not configured. Admin, please set it in Admin → Settings.";
  }

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
    userId: agent.userId,
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

  const model = agent.model || (await getOpenAIModel());

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
        { role: "user", content: userMessage },
      ],
    });
    return completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return `⚠️ AI error: ${msg}`;
  }
}
