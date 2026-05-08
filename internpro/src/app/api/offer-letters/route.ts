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
  if (session.role === "student") {
    where.enrollment = { studentId: session.id };
  }

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

  // Dynamic logo/signature replacement from current settings
  const currentSettings = await prisma.setting.findMany({
    where: { key: { in: ["letterhead_logo", "admin_signature"] } },
  });
  const sMap: Record<string, string> = {};
  currentSettings.forEach((s) => { sMap[s.key] = s.value; });
  const curLogo = sMap.letterhead_logo || "/uploads/kkhs-logo-new.png";
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

    // Get template, org, and settings before transaction
    const template = await prisma.offerLetterTemplate.findFirst({ where: { isDefault: true } });
    const org = enrollment.batch.program.organization;
    const allSettings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    allSettings.forEach((s) => { sMap[s.key] = s.value; });
    const signatureUrl = sMap.admin_signature || "";
    const signatoryName = sMap.signatory_name || "";
    const signatoryDesignation = sMap.signatory_designation || "Authorized Signatory";

    const letterNumber = generateUniqueId("OL");
    const cardNumber = generateUniqueId("EMP");

    const todayDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const joiningDateFormatted = joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : todayDate;
    const feeLabel = body.feeType === "paid_by_student" ? "Training Fee" : body.feeType === "stipend" ? "Monthly Stipend" : "Free";

    const sigBlock = signatureUrl
      ? `<img src="${signatureUrl}" alt="Signature" style="height: 50px; display: block; margin-bottom: 4px; object-fit: contain;" />`
      : `<div style="height: 50px; margin-bottom: 4px;"></div>`;

    const lhLogo = sMap.letterhead_logo || "/uploads/kkhs-logo-new.png";
    const lhCompany = sMap.letterhead_company_name || org.name || "KKHS Media Private Limited";
    const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
    const lhPhone = sMap.letterhead_phone || "9782005500";
    const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
    const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";

    const LH = `<table style="width:100%;border-collapse:collapse;margin:0;padding:0;"><tr><td style="width:180px;vertical-align:middle;padding:12px 0 12px 28px;"><img src="${lhLogo}" alt="${escapeHtml(lhCompany)}" style="height:164px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:12px 28px 12px 14px;"><p style="margin:0;font-size:28px;font-weight:700;color:#0000AA;letter-spacing:0.5px;">${escapeHtml(lhCompany)}</p><p style="margin:5px 0 0;font-size:16px;color:#555;line-height:1.4;">${escapeHtml(lhAddress)}</p><p style="margin:4px 0 0;font-size:16px;color:#555;">Ph: ${escapeHtml(lhPhone)} &nbsp;|&nbsp; ${escapeHtml(lhEmail)} &nbsp;|&nbsp; GST: ${escapeHtml(lhGst)}</p></td></tr></table><div style="height:4px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;

    const FT = `<div style="height:3px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);margin-top:auto;"></div><div style="padding:8px 28px;text-align:center;"><p style="margin:0;font-size:14px;font-weight:600;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:3px 0 0;font-size:12px;color:#666;">${escapeHtml(lhAddress)} &nbsp;|&nbsp; Ph: ${escapeHtml(lhPhone)} &nbsp;|&nbsp; ${escapeHtml(lhEmail)} &nbsp;|&nbsp; GST: ${escapeHtml(lhGst)}</p></div>`;

    const PG = "width:210mm;height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;overflow:hidden;";
    const PGL = "width:210mm;height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;";
    const PC = "flex:1;min-height:0;overflow:hidden;padding:10px 32px 6px;display:flex;flex-direction:column;justify-content:space-between;";

    const extraTerms = sMap.letter_offer_extra || "";
    const extraSection = extraTerms ? `<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">9. Additional Terms</p><p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">${escapeHtml(extraTerms)}</p>` : "";

    const defaultOfferHtml = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="${PG}">
${LH}
<div style="${PC}">
<table style="width:100%;margin-bottom:4px;"><tr><td style="font-size:13px;color:#555;">Ref: <strong style="color:#222;">{{letter_number}}</strong></td><td style="text-align:right;font-size:13px;color:#555;">Date: <strong style="color:#222;">${todayDate}</strong></td></tr></table>
<div style="text-align:center;margin:2px 0 6px;"><h2 style="margin:0;font-size:26px;font-weight:700;color:#0000AA;letter-spacing:3px;text-transform:uppercase;">Offer Letter</h2><div style="width:50px;height:3px;background:#d32f2f;margin:4px auto 0;"></div></div>
<p style="font-size:14px;color:#333;margin:5px 0 3px;">Dear <strong style="color:#0000AA;">{{student_name}}</strong>,</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">With reference to your application and subsequent interactions, we are pleased to offer you an internship position at <strong>${escapeHtml(lhCompany)}</strong> for the <strong>{{program_name}}</strong> program. This offer is subject to the following terms and conditions outlined below.</p>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">1. Position Details</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 3px;font-size:13px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:5px 12px;color:white;font-weight:600;width:160px;border:1px solid #0000AA;">Particulars</td><td style="padding:5px 12px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">{{program_name}}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">{{duration}} Days</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Date of Joining</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${joiningDateFormatted}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Work Timing</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">{{work_timing}}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Mode of Work</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">{{mode}}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Monthly Stipend</td><td style="padding:5px 12px;border:1px solid #e0e0e0;"><strong>&#8377;{{salary}}</strong>/month</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Weekly Off</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">{{weekoffs}} day(s) per week</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Paid Leaves</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">{{paid_leaves}} per month</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Payment Type</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${feeLabel}</td></tr>
</table>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">2. Reporting &amp; Probation</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">You shall report to your designated Team Leader on the date of joining. The first <strong>7 working days</strong> shall constitute a probationary period during which your performance, punctuality, and conduct will be evaluated. Upon successful completion of probation, a minimum written notice of <strong>7 days</strong> shall be required from either party for separation.</p>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">3. Code of Conduct</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 2px;">As an intern, you are expected to:</p>
<ul style="font-size:13px;color:#333;line-height:1.45;margin:0;padding-left:20px;">
<li style="margin-bottom:1px;">Maintain professional behaviour and adhere to all workplace policies and guidelines.</li>
<li style="margin-bottom:1px;">Follow the prescribed work schedule and obtain prior written approval for any leave.</li>
<li style="margin-bottom:1px;">Complete all assigned tasks within stipulated deadlines with a quality-first approach.</li>
<li style="margin-bottom:1px;">Treat colleagues, clients, and all stakeholders with respect, dignity, and integrity.</li>
<li>Refrain from any activity that may bring disrepute to the organization or its brand.</li>
</ul>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
<div style="${PGL}">
${LH}
<div style="${PC}">
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">4. Confidentiality &amp; Non-Disclosure Agreement</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">During the tenure and even after the conclusion of this internship, you shall not disclose, share, or make use of any proprietary information, trade secrets, client data, business strategies, or any other confidential material belonging to ${escapeHtml(lhCompany)} or its clients, partners, and associates without obtaining prior written consent from the management. Any violation of this clause may result in immediate termination and appropriate legal action as deemed necessary.</p>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">5. Intellectual Property Rights</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">Any and all work product, including but not limited to code, designs, content, documentation, creative output, research findings, or any other deliverables produced during the course of this internship shall be the sole and exclusive intellectual property of ${escapeHtml(lhCompany)}. You hereby agree to irrevocably assign all rights, title, and interest in such work to the company without any additional consideration.</p>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">6. Termination &amp; Separation</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">The company reserves the right to terminate this internship at any time in the event of misconduct, breach of confidentiality, unsatisfactory performance, violation of company policies, or any behaviour detrimental to the organization. The intern may also choose to resign by providing a minimum of <strong>7 days</strong> written notice to the reporting authority. All company property, access credentials, and confidential materials must be returned upon separation.</p>
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">7. General Terms &amp; Conditions</p>
<ul style="font-size:13px;color:#333;line-height:1.45;margin:0;padding-left:20px;">
<li style="margin-bottom:1px;">This offer is contingent upon successful verification of your educational qualifications, identity documents, and any other credentials as may be required.</li>
<li style="margin-bottom:1px;">The company reserves the right to assign you to any project, team, or department as per prevailing business requirements and organizational needs.</li>
<li style="margin-bottom:1px;">Use of personal mobile phones during working hours shall be restricted to designated break periods only.</li>
<li style="margin-bottom:1px;">You shall not engage in any freelancing, part-time employment, or competing business activity during the period of this internship.</li>
<li>Any disputes arising out of or in connection with this offer shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan, India.</li>
</ul>
${extraSection}
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:5px 0 2px;">8. Acceptance</p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">Please confirm your acceptance of this offer by reporting at the office on the above-mentioned date of joining along with the following documents: <strong>Aadhar Card, PAN Card (if applicable), two passport-size photographs, all relevant educational certificates,</strong> and a <strong>signed copy of this offer letter.</strong></p>
<p style="font-size:13px;color:#333;line-height:1.45;text-align:justify;margin:0 0 3px;">We look forward to your valuable association with ${escapeHtml(lhCompany)} and wish you a highly productive and rewarding internship experience with us.</p>
<p style="margin:5px 0 0;font-size:14px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">${escapeHtml(lhCompany)}</strong>,</p>
<div style="margin-top:4px;">
${sigBlock}
${signatoryName ? `<p style="margin:0;font-weight:700;color:#0000AA;font-size:16px;">${escapeHtml(signatoryName)}</p>` : ""}
<p style="margin:2px 0 0;font-size:13px;color:#555;">{{signatory_designation}}</p>
<p style="margin:2px 0 0;font-size:13px;color:#555;">${escapeHtml(lhCompany)}</p>
</div>
<div style="margin-top:6px;padding-top:4px;border-top:1px dashed #ccc;">
<p style="font-size:14px;font-weight:700;color:#0000AA;margin:0 0 3px;">Intern&rsquo;s Acceptance</p>
<p style="font-size:13px;color:#333;line-height:1.45;margin:0 0 3px;">I, <strong>{{student_name}}</strong>, hereby accept the above-mentioned terms and conditions and agree to abide by all policies, rules, and regulations of ${escapeHtml(lhCompany)} during the course of my internship.</p>
<table style="width:100%;font-size:13px;color:#555;"><tr><td style="width:50%;padding:4px 0;">Signature: ________________________</td><td style="width:50%;padding:4px 0;">Date: ________________________</td></tr><tr><td style="padding:4px 0;">Name: {{student_name}}</td><td></td></tr></table>
</div>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
</div>`;

    let htmlContent = template?.htmlContent || defaultOfferHtml;
    htmlContent = htmlContent
      .replace(/\{\{company_name\}\}/g, escapeHtml(org.name))
      .replace(/\{\{student_name\}\}/g, escapeHtml(enrollment.student.name))
      .replace(/\{\{program_name\}\}/g, escapeHtml(enrollment.batch.program.title))
      .replace(/\{\{letter_number\}\}/g, escapeHtml(letterNumber))
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("en-IN"))
      .replace(/\{\{joining_date\}\}/g, joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"))
      .replace(/\{\{duration\}\}/g, String(enrollment.batch.program.duration))
      .replace(/\{\{salary\}\}/g, String(salary || 0))
      .replace(/\{\{weekoffs\}\}/g, String(weekoffs || 1))
      .replace(/\{\{paid_leaves\}\}/g, String(paidLeaves || 0))
      .replace(/\{\{work_timing\}\}/g, escapeHtml(workTiming || "10:00 AM - 6:00 PM"))
      .replace(/\{\{mode\}\}/g, escapeHtml(enrollment.batch.program.mode))
      .replace(/\{\{signatory_designation\}\}/g, escapeHtml(signatoryDesignation));

    const interview = await prisma.interview.findFirst({
      where: { enrollmentId },
    });

    // All DB writes in a single transaction for atomicity
    const offerLetter = await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
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

      const letter = await tx.offerLetter.create({
        data: {
          enrollmentId,
          letterNumber,
          htmlContent,
          templateId: template?.id,
        },
      });

      if (interview) {
        await tx.interview.update({
          where: { id: interview.id },
          data: { status: "completed", result: "selected" },
        });
      }

      await tx.employeeCard.create({
        data: {
          userId: enrollment.studentId,
          cardNumber,
          designation: `${enrollment.batch.program.title} Intern`,
          department: enrollment.batch.program.domain,
          validFrom: joiningDate ? new Date(joiningDate) : new Date(),
          validUntil: enrollment.batch.endDate,
        },
      });

      return letter;
    });

    // Send email notification (non-blocking)
    const student = await prisma.user.findUnique({ where: { id: enrollment.studentId }, select: { name: true, email: true } });
    if (student) sendLetterGeneratedEmail(student.name, student.email, "Offer Letter", offerLetter.letterNumber).catch(() => {});

    return NextResponse.json(offerLetter, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate offer letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
