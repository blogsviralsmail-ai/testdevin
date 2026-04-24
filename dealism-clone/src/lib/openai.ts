import OpenAI from "openai";
import { getOpenAIKey } from "./settings";

export async function getOpenAIClient(): Promise<OpenAI | null> {
  const key = await getOpenAIKey();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = await getOpenAIClient();
  if (!client) return null;
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return res.data[0]?.embedding ?? null;
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
