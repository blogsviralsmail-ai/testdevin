import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiRequireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

const switchSchema = z.object({
  workspaceId: z.string().min(1),
});

export async function GET() {
  try {
    const user = await apiRequireUser();
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activeWorkspaceId: true },
    });
    return NextResponse.json({
      activeWorkspaceId: me?.activeWorkspaceId ?? null,
      workspaces: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
        ownerId: m.workspace.ownerId,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const body = await req.json();
    const { name } = createSchema.parse(body);
    const ws = await prisma.workspace.create({
      data: {
        name,
        ownerId: user.id,
        memberships: { create: { userId: user.id, role: "owner" } },
      },
    });
    return NextResponse.json({ workspace: ws });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}

/** Switch the user's active workspace. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await apiRequireUser();
    const body = await req.json();
    const { workspaceId } = switchSchema.parse(body);
    const m = await prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });
    if (!m) return NextResponse.json({ error: "Not a member" }, { status: 403 });
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: workspaceId },
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
