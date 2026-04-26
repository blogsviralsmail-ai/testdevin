import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwn(workspaceId: string, agentId: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new Error("Not found");
  if (agent.workspaceId !== workspaceId) throw new Error("Forbidden");
  return agent;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const agent = await assertOwn(workspace.id, params.id);
    return NextResponse.json({ agent });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    await assertOwn(workspace.id, params.id);
    const body = await req.json();
    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        systemPrompt: body.systemPrompt,
        tone: body.tone,
        language: body.language,
        isActive: body.isActive,
        temperature: body.temperature,
      },
    });
    return NextResponse.json({ agent });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    await assertOwn(workspace.id, params.id);
    await prisma.agent.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
