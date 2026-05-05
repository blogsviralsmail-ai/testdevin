import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");

  const where: Record<string, unknown> = {};
  if (batchId) where.batchId = batchId;

  const resources = await prisma.resource.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(resources);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "mentor"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, title, type, url, order } = body;

    if (!batchId || !title || !url) {
      return NextResponse.json({ error: "Batch, title, and URL are required" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        batchId,
        title,
        type: type || "video",
        url,
        order: parseInt(order || "0"),
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
