import { getSetting } from "./db";

export function getElevenLabsApiKey(): string | null {
  return getSetting("ELEVENLABS_API_KEY");
}

export async function listElevenLabsVoices() {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) throw new Error("ElevenLabs API key not configured. Go to Settings to add it.");

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs API error: ${res.status}`);
  const data = await res.json();
  return data.voices as { voice_id: string; name: string; category: string; labels: Record<string, string> }[];
}

export async function elevenLabsTTS(text: string, voiceId: string): Promise<Buffer> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) throw new Error("ElevenLabs API key not configured");

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) throw new Error(`ElevenLabs TTS error: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
