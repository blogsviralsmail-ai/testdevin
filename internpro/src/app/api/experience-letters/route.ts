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

    const performanceMap: Record<string, string> = { excellent: "Outstanding", good: "Very Good", average: "Satisfactory" };
    const performanceLabel = performanceMap[enrollment.teamLeaderCategory || "good"] || "Good";
    const startDateStr = enrollment.batch.startDate ? enrollment.batch.startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";
    const endDateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const todayFormatted = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    // Check for experience letter template (stored in OfferLetterTemplate with type='experience')
    const expTemplate = await prisma.offerLetterTemplate.findFirst({ where: { isDefault: true, type: "experience" } });
    let htmlContent: string;

    if (expTemplate?.htmlContent) {
      htmlContent = expTemplate.htmlContent
        .replace(/\{\{company_name\}\}/g, safeOrgName)
        .replace(/\{\{student_name\}\}/g, safeStudentName)
        .replace(/\{\{program_name\}\}/g, safeProgramTitle)
        .replace(/\{\{letter_number\}\}/g, letterNumber)
        .replace(/\{\{date\}\}/g, todayFormatted)
        .replace(/\{\{duration\}\}/g, String(enrollment.batch.program.duration))
        .replace(/\{\{start_date\}\}/g, startDateStr)
        .replace(/\{\{end_date\}\}/g, endDateStr)
        .replace(/\{\{category\}\}/g, safeCategory)
        .replace(/\{\{performance\}\}/g, performanceLabel)
        .replace(/\{\{remarks\}\}/g, safeRemarks);
    } else {
      htmlContent = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 0; background: white;">
<!-- Letterhead Header: Logo left, Company info right -->
<table style="width: 100%; border-collapse: collapse; border-bottom: 3px solid #0000AA; padding-bottom: 10px; margin-bottom: 0;">
  <tr>
    <td style="width: 120px; vertical-align: middle; padding: 15px 10px 15px 20px;">
      <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS Media" style="height: 80px;" />
    </td>
    <td style="text-align: right; vertical-align: middle; padding: 15px 20px 15px 10px;">
      <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0000AA;">KKHS Media Private Limited</p>
      <p style="margin: 3px 0 0; font-size: 10px; color: #555;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
      <p style="margin: 2px 0 0; font-size: 10px; color: #555;">Mob: 9782005500 | Email: hari@kkhsmedia.com</p>
      <p style="margin: 2px 0 0; font-size: 10px; color: #555;">GST: 08AAICK3853C1ZL</p>
    </td>
  </tr>
</table>

<!-- Body -->
<div style="padding: 30px 40px 20px;">
  <div style="text-align: right; margin-bottom: 15px;">
    <p style="margin: 0; font-size: 12px; color: #555;">Ref: <strong>${letterNumber}</strong></p>
    <p style="margin: 3px 0 0; font-size: 12px; color: #555;">Date: ${todayFormatted}</p>
  </div>

  <h2 style="text-align: center; color: #0000AA; font-size: 22px; margin: 20px 0; letter-spacing: 2px;">EXPERIENCE CERTIFICATE</h2>

  <p style="font-size: 13px; color: #333; margin-top: 20px;">To Whom It May Concern,</p>

  <p style="font-size: 13px; color: #333; line-height: 1.8; text-align: justify;">
    This is to certify that <strong style="color: #0000AA;">${safeStudentName}</strong> has successfully completed the 
    <strong>${safeProgramTitle}</strong> program at <strong>${safeOrgName}</strong>.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
    <tr style="background: #f5f7ff;">
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; width: 170px; color: #0000AA;">Program</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${safeProgramTitle}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Duration</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${enrollment.batch.program.duration} Days</td>
    </tr>
    <tr style="background: #f5f7ff;">
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Period</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${startDateStr} to ${endDateStr}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Performance</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;"><strong style="color: #0000AA;">${performanceLabel}</strong> (${safeCategory})</td>
    </tr>
    ${safeRemarks ? `<tr style="background: #f5f7ff;">
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Remarks</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${safeRemarks}</td>
    </tr>` : ""}
  </table>

  <p style="font-size: 13px; color: #333; line-height: 1.8; text-align: justify;">
    During the tenure, ${safeStudentName} demonstrated a high level of dedication, professionalism, and competence. 
    We appreciate the contributions made and wish them all the very best in their future endeavors.
  </p>

  <div style="margin-top: 50px;">
    <p style="margin: 0; font-size: 13px; color: #333;">Warm Regards,</p>
    <div style="margin-top: 35px;">
      <p style="margin: 0; font-weight: bold; color: #0000AA; font-size: 14px;">Authorized Signatory</p>
      <p style="margin: 3px 0 0; font-size: 12px; color: #555;">${safeOrgName}</p>
    </div>
  </div>
</div>

<!-- Footer matching docx -->
<div style="border-top: 2px solid #0000AA; padding: 8px 20px; text-align: center; margin-top: 20px;">
  <p style="margin: 0; font-size: 8pt; font-weight: bold; color: #0000AA;">KKHS Media Private Limited</p>
  <p style="margin: 2px 0 0; font-size: 7pt; color: #555;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012 | Mob: 9782005500 | Email: hari@kkhsmedia.com</p>
</div>
</div>`;
    }

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
