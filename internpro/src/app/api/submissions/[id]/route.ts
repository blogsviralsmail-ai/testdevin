import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "mentor"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        grade: body.grade || undefined,
        feedback: body.feedback || undefined,
        status: body.status || undefined,
      },
    });

    return NextResponse.json(submission);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update submission";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
