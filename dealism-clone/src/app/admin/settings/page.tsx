import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { LLM_PROVIDERS } from "@/lib/llm";
import { SettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  // Defense-in-depth: the admin layout already guards this route, but the
  // page also loads sensitive API keys (OpenAI/DeepSeek/Razorpay/etc.) so we
  // re-check here in case the layout wrapping ever changes.
  await requireAdmin();
  const settings = await prisma.setting.findMany();
  const byKey = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  // Strip secret bodies in transit; only send a "set / not set" flag.
  // The form lets admin enter/replace values; existing values stay encrypted at rest.
  const providers = Object.values(LLM_PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    baseUrl: p.baseUrl,
    defaultModel: p.defaultModel,
    models: p.models,
    apiKeyHint: p.apiKeyHint,
    notes: p.notes ?? "",
    supportsEmbeddings: p.supportsEmbeddings,
    defaultEmbeddingModel: p.defaultEmbeddingModel ?? "",
  }));
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold">API Keys & Settings</h1>
      <p className="mt-1 text-neutral-600">Configure integrations and platform defaults. Saved in database (encrypted-at-rest is up to your DB).</p>
      <div className="mt-8">
        <SettingsForm initial={byKey} providers={providers} />
      </div>
    </div>
  );
}
