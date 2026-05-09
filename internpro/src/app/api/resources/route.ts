import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateWorkingDay } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");

  const where: Record<string, unknown> = {};
  if (batchId) where.batchId = batchId;

  const resources = await prisma.resource.findMany({
    where,
    orderBy: [{ dayNumber: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  // For students, show only their batch resources filtered by current working day
  if (session.role === "student") {
    const enrollmentWhere: Record<string, unknown> = { studentId: session.id, status: { in: ["selected", "completed"] } };
    if (batchId) enrollmentWhere.batchId = batchId;
    const enrollment = await prisma.enrollment.findFirst({
      where: enrollmentWhere,
    });
    if (enrollment) {
      // Re-fetch resources only for the student's batch
      const batchResources = await prisma.resource.findMany({
        where: { batchId: enrollment.batchId },
        orderBy: [{ dayNumber: "asc" }, { order: "asc" }, { createdAt: "desc" }],
      });
      const currentDay = enrollment.joiningDate ? calculateWorkingDay(enrollment.joiningDate) : (enrollment.currentWorkDay || 999);
      const filtered = batchResources.filter((r) => {
        if (r.dayNumber && r.dayNumber > currentDay) return false;
        return true;
      });
      return NextResponse.json(filtered);
    }
    return NextResponse.json([]);
  }

  return NextResponse.json(resources);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, title, type, url, dayNumber, order } = body;

    if (!batchId || !title || !url) {
      return NextResponse.json({ error: "Batch, title, and URL are required" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        batchId,
        title,
        type: type || "video",
        url,
        fileUrl: body.fileUrl || null,
        dayNumber: dayNumber ? parseInt(dayNumber) : null,
        order: parseInt(order || "0"),
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
