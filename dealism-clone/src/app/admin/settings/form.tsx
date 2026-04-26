"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProviderInfo {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  apiKeyHint: string;
  notes: string;
  supportsEmbeddings: boolean;
  defaultEmbeddingModel: string;
}

export function SettingsForm({
  initial,
  providers,
}: {
  initial: Record<string, string>;
  providers: ProviderInfo[];
}) {
  // -------- AI / LLM ---------
  // Helper: a saved secret is never echoed back to us; the page only sets a
  // <key>__set flag. We use it to show "(saved)" placeholders so admins know
  // they don't have to re-enter the key.
  const isSet = (key: string) => initial[`${key}__set`] === "1";
  const savedHint = (real: string) => isSet(real) ? "•••••• (saved — leave blank to keep)" : "";

  const [aiProvider, setAiProvider] = useState(initial.ai_provider || "openai");
  const [aiKey, setAiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState(initial.ai_base_url || "");
  const [aiModel, setAiModel] = useState(initial.ai_model || initial.openai_model || "");

  // -------- Embeddings ---------
  const [embKey, setEmbKey] = useState("");
  const [embBaseUrl, setEmbBaseUrl] = useState(initial.embedding_base_url || "");
  const [embModel, setEmbModel] = useState(initial.embedding_model || "");

  // -------- Razorpay ---------
  const [razorpayKey, setRazorpayKey] = useState(initial.razorpay_key_id ?? "");
  const [razorpaySecret, setRazorpaySecret] = useState("");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState("");

  // -------- Telegram ---------
  const [telegramDefaultBotToken, setTelegramDefaultBotToken] = useState("");

  // -------- Email (Resend) ---------
  const [resendKey, setResendKey] = useState("");
  const [emailFrom, setEmailFrom] = useState(initial.email_from ?? "");

  // -------- Backups (S3) ---------
  const [s3Endpoint, setS3Endpoint] = useState(initial.backup_s3_endpoint ?? "");
  const [s3Bucket, setS3Bucket] = useState(initial.backup_s3_bucket ?? "");
  const [s3AccessKey, setS3AccessKey] = useState("");
  const [s3Secret, setS3Secret] = useState("");

  // -------- Monitoring (Sentry) ---------
  const [sentryDsn, setSentryDsn] = useState("");

  // -------- Branding ---------
  const [brandName, setBrandName] = useState(initial.brand_name ?? "Dealism");
  const [brandTagline, setBrandTagline] = useState(initial.brand_tagline ?? "Your Best Sales Rep, Now AI.");

  // -------- General ---------
  const [allowSignups, setAllowSignups] = useState(initial.allow_signups !== "false");
  const [defaultQuota, setDefaultQuota] = useState(initial.default_trial_quota ?? "100");

  const [loading, setLoading] = useState(false);

  const provider = useMemo(
    () => providers.find((p) => p.id === aiProvider) || providers[0],
    [aiProvider, providers],
  );

  function applyProviderDefaults(id: string) {
    setAiProvider(id);
    const p = providers.find((x) => x.id === id);
    if (!p) return;
    if (p.id !== "custom") {
      setAiBaseUrl(p.baseUrl);
      if (!aiModel || !p.models.includes(aiModel)) setAiModel(p.defaultModel);
    }
  }

  async function save() {
    setLoading(true);
    const payload = [
      // AI / LLM
      { key: "ai_provider", value: aiProvider, category: "api" },
      { key: "ai_api_key", value: aiKey, category: "api" },
      { key: "ai_base_url", value: aiBaseUrl, category: "api" },
      { key: "ai_model", value: aiModel, category: "api" },
      // Embeddings (separate so admins can use cheap chat + good embeddings)
      { key: "embedding_api_key", value: embKey, category: "api" },
      { key: "embedding_base_url", value: embBaseUrl, category: "api" },
      { key: "embedding_model", value: embModel, category: "api" },
      // Legacy mirror so older code paths reading openai_api_key keep working
      { key: "openai_api_key", value: aiKey, category: "api" },
      { key: "openai_model", value: aiModel, category: "api" },
      // Razorpay
      { key: "razorpay_key_id", value: razorpayKey, category: "api" },
      { key: "razorpay_key_secret", value: razorpaySecret, category: "api" },
      { key: "razorpay_webhook_secret", value: razorpayWebhookSecret, category: "api" },
      // Telegram
      { key: "telegram_default_bot_token", value: telegramDefaultBotToken, category: "api" },
      // Email
      { key: "resend_api_key", value: resendKey, category: "api" },
      { key: "email_from", value: emailFrom, category: "api" },
      // Backups
      { key: "backup_s3_endpoint", value: s3Endpoint, category: "api" },
      { key: "backup_s3_bucket", value: s3Bucket, category: "api" },
      { key: "backup_s3_access_key", value: s3AccessKey, category: "api" },
      { key: "backup_s3_secret_key", value: s3Secret, category: "api" },
      // Monitoring
      { key: "sentry_dsn", value: sentryDsn, category: "api" },
      // Branding
      { key: "brand_name", value: brandName, category: "branding" },
      { key: "brand_tagline", value: brandTagline, category: "branding" },
      // General
      { key: "allow_signups", value: allowSignups ? "true" : "false", category: "general" },
      { key: "default_trial_quota", value: defaultQuota, category: "general" },
    ];
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: payload }),
    });
    setLoading(false);
    if (res.ok) toast.success("Settings saved");
    else toast.error("Failed to save");
  }

  async function testAI() {
    const res = await fetch("/api/admin/settings/test-openai", { method: "POST" });
    const data = await res.json();
    if (res.ok) toast.success(`✓ ${data.provider} / ${data.model} replied: ${data.sample}`);
    else toast.error(data.error || "Test failed");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Provider (LLM)</CardTitle>
          <CardDescription>
            Pick any OpenAI-compatible provider — OpenAI, DeepSeek, xAI Grok, Groq, Mistral, OpenRouter, Together, Fireworks, Gemini, Cerebras, or any custom URL (Ollama / vLLM / LocalAI).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <select
              className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
              value={aiProvider}
              onChange={(e) => applyProviderDefaults(e.target.value)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {provider?.notes && <p className="mt-1 text-xs text-neutral-500">{provider.notes}</p>}
          </div>

          <div>
            <Label>API Key</Label>
            <Input
              type="password"
              placeholder={savedHint("ai_api_key") || provider?.apiKeyHint || "API key"}
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
            />
          </div>

          <div>
            <Label>Base URL {aiProvider === "custom" && <span className="text-red-500">*</span>}</Label>
            <Input
              placeholder={provider?.baseUrl || "https://your-llm.example.com/v1"}
              value={aiBaseUrl}
              onChange={(e) => setAiBaseUrl(e.target.value)}
            />
          </div>

          <div>
            <Label>Default Model</Label>
            {provider?.models.length ? (
              <select
                className="flex h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              >
                {provider.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="gpt-4o-mini, deepseek-chat, llama-3.1-8b-instant, etc."
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
              />
            )}
          </div>

          <Button variant="outline" onClick={testAI}>Test connection</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embeddings (for Knowledge Base)</CardTitle>
          <CardDescription>
            Used for semantic search in your knowledge base. OpenAI&apos;s text-embedding-3-small is the most reliable. Leave blank to use the chat provider above (works for OpenAI, Mistral, Gemini, Together).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Embedding API Key</Label>
            <Input
              type="password"
              placeholder={savedHint("embedding_api_key") || "sk-... (defaults to chat provider key)"}
              value={embKey}
              onChange={(e) => setEmbKey(e.target.value)}
            />
          </div>
          <div>
            <Label>Embedding Base URL</Label>
            <Input
              placeholder="https://api.openai.com/v1 (default)"
              value={embBaseUrl}
              onChange={(e) => setEmbBaseUrl(e.target.value)}
            />
          </div>
          <div>
            <Label>Embedding Model</Label>
            <Input
              placeholder="text-embedding-3-small (default)"
              value={embModel}
              onChange={(e) => setEmbModel(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Razorpay (Payments / Subscriptions)</CardTitle>
          <CardDescription>For subscription billing. Get keys at dashboard.razorpay.com → Account & Settings → API Keys.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Key ID</Label>
            <Input placeholder="rzp_test_..." value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} />
          </div>
          <div>
            <Label>Key Secret</Label>
            <Input
              type="password"
              placeholder={savedHint("razorpay_key_secret")}
              value={razorpaySecret}
              onChange={(e) => setRazorpaySecret(e.target.value)}
            />
          </div>
          <div>
            <Label>Webhook Secret</Label>
            <Input
              type="password"
              placeholder={savedHint("razorpay_webhook_secret") || "(set after creating webhook in Razorpay dashboard)"}
              value={razorpayWebhookSecret}
              onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram</CardTitle>
          <CardDescription>
            Optional default bot token for the platform. Each user can also set their own per-channel token. Create a bot at <a className="text-orange-600 underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Default Bot Token</Label>
            <Input
              type="password"
              placeholder={savedHint("telegram_default_bot_token") || "123456:ABC-DEF1234ghIkl..."}
              value={telegramDefaultBotToken}
              onChange={(e) => setTelegramDefaultBotToken(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email (Resend)</CardTitle>
          <CardDescription>
            For welcome emails, quota warnings, password resets. Free tier: 3000 emails/month at <a className="text-orange-600 underline" href="https://resend.com" target="_blank" rel="noreferrer">resend.com</a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Resend API Key</Label>
            <Input
              type="password"
              placeholder={savedHint("resend_api_key") || "re_..."}
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
            />
          </div>
          <div>
            <Label>From Address</Label>
            <Input
              placeholder="Dealism <noreply@yourdomain.com>"
              value={emailFrom}
              onChange={(e) => setEmailFrom(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backups (S3-compatible)</CardTitle>
          <CardDescription>
            Daily DB + auth-state backups. Works with AWS S3, Wasabi, Backblaze B2, R2, MinIO. Leave blank to disable cloud backups (local backups still run).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Endpoint URL</Label>
            <Input
              placeholder="https://s3.wasabisys.com (or your own)"
              value={s3Endpoint}
              onChange={(e) => setS3Endpoint(e.target.value)}
            />
          </div>
          <div>
            <Label>Bucket</Label>
            <Input placeholder="dealism-backups" value={s3Bucket} onChange={(e) => setS3Bucket(e.target.value)} />
          </div>
          <div>
            <Label>Access Key</Label>
            <Input
              type="password"
              placeholder={savedHint("backup_s3_access_key")}
              value={s3AccessKey}
              onChange={(e) => setS3AccessKey(e.target.value)}
            />
          </div>
          <div>
            <Label>Secret Key</Label>
            <Input
              type="password"
              placeholder={savedHint("backup_s3_secret_key")}
              value={s3Secret}
              onChange={(e) => setS3Secret(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monitoring (Sentry)</CardTitle>
          <CardDescription>Error + performance monitoring. Free tier sufficient for most usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sentry DSN</Label>
            <Input
              type="password"
              placeholder={savedHint("sentry_dsn") || "https://xxx@xxx.ingest.sentry.io/xxx"}
              value={sentryDsn}
              onChange={(e) => setSentryDsn(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Customize how the platform is presented to users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Brand Name</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allowSignups} onChange={(e) => setAllowSignups(e.target.checked)} />
            <span className="text-sm">Allow public sign-ups</span>
          </label>
          <div>
            <Label>Default trial conversations quota</Label>
            <Input type="number" value={defaultQuota} onChange={(e) => setDefaultQuota(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button variant="primary" size="lg" onClick={save} disabled={loading}>
        {loading ? "Saving..." : "Save all settings"}
      </Button>
    </div>
  );
}
