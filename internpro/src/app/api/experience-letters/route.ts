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
    const allSettings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    allSettings.forEach((s) => { sMap[s.key] = s.value; });
    const signatureUrl = sMap.admin_signature || "";
    const signatoryName = escapeHtml(sMap.signatory_name || "HR Department");
    const signatoryDesignation = escapeHtml(sMap.signatory_designation || "Authorized Signatory");

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
      const sigBlock = signatureUrl
        ? `<img src="${signatureUrl}" alt="Signature" style="height: 40px; display: block; margin-bottom: 2px; object-fit: contain;" />`
        : `<div style="height: 40px; margin-bottom: 2px;"></div>`;

      const lhLogo = sMap.letterhead_logo || "/uploads/kkhs-logo-new.jpg";
      const lhCompany = sMap.letterhead_company_name || org.name || "KKHS Media Private Limited";
      const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
      const lhPhone = sMap.letterhead_phone || "9782005500";
      const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
      const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";

      const LH = `<table style="width:100%;border-collapse:collapse;margin:0;padding:0;"><tr><td style="width:60px;vertical-align:middle;padding:8px 0 8px 20px;"><img src="${lhLogo}" alt="${escapeHtml(lhCompany)}" style="height:50px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:8px 20px 8px 8px;"><p style="margin:0;font-size:16px;font-weight:700;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:2px 0 0;font-size:9px;color:#555;">${escapeHtml(lhAddress)}</p><p style="margin:1px 0 0;font-size:9px;color:#555;">Ph: ${escapeHtml(lhPhone)} | ${escapeHtml(lhEmail)} | GST: ${escapeHtml(lhGst)}</p></td></tr></table><div style="height:2px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;

      const FT = `<div style="height:2px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);margin-top:6px;"></div><div style="padding:4px 20px;text-align:center;"><p style="margin:0;font-size:8px;font-weight:600;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:1px 0 0;font-size:7px;color:#666;">${escapeHtml(lhAddress)} | Ph: ${escapeHtml(lhPhone)} | ${escapeHtml(lhEmail)} | GST: ${escapeHtml(lhGst)}</p></div>`;

      htmlContent = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="width:210mm;min-height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;">
${LH}
<div style="flex:1;padding:8px 24px 4px;">
<table style="width:100%;margin-bottom:4px;"><tr><td style="font-size:9px;color:#555;">Ref: <strong style="color:#222;">${letterNumber}</strong></td><td style="text-align:right;font-size:9px;color:#555;">Date: <strong style="color:#222;">${todayFormatted}</strong></td></tr></table>
<div style="text-align:center;margin:2px 0 6px;"><h2 style="margin:0;font-size:15px;font-weight:700;color:#0000AA;letter-spacing:2px;text-transform:uppercase;">Experience Certificate</h2><div style="width:40px;height:2px;background:#d32f2f;margin:3px auto 0;"></div></div>
<p style="font-size:9.5px;color:#333;margin:5px 0 3px;"><strong>To Whom It May Concern,</strong></p>
<p style="font-size:9px;color:#333;line-height:1.45;text-align:justify;margin:0 0 4px;">This is to certify that <strong style="color:#0000AA;">${safeStudentName}</strong> was associated with <strong>${escapeHtml(lhCompany)}</strong> as an intern under the <strong>${safeProgramTitle}</strong> program. The details are summarized below:</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 5px;font-size:8.5px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:3px 8px;color:white;font-weight:600;width:140px;border:1px solid #0000AA;">Particulars</td><td style="padding:3px 8px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${safeProgramTitle}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${enrollment.batch.program.duration} Days</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Period</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${startDateStr} to ${endDateStr}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Performance</td><td style="padding:2px 8px;border:1px solid #e0e0e0;"><strong style="color:#0000AA;">${performanceLabel}</strong></td></tr>
${safeRemarks ? `<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Remarks</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${safeRemarks}</td></tr>` : ""}
</table>
<p style="font-size:9.5px;font-weight:700;color:#0000AA;margin:4px 0 2px;">Performance Summary</p>
<p style="font-size:8.5px;color:#333;line-height:1.45;text-align:justify;margin:0 0 4px;">During the internship, ${safeStudentName} demonstrated professionalism, technical aptitude, and a proactive approach to learning. The intern consistently met deadlines, exhibited strong problem-solving skills, and collaborated effectively with the team. Work quality was rated as <strong style="color:#0000AA;">${performanceLabel}</strong>.</p>
<p style="font-size:9.5px;font-weight:700;color:#0000AA;margin:4px 0 2px;">Key Strengths Observed</p>
<ul style="font-size:8.5px;color:#333;line-height:1.4;margin:0 0 4px;padding-left:14px;">
<li>Strong understanding of core concepts in the ${safeProgramTitle} domain.</li>
<li>Ability to work independently and in a team environment.</li>
<li>Excellent time management and adherence to deadlines.</li>
<li>Willingness to learn new technologies and adapt to requirements.</li>
<li>Professional conduct and positive workplace attitude.</li>
</ul>
<p style="font-size:9.5px;font-weight:700;color:#0000AA;margin:4px 0 2px;">Recommendation</p>
<p style="font-size:8.5px;color:#333;line-height:1.45;text-align:justify;margin:0 0 6px;">Based on overall performance, we recommend <strong style="color:#0000AA;">${safeStudentName}</strong> for any suitable professional opportunity. We wish ${safeStudentName} all the best in future endeavours.</p>
<p style="margin:8px 0 0;font-size:9px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">${escapeHtml(lhCompany)}</strong>,</p>
<div style="margin-top:4px;">
${sigBlock}
<p style="margin:0;font-weight:700;color:#0000AA;font-size:10px;">${signatoryName}</p>
<p style="margin:1px 0 0;font-size:8.5px;color:#555;">${signatoryDesignation}</p>
<p style="margin:1px 0 0;font-size:8.5px;color:#555;">${escapeHtml(lhCompany)}</p>
</div>
</div>
<div style="flex-shrink:0;">${FT}</div>
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
