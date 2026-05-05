import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (session.role === "student") {
    where.userId = session.id;
  } else if (userId) {
    where.userId = userId;
  }
  if (status) where.status = status;

  const documents = await prisma.document.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, fileUrl } = body;

    if (!type || !title || !fileUrl) {
      return NextResponse.json({ error: "Type, title, and file URL are required" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        userId: session.id,
        type,
        title,
        fileUrl,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, remarks } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Document ID and status are required" }, { status: 400 });
    }

    const document = await prisma.document.update({
      where: { id },
      data: { status, remarks: remarks || null },
    });

    return NextResponse.json(document);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
