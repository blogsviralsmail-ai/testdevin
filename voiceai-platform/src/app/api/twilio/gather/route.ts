import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getAgent, updateCallBySid } from "@/lib/db";
import { getSetting } from "@/lib/db";
import { chat } from "@/lib/openai-client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get("SpeechResult") as string;
    const callSid = request.nextUrl.searchParams.get("call_sid") || (formData.get("CallSid") as string);
    const agentId = request.nextUrl.searchParams.get("agent_id") || "";

    const agent = agentId ? getAgent(agentId) as {
      system_prompt: string;
      model: string;
      temperature: number;
      voice: string;
      language: string;
      greeting_message: string;
    } | undefined : undefined;

    const baseUrl = getSetting("BASE_URL") || "https://calling.kkhsmedia.com";
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    if (!speechResult) {
      response.say("I didn't catch that. Could you please repeat?");
      const gather = response.gather({
        input: ["speech"],
        action: `${baseUrl}/api/twilio/gather?agent_id=${agentId}&call_sid=${callSid}`,
        method: "POST",
        speechTimeout: "auto",
        language: "en-US" as const,
        enhanced: true,
      });
      gather.say("I'm listening.");
      response.hangup();
      return new NextResponse(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Check for goodbye intent
    const lowerSpeech = speechResult.toLowerCase();
    if (lowerSpeech.includes("goodbye") || lowerSpeech.includes("bye") || lowerSpeech.includes("hang up") || lowerSpeech.includes("end call")) {
      response.say("Thank you for calling! Goodbye!");
      response.hangup();

      // Update call transcript
      updateCallBySid(callSid, {
        transcript: `User: ${speechResult}\nAgent: Thank you for calling! Goodbye!`,
        status: "completed",
        ended_at: new Date().toISOString(),
      });

      return new NextResponse(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Get AI response
    const systemPrompt = agent?.system_prompt || "You are a helpful voice AI assistant. Keep responses concise and conversational, under 2 sentences.";
    const aiResponse = await chat(
      callSid,
      speechResult,
      systemPrompt + "\n\nIMPORTANT: Keep your responses very brief (1-2 sentences max) since this is a phone conversation. Be natural and conversational.",
      agent?.model || "gpt-4o-mini",
      agent?.temperature ?? 0.7
    );

    const voiceMap: Record<string, string> = {
      alloy: "Polly.Joanna",
      echo: "Polly.Matthew",
      fable: "Polly.Amy",
      onyx: "Polly.Brian",
      nova: "Polly.Salli",
      shimmer: "Polly.Kimberly",
    };
    const twilioVoice = voiceMap[agent?.voice || "alloy"] || "Polly.Joanna";

    // Continue the conversation
    const gather = response.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?agent_id=${agentId}&call_sid=${callSid}`,
      method: "POST",
      speechTimeout: "auto",
      language: (agent?.language?.includes("-") ? agent.language : "en-US") as "en-US",
      enhanced: true,
    });
    gather.say({ voice: twilioVoice as "Polly.Joanna" }, aiResponse);

    response.say({ voice: twilioVoice as "Polly.Joanna" }, "Are you still there?");
    response.hangup();

    // Update transcript incrementally
    updateCallBySid(callSid, {
      transcript: `User: ${speechResult}\nAgent: ${aiResponse}`,
    });

    return new NextResponse(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Gather webhook error:", error);
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();
    response.say("Sorry, I encountered an error. Please try again.");
    response.hangup();
    return new NextResponse(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
