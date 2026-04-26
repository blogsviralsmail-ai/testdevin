/**
 * Backwards-compatible shim — the codebase originally only supported OpenAI.
 * New code should import from "./llm" instead. We keep this module so that
 * existing imports (and the embedding helper) keep working while the admin
 * can now point the chat client at any OpenAI-compatible provider.
 */
import { getEmbeddingClient, getLLMClient } from "./llm";

export async function getOpenAIClient() {
  const result = await getLLMClient();
  return result?.client ?? null;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const result = await getEmbeddingClient();
  if (!result) return null;
  try {
    const res = await result.client.embeddings.create({
      model: result.config.model,
      input: text.slice(0, 8000),
    });
    return res.data[0]?.embedding ?? null;
  } catch {
    // Provider may not support embeddings (e.g. DeepSeek/Groq). Caller treats
    // null as "skip RAG" and the system still works without semantic search.
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
