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
      htmlContent = `<div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 0; border: 2px solid #1a237e;">
<!-- Letterhead -->
<div style="background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); padding: 20px 40px; display: flex; align-items: center; justify-content: space-between;">
  <div style="display: flex; align-items: center; gap: 16px;">
    <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS Media" style="height: 60px; background: white; padding: 4px; border-radius: 6px;" />
    <div>
      <h1 style="margin: 0; color: white; font-size: 22px; letter-spacing: 2px;">KKHS MEDIA PRIVATE LIMITED</h1>
      <p style="margin: 2px 0 0; color: rgba(255,255,255,0.8); font-size: 11px;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
    </div>
  </div>
</div>
<div style="height: 4px; background: linear-gradient(to right, #d32f2f, #1a237e);"></div>

<!-- Body -->
<div style="padding: 40px 50px;">
  <div style="text-align: right; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 13px; color: #555;">Ref: <strong>${letterNumber}</strong></p>
    <p style="margin: 4px 0 0; font-size: 13px; color: #555;">Date: ${todayFormatted}</p>
  </div>

  <h2 style="text-align: center; color: #1a237e; font-size: 24px; margin: 30px 0; letter-spacing: 3px; border-bottom: 2px solid #1a237e; padding-bottom: 10px;">EXPERIENCE CERTIFICATE</h2>

  <p style="font-size: 14px; color: #333; margin-top: 25px;">To Whom It May Concern,</p>

  <p style="font-size: 14px; color: #333; line-height: 1.8; text-align: justify;">
    This is to certify that <strong style="color: #1a237e;">${safeStudentName}</strong> has successfully completed the 
    <strong>${safeProgramTitle}</strong> program at <strong>${safeOrgName}</strong>.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px;">
    <tr style="background: #f5f5f5;">
      <td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; width: 180px; color: #1a237e;">Program</td>
      <td style="padding: 10px 15px; border: 1px solid #ddd; color: #333;">${safeProgramTitle}</td>
    </tr>
    <tr>
      <td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Duration</td>
      <td style="padding: 10px 15px; border: 1px solid #ddd; color: #333;">${enrollment.batch.program.duration} Days</td>
    </tr>
    <tr style="background: #f5f5f5;">
      <td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Period</td>
      <td style="padding: 10px 15px; border: 1px solid #ddd; color: #333;">${startDateStr} to ${endDateStr}</td>
    </tr>
    <tr>
      <td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Performance</td>
      <td style="padding: 10px 15px; border: 1px solid #ddd; color: #333;"><strong style="color: #1a237e;">${performanceLabel}</strong> (${safeCategory})</td>
    </tr>
    ${safeRemarks ? `<tr style="background: #f5f5f5;">
      <td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Remarks</td>
      <td style="padding: 10px 15px; border: 1px solid #ddd; color: #333;">${safeRemarks}</td>
    </tr>` : ""}
  </table>

  <p style="font-size: 14px; color: #333; line-height: 1.8; text-align: justify;">
    During the tenure, ${safeStudentName} demonstrated a high level of dedication, professionalism, and competence. 
    We appreciate the contributions made and wish them all the very best in their future endeavors.
  </p>

  <div style="margin-top: 60px;">
    <p style="margin: 0; font-size: 14px; color: #333;">Warm Regards,</p>
    <div style="margin-top: 40px;">
      <p style="margin: 0; font-weight: bold; color: #1a237e; font-size: 15px;">Authorized Signatory</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #555;">${safeOrgName}</p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #888;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
    </div>
  </div>
</div>

<!-- Footer -->
<div style="height: 4px; background: linear-gradient(to right, #1a237e, #d32f2f);"></div>
<div style="background: #1a237e; padding: 12px 40px; text-align: center;">
  <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 11px;">Phone: 9782005500 | Email: hari@kkhsmedia.com | GST: 08AAICK3853C1ZL</p>
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
