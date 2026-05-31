import { NextRequest, NextResponse } from "next/server";
import { getTTSRequest, deleteTTSRequest } from "@/lib/tts-cache";
import { getOpenAIClient } from "@/lib/openai-client";
import { elevenLabsTTS } from "@/lib/elevenlabs-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = getTTSRequest(params.id);
    if (!data) {
      return new NextResponse("Not found", { status: 404 });
    }

    let audioBuffer: Buffer;

    if (data.provider === "elevenlabs" && data.voiceId) {
      audioBuffer = await elevenLabsTTS(data.text, data.voiceId);
    } else {
      const client = getOpenAIClient();
      const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
      const voice = validVoices.includes(data.voice) ? data.voice : "alloy";

      const response = await client.audio.speech.create({
        model: "tts-1",
        voice: voice as "alloy",
        input: data.text,
      });
      audioBuffer = Buffer.from(await response.arrayBuffer());
    }

    deleteTTSRequest(params.id);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new NextResponse("TTS generation failed", { status: 500 });
  }
}
