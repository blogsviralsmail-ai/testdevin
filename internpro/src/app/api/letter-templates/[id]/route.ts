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
    const { name, htmlContent, isDefault } = body;

    if (isDefault) {
      await prisma.offerLetterTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (htmlContent) data.htmlContent = htmlContent;
    if (isDefault !== undefined) data.isDefault = isDefault;

    const template = await prisma.offerLetterTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json(template);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.offerLetterTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
