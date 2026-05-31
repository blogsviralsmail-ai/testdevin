import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getPhoneNumberByNumber, getAgent, createCall } from "@/lib/db";
import { getSetting } from "@/lib/db";
import { storeTTSRequest } from "@/lib/tts-cache";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const from = formData.get("From") as string;
    const to = formData.get("To") as string;
    const direction = request.nextUrl.searchParams.get("direction") || "inbound";
    let agentId = request.nextUrl.searchParams.get("agent_id") || "";

    // Find agent for this phone number
    if (!agentId) {
      const phoneNumber = getPhoneNumberByNumber(to) as { agent_id: string } | undefined;
      if (phoneNumber?.agent_id) {
        agentId = phoneNumber.agent_id;
      }
    }

    const agent = agentId ? getAgent(agentId) as {
      id: string;
      greeting_message: string;
      voice: string;
      language: string;
    } | undefined : undefined;

    // Record the call
    createCall({
      agent_id: agentId || undefined,
      twilio_call_sid: callSid,
      direction,
      from_number: from,
      to_number: to,
      status: "in-progress",
    });

    const baseUrl = getSetting("BASE_URL") || "https://calling.kkhsmedia.com";
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    const greetingMessage = agent?.greeting_message || "Hello! How can I help you today?";
    const agentVoice = agent?.voice || "alloy";
    const language = agent?.language || "en-US";

    // Determine if we need OpenAI TTS (non-English or ElevenLabs voice)
    const isElevenLabs = agentVoice.startsWith("el:");
    const isEnglish = language.startsWith("en-") || language === "en";
    const useCustomTTS = isElevenLabs || !isEnglish;

    // For speech recognition, map language codes
    const sttLanguage = language === "auto" ? "en-IN" : (language.includes("-") ? language : `${language}-US`);

    const gather = response.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?agent_id=${agentId}&call_sid=${callSid}`,
      method: "POST",
      speechTimeout: "auto",
      language: sttLanguage as "en-US",
      enhanced: true,
    });

    if (useCustomTTS) {
      // Use OpenAI TTS or ElevenLabs via Play
      const voiceId = isElevenLabs ? agentVoice.replace("el:", "") : undefined;
      const provider = isElevenLabs ? "elevenlabs" : "openai";
      const ttsVoice = isElevenLabs ? "alloy" : agentVoice;
      const ttsId = storeTTSRequest(greetingMessage, ttsVoice, provider, voiceId);
      gather.play(`${baseUrl}/api/tts/${ttsId}`);
    } else {
      // Use Polly for English with OpenAI voices
      const voiceMap: Record<string, string> = {
        alloy: "Polly.Joanna",
        echo: "Polly.Matthew",
        fable: "Polly.Amy",
        onyx: "Polly.Brian",
        nova: "Polly.Salli",
        shimmer: "Polly.Kimberly",
      };
      const twilioVoice = voiceMap[agentVoice] || "Polly.Joanna";
      gather.say({ voice: twilioVoice as "Polly.Joanna" }, greetingMessage);
    }

    // Fallback if no speech detected
    if (useCustomTTS) {
      const fallbackId = storeTTSRequest("I didn't catch that. Goodbye!", isElevenLabs ? "alloy" : agentVoice, isElevenLabs ? "elevenlabs" : "openai", isElevenLabs ? agentVoice.replace("el:", "") : undefined);
      response.play(`${baseUrl}/api/tts/${fallbackId}`);
    } else {
      const voiceMap: Record<string, string> = {
        alloy: "Polly.Joanna", echo: "Polly.Matthew", fable: "Polly.Amy",
        onyx: "Polly.Brian", nova: "Polly.Salli", shimmer: "Polly.Kimberly",
      };
      response.say({ voice: (voiceMap[agentVoice] || "Polly.Joanna") as "Polly.Joanna" }, "I didn't catch that. Goodbye!");
    }
    response.hangup();

    return new NextResponse(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Voice webhook error:", error);
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say("Sorry, there was an error processing your call. Please try again later.");
    response.hangup();
    return new NextResponse(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
