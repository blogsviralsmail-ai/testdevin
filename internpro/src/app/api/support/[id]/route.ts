import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { reply, status } = body;

    const data: Record<string, unknown> = {};
    if (reply !== undefined) data.reply = reply;
    if (status) data.status = status;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data,
    });

    return NextResponse.json(ticket);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
