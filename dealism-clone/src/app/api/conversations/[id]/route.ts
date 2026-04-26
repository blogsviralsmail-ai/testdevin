import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Conversation.status is a free-form String in Prisma but the app only
// understands these three values. Validate at the boundary so the DB
// can never hold an unexpected state that the UI / handlers don't
// anticipate.
const patchSchema = z.object({
  isAutoReply: z.boolean().optional(),
  status: z.enum(["active", "closed", "needs_human"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
    if (!convo || convo.workspaceId !== workspace.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json();
    const parsed = patchSchema.parse(body);
    if (Object.keys(parsed).length === 0) {
      return NextResponse.json({ conversation: convo });
    }
    const updated = await prisma.conversation.update({
      where: { id: params.id },
      data: parsed,
    });
    return NextResponse.json({ conversation: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
