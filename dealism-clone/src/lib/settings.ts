import { prisma } from "./prisma";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string, category = "general") {
  return prisma.setting.upsert({
    where: { key },
    update: { value, category },
    create: { key, value, category },
  });
}

/**
 * Legacy helpers kept for backwards compatibility with older code paths.
 * New code should call getLLMClient() / getEmbeddingClient() from llm.ts
 * instead of fetching the raw key/model strings.
 */
export async function getOpenAIKey(): Promise<string | null> {
  const fromDb = await getSetting("ai_api_key");
  if (fromDb) return fromDb;
  const legacy = await getSetting("openai_api_key");
  return legacy || process.env.OPENAI_API_KEY || null;
}

export async function getOpenAIModel(): Promise<string> {
  const fromDb = await getSetting("ai_model");
  if (fromDb) return fromDb;
  const legacy = await getSetting("openai_model");
  return legacy || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export async function getAllSettings() {
  return prisma.setting.findMany({ orderBy: { category: "asc" } });
}

/**
 * Branding helpers used by layouts/SEO. Defaults match the seeded values.
 */
export async function getBrandName(): Promise<string> {
  return (await getSetting("brand_name")) || "Dealism";
}

export async function getBrandTagline(): Promise<string> {
  return (await getSetting("brand_tagline")) || "Your Best Sales Rep, Now AI.";
}
