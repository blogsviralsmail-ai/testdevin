import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { escapeHtml, generateUniqueId } from "@/lib/utils";
import { sendLetterGeneratedEmail } from "@/lib/email";

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

  // Dynamic logo/signature replacement from current settings
  const currentSettings = await prisma.setting.findMany({
    where: { key: { in: ["letterhead_logo", "admin_signature"] } },
  });
  const sMap: Record<string, string> = {};
  currentSettings.forEach((s) => { sMap[s.key] = s.value; });
  const curLogo = sMap.letterhead_logo || "/uploads/kkhs-logo.png";
  const curSig = sMap.admin_signature || "";

  const mapped = letters.map((l) => {
    if (!l.htmlContent) return l;
    let html = l.htmlContent;
    html = html.replace(/<img\s([^>]*)\/?>/g, (match: string, attrs: string) => {
      if (attrs.includes('alt="Signature"')) {
        return curSig ? match.replace(/src="[^"]*"/, `src="${curSig}"`) : match;
      }
      if (attrs.includes('object-fit:contain')) {
        return match.replace(/src="[^"]*"/, `src="${curLogo}"`);
      }
      return match;
    });
    return { ...l, htmlContent: html };
  });

  return NextResponse.json(mapped);
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
    const signatoryName = sMap.signatory_name || "";
    const signatoryDesignation = sMap.signatory_designation || "Authorized Signatory";

    // QR code for verification
    const siteUrl = sMap.site_url || "https://internship.kkhsmedia.com";
    const verifyUrl = `${siteUrl}/verify?number=${letterNumber}`;
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(verifyUrl)}`;

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

      const lhLogo = sMap.letterhead_logo || "/uploads/kkhs-logo.png";
      const lhCompany = sMap.letterhead_company_name || org.name || "KKHS Media Private Limited";
      const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
      const lhPhone = sMap.letterhead_phone || "9782005500";
      const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
      const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";

      const LH = `<table style="width:100%;border-collapse:collapse;margin:0;padding:0;"><tr><td style="width:180px;vertical-align:middle;padding:12px 0 12px 28px;"><img src="${lhLogo}" alt="${escapeHtml(lhCompany)}" style="height:164px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:12px 28px 12px 14px;"><p style="margin:0;font-size:28px;font-weight:700;color:#0000AA;letter-spacing:0.5px;">${escapeHtml(lhCompany)}</p><p style="margin:5px 0 0;font-size:16px;color:#555;line-height:1.4;">${escapeHtml(lhAddress)}</p><p style="margin:4px 0 0;font-size:16px;color:#555;">Ph: ${escapeHtml(lhPhone)} &nbsp;|&nbsp; ${escapeHtml(lhEmail)} &nbsp;|&nbsp; GST: ${escapeHtml(lhGst)}</p></td></tr></table><div style="height:4px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;

      const FT = `<div style="height:3px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);margin-top:auto;"></div><div style="padding:8px 28px;text-align:center;"><p style="margin:0;font-size:14px;font-weight:600;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:3px 0 0;font-size:12px;color:#666;">${escapeHtml(lhAddress)} &nbsp;|&nbsp; Ph: ${escapeHtml(lhPhone)} &nbsp;|&nbsp; ${escapeHtml(lhEmail)} &nbsp;|&nbsp; GST: ${escapeHtml(lhGst)}</p></div>`;

      const extraExpNote = sMap.letter_exp_extra || "";
      const extraExpSection = extraExpNote ? `<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:5px 0 6px;">${escapeHtml(extraExpNote)}</p>` : "";

      htmlContent = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="width:210mm;height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;">
