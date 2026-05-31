import { NextRequest, NextResponse } from "next/server";
import { createPhoneNumber, listPhoneNumbers, updatePhoneNumber } from "@/lib/db";
import { buyPhoneNumber, listTwilioNumbers } from "@/lib/twilio-client";

export async function GET() {
  try {
    const numbers = listPhoneNumbers();
    return NextResponse.json(numbers);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, area_code, country, agent_id } = body;

    if (action === "buy") {
      const purchased = await buyPhoneNumber(area_code, country || "US");
      const number = createPhoneNumber({
        number: purchased.phoneNumber,
        friendly_name: purchased.friendlyName,
        twilio_sid: purchased.sid,
        agent_id: agent_id || undefined,
        country: country || "US",
      });
      return NextResponse.json(number, { status: 201 });
    }

    if (action === "sync") {
      const twilioNumbers = await listTwilioNumbers();
      const synced = [];
      for (const tn of twilioNumbers) {
        try {
          const num = createPhoneNumber({
            number: tn.phoneNumber,
            friendly_name: tn.friendlyName,
            twilio_sid: tn.sid,
            country: "US",
          });
          synced.push(num);
        } catch {
          // Number already exists, skip
        }
      }
      return NextResponse.json({ synced: synced.length, numbers: listPhoneNumbers() });
    }

    return NextResponse.json({ error: "Invalid action. Use 'buy' or 'sync'" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, agent_id, friendly_name, status } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    updatePhoneNumber(id, { agent_id, friendly_name, status });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
