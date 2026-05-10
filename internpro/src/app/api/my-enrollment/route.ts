import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateWorkingDay } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: session.id,
      status: { in: ["selected", "active", "completed"] },
    },
    include: {
      batch: {
        include: {
          program: { select: { title: true, totalDays: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!enrollment) {
    return NextResponse.json(null);
  }

  const currentDay = enrollment.joiningDate
    ? calculateWorkingDay(enrollment.joiningDate)
    : enrollment.currentWorkDay || 0;

  return NextResponse.json({
    programTitle: enrollment.batch.program.title,
    batchName: enrollment.batch.name,
    joiningDate: enrollment.joiningDate,
    currentDay,
    totalDays: enrollment.batch.program.totalDays || 45,
    enrollment: {
      id: enrollment.id,
      feeType: enrollment.feeType,
      feeAmount: enrollment.feeAmount,
      paymentStatus: enrollment.paymentStatus,
      batch: enrollment.batch,
    },
  });
}
