import { NextResponse } from "next/server";
import { apiRequireAdmin } from "@/lib/auth";
import { getLLMClient } from "@/lib/llm";

/**
 * Smoke-test the configured chat provider. The route is still called
 * "test-openai" for URL stability but it works with any OpenAI-compatible
 * provider (DeepSeek, Grok, Groq, Mistral, OpenRouter, Gemini, etc.) by
 * issuing a tiny chat completion against the active model.
 */
export async function POST() {
  try {
    await apiRequireAdmin();
    const llm = await getLLMClient();
    if (!llm) {
      return NextResponse.json({ error: "AI provider not configured" }, { status: 400 });
    }
    const { client, config } = llm;

    // models.list isn't supported by all providers (e.g. Gemini). Use a tiny
    // chat completion instead — that's the actual code path our app uses.
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: "Reply with exactly the word: OK" },
        { role: "user", content: "ping" },
      ],
      max_tokens: 5,
    });
    const sample = completion.choices[0]?.message?.content?.trim() || "(no reply)";
    return NextResponse.json({ ok: true, provider: config.provider, model: config.model, sample });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
