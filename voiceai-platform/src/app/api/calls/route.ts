import { NextRequest, NextResponse } from "next/server";
import { createCall, listCalls } from "@/lib/db";
import { makeOutboundCall } from "@/lib/twilio-client";

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const calls = listCalls(limit);
    return NextResponse.json(calls);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to_number, from_number, agent_id } = body;

    if (!to_number || !from_number || !agent_id) {
      return NextResponse.json(
        { error: "to_number, from_number, and agent_id are required" },
        { status: 400 }
      );
    }

    const twilioCall = await makeOutboundCall(to_number, from_number, agent_id);

    const call = createCall({
      agent_id,
      twilio_call_sid: twilioCall.sid,
      direction: "outbound",
      from_number,
      to_number,
      status: "initiated",
    });

    return NextResponse.json(call, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
