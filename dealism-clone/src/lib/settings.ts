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

export async function getOpenAIKey(): Promise<string | null> {
  const fromDb = await getSetting("openai_api_key");
  return fromDb || process.env.OPENAI_API_KEY || null;
}

export async function getOpenAIModel(): Promise<string> {
  const fromDb = await getSetting("openai_model");
  return fromDb || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export async function getAllSettings() {
  return prisma.setting.findMany({ orderBy: { category: "asc" } });
}
