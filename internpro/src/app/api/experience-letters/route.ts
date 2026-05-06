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
      htmlContent = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 0; background: white; color: #222;">
<!-- Letterhead -->
<table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
  <tr>
    <td style="width: 100px; vertical-align: middle; padding: 18px 0 18px 30px;">
      <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS Media" style="height: 70px; display: block;" />
    </td>
    <td style="text-align: right; vertical-align: middle; padding: 18px 30px 18px 10px;">
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #0000AA; letter-spacing: 0.5px;">KKHS Media Private Limited</p>
      <p style="margin: 4px 0 0; font-size: 10px; color: #666; line-height: 1.6;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
      <p style="margin: 1px 0 0; font-size: 10px; color: #666;">Phone: 9782005500 &nbsp;|&nbsp; Email: hari@kkhsmedia.com &nbsp;|&nbsp; GST: 08AAICK3853C1ZL</p>
    </td>
  </tr>
</table>
<div style="height: 3px; background: linear-gradient(90deg, #0000AA, #0000AA 70%, #d32f2f 70%, #d32f2f);"></div>

<div style="padding: 28px 40px 20px;">
  <table style="width: 100%; margin-bottom: 20px;">
    <tr>
      <td style="font-size: 12px; color: #555;">Ref: <strong style="color: #222;">${letterNumber}</strong></td>
      <td style="text-align: right; font-size: 12px; color: #555;">Date: <strong style="color: #222;">${todayFormatted}</strong></td>
    </tr>
  </table>

  <div style="text-align: center; margin: 10px 0 25px;">
    <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #0000AA; letter-spacing: 3px; text-transform: uppercase;">Experience Certificate</h2>
    <div style="width: 60px; height: 3px; background: #d32f2f; margin: 8px auto 0;"></div>
  </div>

  <p style="font-size: 13px; color: #333; margin: 20px 0 12px;">To Whom It May Concern,</p>

  <p style="font-size: 13px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 15px;">
    This is to certify that <strong style="color: #0000AA;">${safeStudentName}</strong> has successfully completed the 
    <strong>${safeProgramTitle}</strong> internship program at <strong>${safeOrgName}</strong>. The details of the internship are as follows:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px; font-size: 13px; border: 1px solid #ddd;">
    <tr style="background: #0000AA;"><td style="padding: 9px 14px; color: white; font-weight: 600; width: 180px; border: 1px solid #0000AA;">Particulars</td><td style="padding: 9px 14px; color: white; font-weight: 600; border: 1px solid #0000AA;">Details</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Program</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">${safeProgramTitle}</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Duration</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">${enrollment.batch.program.duration} Days</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Period</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">${startDateStr} to ${endDateStr}</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Performance</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;"><strong style="color: #0000AA;">${performanceLabel}</strong> (${safeCategory})</td></tr>
    ${safeRemarks ? `<tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Remarks</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">${safeRemarks}</td></tr>` : ""}
  </table>

  <p style="font-size: 13px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 8px;">
    During the tenure, ${safeStudentName} demonstrated a high level of dedication, professionalism, and competence. We sincerely appreciate the valuable contributions made and wish them continued success in all future endeavors.
  </p>
  <p style="font-size: 13px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 15px;">
    We recommend ${safeStudentName} for any suitable opportunity and are confident they will be an asset to any organization.
  </p>

  <p style="margin: 45px 0 0; font-size: 13px; color: #333;">Warm Regards,</p>
  <div style="margin-top: 30px;">
    <p style="margin: 0; font-weight: 700; color: #0000AA; font-size: 14px;">Authorized Signatory</p>
    <p style="margin: 2px 0 0; font-size: 12px; color: #555;">${safeOrgName}</p>
    <p style="margin: 2px 0 0; font-size: 11px; color: #888;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
  </div>
</div>

<div style="height: 2px; background: linear-gradient(90deg, #0000AA, #0000AA 70%, #d32f2f 70%, #d32f2f); margin-top: 15px;"></div>
<div style="padding: 8px 30px; text-align: center;">
  <p style="margin: 0; font-size: 8pt; font-weight: 600; color: #0000AA;">KKHS Media Private Limited</p>
  <p style="margin: 2px 0 0; font-size: 7pt; color: #777;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012 | Phone: 9782005500 | Email: hari@kkhsmedia.com</p>
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
