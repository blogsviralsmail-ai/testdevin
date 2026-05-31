import { NextRequest, NextResponse } from "next/server";
import { addKnowledgeDoc, listKnowledgeDocs, deleteKnowledgeDoc } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agent_id") || undefined;
    const docs = listKnowledgeDocs(agentId);
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, name, content, type } = body;
    if (!agent_id || !name || !content) {
      return NextResponse.json({ error: "agent_id, name, and content are required" }, { status: 400 });
    }
    const doc = addKnowledgeDoc({ agent_id, name, content, type });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    deleteKnowledgeDoc(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
