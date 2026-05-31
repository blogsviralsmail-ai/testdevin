import { NextRequest, NextResponse } from "next/server";
import { createAgent, listAgents, getAgent, updateAgent, deleteAgent } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const agent = getAgent(id);
      if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      return NextResponse.json(agent);
    }
    const agents = listAgents();
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const agent = createAgent({
      name: body.name,
      system_prompt: body.system_prompt || "",
      greeting_message: body.greeting_message,
      voice: body.voice,
      language: body.language,
      model: body.model,
      max_call_duration: body.max_call_duration,
      temperature: body.temperature,
      use_case: body.use_case,
    });
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const agent = updateAgent(id, data);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    return NextResponse.json(agent);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    deleteAgent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
