import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyApplicationStatusChange } from "@/lib/notifications";

// One-time utility to resend missed notifications
// Protected by secret
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const enrollmentId = searchParams.get("enrollmentId");

  if (secret !== "kkhs-resend-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!enrollmentId) {
    return NextResponse.json({ error: "enrollmentId required" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { select: { name: true, email: true } },
      batch: { include: { program: { select: { title: true } } } },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  await notifyApplicationStatusChange(
    enrollment.student.email,
    enrollment.student.name,
    enrollment.status,
    enrollment.batch.program.title
  );

  return NextResponse.json({
    ok: true,
    sent: {
      student: enrollment.student.name,
      email: enrollment.student.email,
      status: enrollment.status,
      program: enrollment.batch.program.title,
    },
  });
}
