import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getAgent, updateCallBySid, listKnowledgeDocs } from "@/lib/db";
import { getSetting } from "@/lib/db";
import { chat } from "@/lib/openai-client";
import { storeTTSRequest } from "@/lib/tts-cache";

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

    const agentVoice = agent?.voice || "alloy";
    const language = agent?.language || "en-US";
    const isElevenLabs = agentVoice.startsWith("el:");
    const isEnglish = language.startsWith("en-") || language === "en";
    const useCustomTTS = isElevenLabs || !isEnglish;
    const sttLanguage = language === "auto" ? "en-IN" : (language.includes("-") ? language : "en-US");

    // Helper to speak text using the right TTS method
    const speakInGather = (gatherNode: ReturnType<typeof response.gather>, text: string) => {
      if (useCustomTTS) {
        const voiceId = isElevenLabs ? agentVoice.replace("el:", "") : undefined;
        const provider = isElevenLabs ? "elevenlabs" : "openai";
        const ttsVoice = isElevenLabs ? "alloy" : agentVoice;
        const ttsId = storeTTSRequest(text, ttsVoice, provider, voiceId);
        gatherNode.play(`${baseUrl}/api/tts/${ttsId}`);
      } else {
        const voiceMap: Record<string, string> = {
          alloy: "Polly.Joanna", echo: "Polly.Matthew", fable: "Polly.Amy",
          onyx: "Polly.Brian", nova: "Polly.Salli", shimmer: "Polly.Kimberly",
        };
        gatherNode.say({ voice: (voiceMap[agentVoice] || "Polly.Joanna") as "Polly.Joanna" }, text);
      }
    }

    const speakDirect = (text: string) => {
      if (useCustomTTS) {
        const voiceId = isElevenLabs ? agentVoice.replace("el:", "") : undefined;
        const provider = isElevenLabs ? "elevenlabs" : "openai";
        const ttsVoice = isElevenLabs ? "alloy" : agentVoice;
        const ttsId = storeTTSRequest(text, ttsVoice, provider, voiceId);
        response.play(`${baseUrl}/api/tts/${ttsId}`);
      } else {
        const voiceMap: Record<string, string> = {
          alloy: "Polly.Joanna", echo: "Polly.Matthew", fable: "Polly.Amy",
          onyx: "Polly.Brian", nova: "Polly.Salli", shimmer: "Polly.Kimberly",
        };
        response.say({ voice: (voiceMap[agentVoice] || "Polly.Joanna") as "Polly.Joanna" }, text);
      }
    }

    if (!speechResult) {
      const gather = response.gather({
        input: ["speech"],
        action: `${baseUrl}/api/twilio/gather?agent_id=${agentId}&call_sid=${callSid}`,
        method: "POST",
        speechTimeout: "auto",
        language: sttLanguage as "en-US",
        enhanced: true,
      });
      speakInGather(gather, "I didn't catch that. Could you please repeat?");
      response.hangup();
      return new NextResponse(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Check for goodbye intent (multi-language)
    const lowerSpeech = speechResult.toLowerCase();
    const goodbyeWords = ["goodbye", "bye", "hang up", "end call", "alvida", "dhanyavaad", "shukriya", "namaste"];
    if (goodbyeWords.some(w => lowerSpeech.includes(w))) {
      const goodbyeMsg = !isEnglish && language !== "auto"
        ? "Thank you for calling! Goodbye!"
        : "Thank you for calling! Goodbye!";
      speakDirect(goodbyeMsg);
      response.hangup();

      updateCallBySid(callSid, {
        transcript: `User: ${speechResult}\nAgent: ${goodbyeMsg}`,
        status: "completed",
        ended_at: new Date().toISOString(),
      });

      return new NextResponse(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Build system prompt with knowledge base
    let systemPrompt = agent?.system_prompt || "You are a helpful voice AI assistant. Keep responses concise and conversational, under 2 sentences.";

    // Inject knowledge base content
    const knowledgeDocs = agentId ? listKnowledgeDocs(agentId) as { name: string; content: string }[] : [];
    if (knowledgeDocs.length > 0) {
      const knowledgeContext = knowledgeDocs.map(d => `[${d.name}]:\n${d.content}`).join("\n\n");
      systemPrompt += `\n\nKNOWLEDGE BASE (use this information to answer questions):\n${knowledgeContext}`;
    }

    // Add language instruction
    const langMap: Record<string, string> = {
      "hi-IN": "Hindi", "bn-IN": "Bengali", "ta-IN": "Tamil", "te-IN": "Telugu",
      "mr-IN": "Marathi", "gu-IN": "Gujarati", "kn-IN": "Kannada", "ml-IN": "Malayalam",
      "pa-IN": "Punjabi", "ur-IN": "Urdu", "or-IN": "Odia", "as-IN": "Assamese",
      "es-ES": "Spanish", "fr-FR": "French", "de-DE": "German", "ja-JP": "Japanese",
      "pt-BR": "Portuguese", "ar-SA": "Arabic",
    };
    const langName = langMap[language];
    if (language === "auto") {
      systemPrompt += "\n\nIMPORTANT: Detect the language the caller is speaking and respond in the SAME language. If they speak Hindi, reply in Hindi. If English, reply in English.";
    } else if (langName && !language.startsWith("en")) {
      systemPrompt += `\n\nIMPORTANT: Always respond in ${langName}. The caller expects ${langName} responses.`;
    }

    systemPrompt += "\n\nIMPORTANT: Keep your responses very brief (1-2 sentences max) since this is a phone conversation. Be natural and conversational.";

    // Get AI response
    const aiResponse = await chat(
      callSid,
      speechResult,
      systemPrompt,
      agent?.model || "gpt-4o-mini",
      agent?.temperature ?? 0.7
    );

    // Continue the conversation
    const gather = response.gather({
      input: ["speech"],
      action: `${baseUrl}/api/twilio/gather?agent_id=${agentId}&call_sid=${callSid}`,
      method: "POST",
      speechTimeout: "auto",
      language: sttLanguage as "en-US",
      enhanced: true,
    });
    speakInGather(gather, aiResponse);

    speakDirect("Are you still there?");
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
