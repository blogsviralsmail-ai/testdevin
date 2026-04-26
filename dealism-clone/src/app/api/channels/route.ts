import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { user, workspace } = await apiRequireUserWithWorkspace();
    const body = await req.json();
    if (body.agentId) {
      // Validate the agent belongs to the active workspace (any teammate
      // can attach a channel to any workspace agent).
      const agent = await prisma.agent.findUnique({ where: { id: body.agentId } });
      if (!agent || agent.workspaceId !== workspace.id) {
        return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
      }
    }
    const channel = await prisma.channel.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        name: body.name || "WhatsApp",
        type: body.type || "whatsapp",
        agentId: body.agentId || null,
      },
    });
    return NextResponse.json({ channel });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const channels = await prisma.channel.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ channels });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
