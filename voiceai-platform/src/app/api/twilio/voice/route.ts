import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getPhoneNumberByNumber, getAgent, createCall } from "@/lib/db";
import { getSetting } from "@/lib/db";

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
    const voiceMap: Record<string, string> = {
      alloy: "Polly.Joanna",
      echo: "Polly.Matthew",
      fable: "Polly.Amy",
      onyx: "Polly.Brian",
      nova: "Polly.Salli",
      shimmer: "Polly.Kimberly",
    };
    const twilioVoice = voiceMap[agent?.voice || "alloy"] || "Polly.Joanna";
    const language = agent?.language || "en-US";

    const gather = response.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?agent_id=${agentId}&call_sid=${callSid}`,
      method: "POST",
      speechTimeout: "auto",
      language: (language.includes("-") ? language : `${language}-US`) as "en-US",
      enhanced: true,
    });
    gather.say({ voice: twilioVoice as "Polly.Joanna" }, greetingMessage);

    response.say({ voice: twilioVoice as "Polly.Joanna" }, "I didn't catch that. Goodbye!");
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
