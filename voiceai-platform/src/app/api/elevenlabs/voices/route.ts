import { NextResponse } from "next/server";
import { listElevenLabsVoices } from "@/lib/elevenlabs-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const voices = await listElevenLabsVoices();
    return NextResponse.json({
      voices: voices.map((v) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category,
        labels: v.labels,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
