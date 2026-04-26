/**
 * Multi-provider LLM client.
 *
 * Almost every modern LLM provider exposes an OpenAI-compatible
 * /v1/chat/completions endpoint, so we use the openai SDK with a
 * configurable baseURL. The admin chooses a provider in the UI; the
 * backend stores `ai_provider`, `ai_api_key`, `ai_base_url`, `ai_model`
 * in the Setting table (see settings.ts).
 *
 * Backwards compatibility: if no `ai_provider` is set but legacy
 * `openai_api_key` / `openai_model` settings exist, we use those and
 * treat the provider as "openai".
 */
import OpenAI from "openai";
import { getSetting } from "./settings";

export interface LLMProvider {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  apiKeyHint: string;
  notes?: string;
  /** Whether this provider exposes OpenAI-compatible /v1/embeddings. */
  supportsEmbeddings: boolean;
  /** Default embedding model if supported. */
  defaultEmbeddingModel?: string;
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo", "o1-mini"],
    apiKeyHint: "sk-...",
    supportsEmbeddings: true,
    defaultEmbeddingModel: "text-embedding-3-small",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    apiKeyHint: "sk-...",
    notes: "Very cheap. Get key at platform.deepseek.com.",
    supportsEmbeddings: false,
  },
  grok: {
    id: "grok",
    label: "xAI Grok",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-2-mini",
    models: ["grok-2-mini", "grok-2", "grok-beta"],
    apiKeyHint: "xai-...",
    notes: "Get key at console.x.ai.",
    supportsEmbeddings: false,
  },
  groq: {
    id: "groq",
    label: "Groq (fast Llama)",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    models: [
      "llama-3.1-8b-instant",
      "llama-3.1-70b-versatile",
      "llama-3.3-70b-versatile",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    apiKeyHint: "gsk_...",
    notes: "Free tier available. Very low latency.",
    supportsEmbeddings: false,
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    models: ["mistral-small-latest", "mistral-large-latest", "open-mistral-7b", "open-mixtral-8x7b"],
    apiKeyHint: "(your Mistral API key)",
    supportsEmbeddings: true,
    defaultEmbeddingModel: "mistral-embed",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (any model)",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    models: [
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3-haiku",
      "google/gemini-flash-1.5",
      "meta-llama/llama-3.1-70b-instruct",
      "deepseek/deepseek-chat",
      "x-ai/grok-2",
    ],
    apiKeyHint: "sk-or-v1-...",
    notes: "Single key for all providers (OpenAI, Anthropic, Gemini, Llama, etc.).",
    supportsEmbeddings: false,
  },
  together: {
    id: "together",
    label: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
    models: [
      "meta-llama/Llama-3.1-8B-Instruct-Turbo",
      "meta-llama/Llama-3.1-70B-Instruct-Turbo",
      "Qwen/Qwen2.5-72B-Instruct-Turbo",
    ],
    apiKeyHint: "(your Together API key)",
    supportsEmbeddings: true,
    defaultEmbeddingModel: "togethercomputer/m2-bert-80M-8k-retrieval",
  },
  fireworks: {
    id: "fireworks",
    label: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    defaultModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    models: [
      "accounts/fireworks/models/llama-v3p1-8b-instruct",
      "accounts/fireworks/models/llama-v3p1-70b-instruct",
      "accounts/fireworks/models/mixtral-8x7b-instruct",
    ],
    apiKeyHint: "fw_...",
    supportsEmbeddings: false,
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-1.5-flash",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"],
    apiKeyHint: "(your Google AI Studio API key)",
    notes: "Get key at aistudio.google.com/apikey. Uses Gemini's OpenAI-compatible mode.",
    supportsEmbeddings: true,
    defaultEmbeddingModel: "text-embedding-004",
  },
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama3.1-8b",
    models: ["llama3.1-8b", "llama3.1-70b", "llama-3.3-70b"],
    apiKeyHint: "csk-...",
    supportsEmbeddings: false,
  },
  custom: {
    id: "custom",
    label: "Custom (any OpenAI-compatible URL)",
    baseUrl: "",
    defaultModel: "",
    models: [],
    apiKeyHint: "(your API key)",
    notes: "Set baseURL + model name manually. Works with self-hosted Ollama, vLLM, LocalAI, etc.",
    supportsEmbeddings: true,
  },
};

export interface LLMConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

/** Read the active chat-LLM config (provider/key/baseUrl/model) from DB. */
export async function getLLMConfig(): Promise<LLMConfig | null> {
  const provider = (await getSetting("ai_provider")) || "openai";
  const def = LLM_PROVIDERS[provider] ?? LLM_PROVIDERS.openai;

  // Per-provider key first, then a generic fallback, then legacy openai_api_key.
  const apiKey =
    (await getSetting(`ai_api_key_${provider}`)) ||
    (await getSetting("ai_api_key")) ||
    (await getSetting("openai_api_key")) ||
    process.env.OPENAI_API_KEY ||
    "";
  if (!apiKey) return null;

  const baseUrl = (await getSetting("ai_base_url")) || def.baseUrl;
  const model =
    (await getSetting("ai_model")) ||
    (await getSetting("openai_model")) ||
    def.defaultModel ||
    "gpt-4o-mini";

  if (!baseUrl) return null;
  return { provider, apiKey, baseUrl, model };
}

/** Get an OpenAI-SDK client pointed at the active provider's base URL. */
export async function getLLMClient(): Promise<{ client: OpenAI; config: LLMConfig } | null> {
  const config = await getLLMConfig();
  if (!config) return null;
  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
  return { client, config };
}

/** Embedding config — separate from chat so admins can use cheap chat + good embeddings. */
export interface EmbeddingConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export async function getEmbeddingConfig(): Promise<EmbeddingConfig | null> {
  const apiKey =
    (await getSetting("embedding_api_key")) ||
    (await getSetting("ai_api_key")) ||
    (await getSetting("openai_api_key")) ||
    process.env.OPENAI_API_KEY ||
    "";
  if (!apiKey) return null;

  const baseUrl =
    (await getSetting("embedding_base_url")) ||
    (await getSetting("ai_base_url")) ||
    "https://api.openai.com/v1";
  const model = (await getSetting("embedding_model")) || "text-embedding-3-small";
  return { apiKey, baseUrl, model };
}

export async function getEmbeddingClient(): Promise<{ client: OpenAI; config: EmbeddingConfig } | null> {
  const cfg = await getEmbeddingConfig();
  if (!cfg) return null;
  const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl });
  return { client, config: cfg };
}
