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
    const { percentage, feedback, status } = body;

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        ...(percentage !== undefined && { percentage: parseFloat(percentage) }),
        ...(feedback !== undefined && { feedback }),
        ...(status && { status }),
        reviewedBy: session.id,
      },
    });

    return NextResponse.json(submission);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review submission";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
