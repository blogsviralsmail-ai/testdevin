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
  const dayNumber = searchParams.get("dayNumber");
  const scope = searchParams.get("scope");

  const where: Record<string, unknown> = {};
  if (batchId) where.batchId = batchId;
  if (dayNumber) where.dayNumber = parseInt(dayNumber);
  if (scope) where.scope = scope;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      batch: { select: { name: true, program: { select: { title: true } } } },
      _count: { select: { submissions: true } },
    },
    orderBy: [{ dayNumber: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  // For students, filter tasks based on their working day and individual assignments
  if (session.role === "student") {
    const enrollmentWhere: Record<string, unknown> = { studentId: session.id, status: "selected" };
    if (batchId) enrollmentWhere.batchId = batchId;
    const enrollment = await prisma.enrollment.findFirst({
      where: enrollmentWhere,
    });
    const currentDay = enrollment?.currentWorkDay || 0;

    const filtered = tasks.filter((t) => {
      if (t.scope === "individual" && t.assignedTo !== session.id) return false;
      if (t.dayNumber && t.dayNumber > currentDay) return false;
      return true;
    });
    return NextResponse.json(filtered);
  }

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, title, description, type, dayNumber, dueDate, maxPoints, resources, order, scope, assignedTo, isUrgent } = body;

    if (!batchId || !title) {
      return NextResponse.json({ error: "Batch and title are required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        batchId,
        title,
        description: description || null,
        type: type || "regular",
        dayNumber: dayNumber ? parseInt(dayNumber) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxPoints: parseInt(maxPoints || "100"),
        resources: resources || null,
        order: parseInt(order || "0"),
        scope: scope || "all",
        assignedTo: assignedTo || null,
        isUrgent: isUrgent || false,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
