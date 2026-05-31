import { NextRequest, NextResponse } from "next/server";
import { createCampaign, listCampaigns, updateCampaign, getAgent, listPhoneNumbers } from "@/lib/db";
import { createCall } from "@/lib/db";
import { makeOutboundCall } from "@/lib/twilio-client";

export async function GET() {
  try {
    const campaigns = listCampaigns();
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, agent_id, phone_numbers } = body;

    if (!name || !agent_id || !phone_numbers?.length) {
      return NextResponse.json(
        { error: "name, agent_id, and phone_numbers array are required" },
        { status: 400 }
      );
    }

    const agent = getAgent(agent_id);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    const campaign = createCampaign({ name, agent_id, phone_numbers });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    if (action === "start") {
      updateCampaign(id, { status: "running", started_at: new Date().toISOString() });

      // Get campaign details
      const campaigns = listCampaigns() as { id: string; phone_numbers: string; agent_id: string }[];
      const campaign = campaigns.find((c) => c.id === id);
      if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

      const numbers = listPhoneNumbers();
      const fromNumber = numbers[0] as { number: string } | undefined;
      if (!fromNumber) return NextResponse.json({ error: "No phone number available for outbound calls" }, { status: 400 });

      const phoneList = JSON.parse(campaign.phone_numbers) as string[];
      const agentId = campaign.agent_id;

      // Start calls asynchronously
      let completed = 0;
      let successful = 0;
      let failed = 0;

      for (const phone of phoneList) {
        try {
          const twilioCall = await makeOutboundCall(phone, fromNumber.number, agentId);
          createCall({
            agent_id: agentId,
            twilio_call_sid: twilioCall.sid,
            direction: "outbound",
            from_number: fromNumber.number,
            to_number: phone,
            status: "initiated",
          });
          successful++;
        } catch {
          failed++;
        }
        completed++;
        updateCampaign(id, { completed_calls: completed, successful_calls: successful, failed_calls: failed });
      }

      updateCampaign(id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_calls: completed,
        successful_calls: successful,
        failed_calls: failed,
      });

      return NextResponse.json({ success: true, completed, successful, failed });
    }

    if (action === "pause") {
      updateCampaign(id, { status: "paused" });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
