import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { escapeHtml, generateUniqueId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");

  const where: Record<string, unknown> = {};
  if (enrollmentId) where.enrollmentId = enrollmentId;
  // Students only see their own experience letters
  if (session.role === "student") {
    where.enrollment = { studentId: session.id };
  }

  const letters = await prisma.experienceLetter.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { name: true, email: true } },
          batch: { include: { program: { select: { title: true, duration: true } } } },
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
      return NextResponse.json({ error: "Only admin or organization can approve experience letters" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, adminRemarks } = body;

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

    if (!enrollment.teamLeaderCategory) {
      return NextResponse.json({ error: "Team leader must categorize the student first" }, { status: 400 });
    }

    const letterNumber = generateUniqueId("EXP");
    const org = enrollment.batch.program.organization;

    const safeOrgName = escapeHtml(org.name);
    const safeStudentName = escapeHtml(enrollment.student.name);
    const safeProgramTitle = escapeHtml(enrollment.batch.program.title);
    const safeCategory = escapeHtml(enrollment.teamLeaderCategory);
    const safeRemarks = enrollment.teamLeaderRemarks ? escapeHtml(enrollment.teamLeaderRemarks) : "";

    const htmlContent = `<div style="font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto;">
<div style="text-align: center; margin-bottom: 30px;">
<h1 style="color: #1e1b4b;">${safeOrgName}</h1>
<h2>EXPERIENCE / COMPLETION LETTER</h2>
<p>Ref: ${letterNumber} | Date: ${new Date().toLocaleDateString("en-IN")}</p>
</div>
<p>To Whom It May Concern,</p>
<p>This is to certify that <strong>${safeStudentName}</strong> has successfully completed the 
<strong>${safeProgramTitle}</strong> internship program at ${safeOrgName}.</p>
<h3>Details:</h3>
<ul>
<li><strong>Program:</strong> ${safeProgramTitle}</li>
<li><strong>Duration:</strong> ${enrollment.batch.program.duration} days</li>
<li><strong>Period:</strong> ${enrollment.batch.startDate ? enrollment.batch.startDate.toLocaleDateString("en-IN") : "N/A"} to ${new Date().toLocaleDateString("en-IN")}</li>
<li><strong>Performance Category:</strong> ${safeCategory}</li>
${safeRemarks ? `<li><strong>Remarks:</strong> ${safeRemarks}</li>` : ""}
</ul>
<p>We wish ${safeStudentName} all the best in their future endeavors.</p>
<br/>
<p>Authorized Signatory<br/><strong>${safeOrgName}</strong></p>
</div>`;

    // Enrollment update + letter creation in a single transaction
    const letter = await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "completed",
          adminApproved: true,
          adminRemarks: adminRemarks || null,
          completedAt: new Date(),
        },
      });

      return tx.experienceLetter.create({
        data: {
          enrollmentId,
          letterNumber,
          category: enrollment.teamLeaderCategory!,
          htmlContent,
        },
      });
    });

    return NextResponse.json(letter, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate experience letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
