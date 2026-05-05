import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = {};
  if (taskId) where.taskId = taskId;
  if (studentId) where.studentId = studentId;

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
      task: { select: { title: true, points: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, content, fileUrl } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const submission = await prisma.submission.upsert({
      where: {
        taskId_studentId: { taskId, studentId: session.id },
      },
      update: {
        content: content || null,
        fileUrl: fileUrl || null,
        status: "submitted",
      },
      create: {
        taskId,
        studentId: session.id,
        content: content || null,
        fileUrl: fileUrl || null,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
