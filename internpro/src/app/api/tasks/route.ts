import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");

  const where: Record<string, unknown> = {};
  if (batchId) where.batchId = batchId;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      batch: { select: { name: true, program: { select: { title: true } } } },
      _count: { select: { submissions: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "mentor"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, title, description, type, dueDate, points, resources, order } = body;

    if (!batchId || !title) {
      return NextResponse.json({ error: "Batch and title are required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        batchId,
        title,
        description: description || null,
        type: type || "regular",
        dueDate: dueDate ? new Date(dueDate) : null,
        points: parseInt(points || "10"),
        resources: resources || null,
        order: parseInt(order || "0"),
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
