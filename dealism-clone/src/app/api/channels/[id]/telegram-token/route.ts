import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setTelegramBotToken } from "@/lib/telegram";

/**
 * Save the Telegram bot token for a channel. We validate the token by
 * calling getMe before persisting, so admins find typos immediately.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const ch = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!ch || ch.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (ch.type !== "telegram") {
      return NextResponse.json({ error: "Not a telegram channel" }, { status: 400 });
    }
    const { token } = (await req.json()) as { token?: string };
    if (!token || typeof token !== "string" || !token.includes(":")) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }
    await setTelegramBotToken(params.id, token);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
