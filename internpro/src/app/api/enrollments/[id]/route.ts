import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, teamLeaderCategory, teamLeaderRemarks, adminRemarks } = body;

    const data: Record<string, unknown> = {};

    if (status) data.status = status;

    // Team leader can categorize
    if (session.role === "teamleader" && teamLeaderCategory) {
      data.teamLeaderCategory = teamLeaderCategory;
      if (teamLeaderRemarks) data.teamLeaderRemarks = teamLeaderRemarks;
    }

    // Admin can add remarks
    if (session.role === "admin" && adminRemarks) {
      data.adminRemarks = adminRemarks;
    }

    if (status === "completed") {
      data.completedAt = new Date();
    }

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data,
    });

    return NextResponse.json(enrollment);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update enrollment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
