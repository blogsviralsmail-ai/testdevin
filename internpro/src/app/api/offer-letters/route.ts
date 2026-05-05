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

  const letters = await prisma.offerLetter.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { name: true, email: true } },
          batch: { include: { program: { select: { title: true, mode: true, duration: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(letters);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, salary, weekoffs, paidLeaves, workTiming, joiningDate, feeType, feeAmount, stipendAmount } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        batch: { include: { program: { include: { organization: true } } } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Update enrollment with selection details
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "selected",
        salary: salary || 0,
        weekoffs: weekoffs || 1,
        paidLeaves: paidLeaves || 0,
        workTiming: workTiming || "10:00 AM - 6:00 PM",
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        feeType: feeType || "free",
        feeAmount: feeAmount || 0,
        stipendAmount: stipendAmount || 0,
      },
    });

    // Get template
    const template = await prisma.offerLetterTemplate.findFirst({ where: { isDefault: true } });
    const org = enrollment.batch.program.organization;

    const letterNumber = `OL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    let htmlContent = template?.htmlContent || "<h1>Offer Letter</h1>";
    htmlContent = htmlContent
      .replace(/\{\{company_name\}\}/g, org.name)
      .replace(/\{\{student_name\}\}/g, enrollment.student.name)
      .replace(/\{\{program_name\}\}/g, enrollment.batch.program.title)
      .replace(/\{\{letter_number\}\}/g, letterNumber)
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("en-IN"))
      .replace(/\{\{joining_date\}\}/g, joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"))
      .replace(/\{\{duration\}\}/g, String(enrollment.batch.program.duration))
      .replace(/\{\{salary\}\}/g, String(salary || 0))
      .replace(/\{\{weekoffs\}\}/g, String(weekoffs || 1))
      .replace(/\{\{paid_leaves\}\}/g, String(paidLeaves || 0))
      .replace(/\{\{work_timing\}\}/g, workTiming || "10:00 AM - 6:00 PM")
      .replace(/\{\{mode\}\}/g, enrollment.batch.program.mode);

    const offerLetter = await prisma.offerLetter.create({
      data: {
        enrollmentId,
        letterNumber,
        htmlContent,
        templateId: template?.id,
      },
    });

    // Auto-generate employee card
    const cardNumber = `EMP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    await prisma.employeeCard.create({
      data: {
        userId: enrollment.studentId,
        cardNumber,
        designation: `${enrollment.batch.program.title} Intern`,
        department: enrollment.batch.program.domain,
        validFrom: joiningDate ? new Date(joiningDate) : new Date(),
        validUntil: enrollment.batch.endDate,
      },
    });

    return NextResponse.json(offerLetter, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate offer letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
