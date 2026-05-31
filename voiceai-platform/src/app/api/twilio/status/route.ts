import { NextRequest, NextResponse } from "next/server";
import { updateCallBySid, getCallBySid } from "@/lib/db";
import { analyzeSentiment, summarizeCall, clearConversation } from "@/lib/openai-client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;

    const updateData: Record<string, unknown> = {
      status: callStatus,
    };

    if (callDuration) {
      updateData.duration = parseInt(callDuration);
    }

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    if (callStatus === "completed" || callStatus === "failed" || callStatus === "no-answer" || callStatus === "busy") {
      updateData.ended_at = new Date().toISOString();
      clearConversation(callSid);

      // Analyze the call if completed and has transcript
      if (callStatus === "completed") {
        const call = getCallBySid(callSid) as { transcript: string } | undefined;
        if (call?.transcript) {
          try {
            const [sentiment, summary] = await Promise.all([
              analyzeSentiment(call.transcript),
              summarizeCall(call.transcript),
            ]);
            updateData.sentiment = sentiment;
            updateData.summary = summary;
          } catch {
            // Analysis failed, continue without it
          }
        }
      }
    }

    updateCallBySid(callSid, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Status webhook error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
