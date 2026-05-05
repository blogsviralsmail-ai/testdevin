import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");

  const where: Record<string, unknown> = {};
  if (enrollmentId) where.enrollmentId = enrollmentId;

  const salaries = await prisma.salary.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { name: true, email: true } },
          batch: { include: { program: { select: { title: true, stipendAmount: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(salaries);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, month } = body;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        batch: { include: { program: true } },
        attendances: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const [year, mon] = month.split("-").map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();
    const presentDays = enrollment.attendances.filter((a) => {
      const aDate = new Date(a.date);
      return aDate.getMonth() + 1 === mon && aDate.getFullYear() === year && (a.status === "present" || a.status === "late");
    }).length;

    const stipendPerDay = enrollment.batch.program.stipendAmount / 30;
    const calculatedAmount = Math.round(stipendPerDay * presentDays);

    const salary = await prisma.salary.upsert({
      where: {
        enrollmentId_month: { enrollmentId, month },
      },
      update: {
        amount: calculatedAmount,
        attendanceDays: presentDays,
        totalDays: daysInMonth,
      },
      create: {
        enrollmentId,
        month,
        amount: calculatedAmount,
        attendanceDays: presentDays,
        totalDays: daysInMonth,
      },
    });

    return NextResponse.json(salary, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate salary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