${LH}
<div style="flex:1;min-height:0;overflow:hidden;padding:10px 32px 6px;display:flex;flex-direction:column;justify-content:space-between;">
<table style="width:100%;margin-bottom:8px;"><tr><td style="font-size:13px;color:#555;">Ref: <strong style="color:#222;">${letterNumber}</strong></td><td style="text-align:right;font-size:13px;color:#555;">Date: <strong style="color:#222;">${todayFormatted}</strong></td></tr></table>
<div style="text-align:center;margin:2px 0 6px;"><h2 style="margin:0;font-size:26px;font-weight:700;color:#0000AA;letter-spacing:3px;text-transform:uppercase;">Experience Certificate</h2><div style="width:50px;height:3px;background:#d32f2f;margin:4px auto 0;"></div></div>
<p style="font-size:14px;color:#333;margin:5px 0 3px;"><strong>To Whom It May Concern,</strong></p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">This is to certify that <strong style="color:#0000AA;">${safeStudentName}</strong> was associated with <strong>${escapeHtml(lhCompany)}</strong> as an intern under the <strong>${safeProgramTitle}</strong> program. The details of the engagement are summarized in the table below:</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 8px;font-size:13px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:5px 12px;color:white;font-weight:600;width:160px;border:1px solid #0000AA;">Particulars</td><td style="padding:5px 12px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${safeProgramTitle}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${enrollment.batch.program.duration} Days</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Period</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${startDateStr} to ${endDateStr}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Performance</td><td style="padding:5px 12px;border:1px solid #e0e0e0;"><strong style="color:#0000AA;">${performanceLabel}</strong></td></tr>
${safeRemarks ? `<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Remarks</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${safeRemarks}</td></tr>` : ""}
</table>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">Performance Summary</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">During the internship tenure, ${safeStudentName} demonstrated commendable professionalism, technical aptitude, and a consistently proactive approach towards learning and skill development. The intern met assigned deadlines with diligence, exhibited strong analytical and problem-solving capabilities, and collaborated effectively with team members across various projects. The overall quality of work delivered was rated as <strong style="color:#0000AA;">${performanceLabel}</strong> by the supervising authority.</p>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">Key Strengths Observed</p>
<ul style="font-size:13px;color:#333;line-height:1.45;margin:0;padding-left:20px;">
<li style="margin-bottom:2px;">Strong understanding of core concepts and practical applications related to the ${safeProgramTitle} domain.</li>
<li style="margin-bottom:2px;">Demonstrated ability to work both independently and as an effective team contributor.</li>
<li style="margin-bottom:2px;">Excellent time management skills with consistent adherence to project deadlines and deliverables.</li>
<li style="margin-bottom:2px;">Willingness to learn new technologies, tools, and methodologies as required by the role.</li>
<li>Professional conduct, positive workplace attitude, and strong interpersonal communication skills throughout the engagement.</li>
</ul>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">Recommendation</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">Based on the overall performance, dedication, and professional conduct demonstrated during the internship period, we are pleased to recommend <strong style="color:#0000AA;">${safeStudentName}</strong> for any suitable professional opportunity. We are confident that the skills and experience gained during this tenure will serve as a strong foundation for future career growth. We wish ${safeStudentName} all the very best in all future endeavours.</p>
${extraExpSection}
<table style="width:100%;margin-top:10px;"><tr><td style="vertical-align:top;">
<p style="margin:0;font-size:14px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">${escapeHtml(lhCompany)}</strong>,</p>
<div style="margin-top:6px;">
${sigBlock}
${signatoryName ? `<p style="margin:0;font-weight:700;color:#0000AA;font-size:16px;">${escapeHtml(signatoryName)}</p>` : ""}
<p style="margin:2px 0 0;font-size:13px;color:#555;">${escapeHtml(signatoryDesignation)}</p>
<p style="margin:2px 0 0;font-size:13px;color:#555;">${escapeHtml(lhCompany)}</p>
</div>
</td><td style="width:80px;text-align:right;vertical-align:bottom;">
<img src="${qrImg}" alt="Verify QR" style="width:60px;height:60px;display:inline-block;" /><br/><span style="font-size:9px;color:#888;">Scan to verify</span>
</td></tr></table>
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

    // Send email notification with PDF attachment (non-blocking)
    const student = await prisma.user.findUnique({ where: { id: enrollment.studentId }, select: { name: true, email: true } });
    if (student) sendLetterGeneratedEmail(student.name, student.email, "Experience Letter", letter.letterNumber, letter.htmlContent || undefined).catch(() => {});

    return NextResponse.json(letter, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate experience letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
