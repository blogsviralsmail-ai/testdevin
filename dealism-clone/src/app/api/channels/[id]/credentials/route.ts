import { NextRequest, NextResponse } from "next/server";
import { apiRequireUserWithWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setMessengerCredentials } from "@/lib/messenger";
import { setLineCredentials } from "@/lib/line";
import { setViberCredentials } from "@/lib/viber";
import { setDiscordBotToken } from "@/lib/discord";

/**
 * Generic endpoint for saving credentials on a non-WhatsApp channel.
 * The body shape varies by channel.type; each branch validates +
 * persists via the appropriate lib helper. Telegram has its own route
 * for backwards-compat; we keep this one for messenger/line/viber.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { workspace } = await apiRequireUserWithWorkspace();
    const ch = await prisma.channel.findUnique({ where: { id: params.id } });
    if (!ch || ch.workspaceId !== workspace.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const body = (await req.json()) as Record<string, string | undefined>;

    if (ch.type === "messenger") {
      if (!body.pageAccessToken || !body.verifyToken) {
        return NextResponse.json({ error: "pageAccessToken + verifyToken required" }, { status: 400 });
      }
      await setMessengerCredentials(params.id, {
        pageAccessToken: body.pageAccessToken,
        verifyToken: body.verifyToken,
      });
      return NextResponse.json({ ok: true });
    }

    if (ch.type === "line") {
      if (!body.channelAccessToken || !body.channelSecret) {
        return NextResponse.json({ error: "channelAccessToken + channelSecret required" }, { status: 400 });
      }
      await setLineCredentials(params.id, {
        channelAccessToken: body.channelAccessToken,
        channelSecret: body.channelSecret,
      });
      return NextResponse.json({ ok: true });
    }

    if (ch.type === "viber") {
      if (!body.authToken) {
        return NextResponse.json({ error: "authToken required" }, { status: 400 });
      }
      await setViberCredentials(params.id, { authToken: body.authToken });
      return NextResponse.json({ ok: true });
    }

    if (ch.type === "discord") {
      if (!body.token) {
        return NextResponse.json({ error: "token required" }, { status: 400 });
      }
      await setDiscordBotToken(params.id, body.token);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: `Unsupported type: ${ch.type}` }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    );
  }
}
