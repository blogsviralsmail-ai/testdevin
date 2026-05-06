import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.offerLetterTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, htmlContent, isDefault, type } = body;

    if (!name || !htmlContent) {
      return NextResponse.json({ error: "Name and HTML content are required" }, { status: 400 });
    }

    if (isDefault) {
      await prisma.offerLetterTemplate.updateMany({
        where: { isDefault: true, type: type || "offer" },
        data: { isDefault: false },
      });
    }

    const template = await prisma.offerLetterTemplate.create({
      data: { name, htmlContent, isDefault: isDefault || false, type: type || "offer" },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
