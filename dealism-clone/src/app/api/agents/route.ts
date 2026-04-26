import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  systemPrompt: z.string().min(10),
  tone: z.string().optional(),
  language: z.string().optional(),
});

export async function GET() {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const agents = await prisma.agent.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ agents });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, workspace } = await apiRequireUserWithWorkspace();
    const body = await req.json();
    const data = schema.parse(body);
    const agent = await prisma.agent.create({
      data: { ...data, userId: user.id, workspaceId: workspace.id },
    });
    return NextResponse.json({ agent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
