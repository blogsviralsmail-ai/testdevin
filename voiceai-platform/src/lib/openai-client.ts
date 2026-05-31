import OpenAI from "openai";
import { getSetting } from "./db";

export function getOpenAIClient() {
  const apiKey = getSetting("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Go to Settings > API Keys to add it.");
  }
  return new OpenAI({ apiKey });
}

interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const conversationHistory = new Map<string, ConversationMessage[]>();

export async function chat(
  callSid: string,
  userMessage: string,
  systemPrompt: string,
  model = "gpt-4o-mini",
  temperature = 0.7
): Promise<string> {
  const client = getOpenAIClient();

  if (!conversationHistory.has(callSid)) {
    conversationHistory.set(callSid, [
      { role: "system", content: systemPrompt },
    ]);
  }

  const history = conversationHistory.get(callSid)!;
  history.push({ role: "user", content: userMessage });

  const response = await client.chat.completions.create({
    model,
    messages: history,
    temperature,
    max_tokens: 150,
  });

  const assistantMessage = response.choices[0]?.message?.content || "I'm sorry, I didn't understand that.";
  history.push({ role: "assistant", content: assistantMessage });

  // Keep history manageable
  if (history.length > 20) {
    const system = history[0];
    conversationHistory.set(callSid, [system, ...history.slice(-10)]);
  }

  return assistantMessage;
}

export function clearConversation(callSid: string) {
  conversationHistory.delete(callSid);
}

export async function analyzeSentiment(transcript: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Analyze the sentiment of this call transcript. Reply with exactly one word: positive, negative, or neutral." },
        { role: "user", content: transcript },
      ],
      temperature: 0,
      max_tokens: 10,
    });
    return response.choices[0]?.message?.content?.trim().toLowerCase() || "neutral";
  } catch {
    return "neutral";
  }
}

export async function summarizeCall(transcript: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize this call transcript in 1-2 sentences." },
        { role: "user", content: transcript },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });
    return response.choices[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}
