import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { LLM_PROVIDERS } from "@/lib/llm";
import { SettingsForm } from "./form";

export const dynamic = "force-dynamic";

/**
 * Setting keys whose stored value is sensitive (API key, secret, token).
 * These are NEVER serialised to the client. We only send a boolean
 * `<key>__set` flag so the form can render "value already saved" hints.
 * Any new value the admin types is sent back via /api/admin/settings;
 * empty submissions are filtered server-side so they don't blank out
 * existing secrets.
 */
const SECRET_KEYS = new Set<string>([
  "ai_api_key",
  "openai_api_key",
  "embedding_api_key",
  "razorpay_key_secret",
  "razorpay_webhook_secret",
  "telegram_default_bot_token",
  "resend_api_key",
  "backup_s3_secret_key",
  "backup_s3_access_key",
  "sentry_dsn",
]);

export default async function AdminSettingsPage() {
  // Defense-in-depth: the admin layout already guards this route, but the
  // page also loads sensitive API keys (OpenAI/DeepSeek/Razorpay/etc.) so we
  // re-check here in case the layout wrapping ever changes.
  await requireAdmin();
  const settings = await prisma.setting.findMany();
  const byKey: Record<string, string> = {};
  for (const s of settings) {
    if (SECRET_KEYS.has(s.key)) {
      // Mark the secret as set without leaking its value to the browser.
      byKey[`${s.key}__set`] = s.value ? "1" : "";
      byKey[s.key] = "";
    } else {
      byKey[s.key] = s.value;
    }
  }
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
      <p className="mt-1 text-neutral-600">
        Configure integrations and platform defaults. Saved secrets are never re-sent to the
        browser — leave a field blank to keep the current value.
      </p>
      <div className="mt-8">
        <SettingsForm initial={byKey} providers={providers} />
      </div>
    </div>
  );
}
