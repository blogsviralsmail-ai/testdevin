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

    // Get template, org, and settings before transaction
    const template = await prisma.offerLetterTemplate.findFirst({ where: { isDefault: true } });
    const org = enrollment.batch.program.organization;
    const allSettings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    allSettings.forEach((s) => { sMap[s.key] = s.value; });
    const signatureUrl = sMap.admin_signature || "";
    const signatoryName = sMap.signatory_name || "HR Department";
    const signatoryDesignation = sMap.signatory_designation || "Authorized Signatory";

    const letterNumber = generateUniqueId("OL");
    const cardNumber = generateUniqueId("EMP");

    const todayDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const joiningDateFormatted = joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : todayDate;
    const feeLabel = body.feeType === "paid_by_student" ? "Training Fee" : body.feeType === "stipend" ? "Monthly Stipend" : "Free";

    const sigBlock = signatureUrl
      ? `<img src="${signatureUrl}" alt="Signature" style="height: 50px; display: block; margin-bottom: 4px; object-fit: contain;" />`
      : `<div style="height: 50px; margin-bottom: 4px;"></div>`;

    const lhLogo = sMap.letterhead_logo || "/uploads/kkhs-logo-new.jpg";
    const lhCompany = sMap.letterhead_company_name || org.name || "KKHS Media Private Limited";
    const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
    const lhPhone = sMap.letterhead_phone || "9782005500";
    const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
    const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";

    const LH = `<table style="width:100%;border-collapse:collapse;margin:0;padding:0;"><tr><td style="width:60px;vertical-align:middle;padding:8px 0 8px 20px;"><img src="${lhLogo}" alt="${escapeHtml(lhCompany)}" style="height:50px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:8px 20px 8px 8px;"><p style="margin:0;font-size:16px;font-weight:700;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:2px 0 0;font-size:9px;color:#555;">${escapeHtml(lhAddress)}</p><p style="margin:1px 0 0;font-size:9px;color:#555;">Ph: ${escapeHtml(lhPhone)} | ${escapeHtml(lhEmail)} | GST: ${escapeHtml(lhGst)}</p></td></tr></table><div style="height:2px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;

    const FT = `<div style="height:2px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);margin-top:6px;"></div><div style="padding:4px 20px;text-align:center;"><p style="margin:0;font-size:8px;font-weight:600;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:1px 0 0;font-size:7px;color:#666;">${escapeHtml(lhAddress)} | Ph: ${escapeHtml(lhPhone)} | ${escapeHtml(lhEmail)} | GST: ${escapeHtml(lhGst)}</p></div>`;

    const PG = "width:210mm;min-height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;";
    const PGL = "width:210mm;min-height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;";
    const PC = "flex:1;padding:10px 24px 4px;";

    const defaultOfferHtml = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="${PG}">
${LH}
<div style="${PC}">
<table style="width:100%;margin-bottom:6px;"><tr><td style="font-size:9px;color:#555;">Ref: <strong style="color:#222;">{{letter_number}}</strong></td><td style="text-align:right;font-size:9px;color:#555;">Date: <strong style="color:#222;">${todayDate}</strong></td></tr></table>
<div style="text-align:center;margin:2px 0 8px;"><h2 style="margin:0;font-size:16px;font-weight:700;color:#0000AA;letter-spacing:2px;text-transform:uppercase;">Offer Letter</h2><div style="width:40px;height:2px;background:#d32f2f;margin:3px auto 0;"></div></div>
<p style="font-size:9.5px;color:#333;margin:6px 0 3px;">Dear <strong style="color:#0000AA;">{{student_name}}</strong>,</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 5px;">With reference to your application, we are pleased to offer you an internship at <strong>{{company_name}}</strong> for the <strong>{{program_name}}</strong> program, subject to the following terms and conditions.</p>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:6px 0 3px;">1. Position Details</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 5px;font-size:9px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:3px 8px;color:white;font-weight:600;width:150px;border:1px solid #0000AA;">Particulars</td><td style="padding:3px 8px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">{{program_name}}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">{{duration}} Days</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Joining Date</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${joiningDateFormatted}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Work Timing</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">{{work_timing}}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Mode</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">{{mode}}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Stipend</td><td style="padding:2px 8px;border:1px solid #e0e0e0;"><strong>&#8377;{{salary}}</strong>/month</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Weekly Off</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">{{weekoffs}} day(s)</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Paid Leaves</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">{{paid_leaves}}/month</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Payment Type</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${feeLabel}</td></tr>
</table>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:5px 0 2px;">2. Reporting &amp; Probation</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 4px;">You shall report to your designated Team Leader on the date of joining. The first <strong>7 working days</strong> shall be a probationary period. Post probation, a minimum notice of <strong>7 days</strong> is required from either side.</p>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:5px 0 2px;">3. Code of Conduct</p>
<p style="font-size:9px;color:#333;line-height:1.45;text-align:justify;margin:0 0 1px;">You are expected to:</p>
<ul style="font-size:9px;color:#333;line-height:1.45;margin:0 0 4px;padding-left:16px;">
<li>Maintain professional behaviour and adhere to workplace policies.</li>
<li>Follow the prescribed work schedule and obtain prior approval for leave.</li>
<li>Complete assigned tasks within deadlines with quality-first approach.</li>
<li>Treat colleagues, clients, and stakeholders with respect and integrity.</li>
<li>Refrain from any activity that brings disrepute to the organization.</li>
</ul>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:5px 0 2px;">4. Confidentiality &amp; Non-Disclosure</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 4px;">During and after the internship, you shall not disclose any proprietary information, trade secrets, client data, or confidential material belonging to {{company_name}} or its clients without prior written consent. Violation may result in immediate termination and legal action.</p>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:5px 0 2px;">5. Intellectual Property</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 4px;">Any work, code, design, or creative output produced during this internship shall be the sole intellectual property of {{company_name}}. You agree to assign all rights to the company.</p>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
<div style="${PGL}">
${LH}
<div style="${PC}">
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:4px 0 2px;">6. Termination</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 4px;">The company reserves the right to terminate this internship in case of misconduct, breach of confidentiality, poor performance, or policy violation. The intern may resign with <strong>7 days</strong> written notice.</p>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:5px 0 2px;">7. General Terms</p>
<ul style="font-size:9px;color:#333;line-height:1.5;margin:0 0 4px;padding-left:16px;">
<li>This offer is contingent upon verification of educational qualifications and identity documents.</li>
<li>The company may assign you to any project or team as per business requirements.</li>
<li>Personal mobile phones during working hours are restricted to breaks only.</li>
<li>You shall not engage in freelancing or competing business during the internship.</li>
<li>Disputes shall be subject to the jurisdiction of courts in Jaipur, Rajasthan.</li>
</ul>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:5px 0 2px;">8. Acceptance</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 6px;">Please confirm acceptance by reporting on the joining date with: <strong>Aadhar Card, PAN Card (if available), Passport-size photos (2), Educational certificates, and a signed copy of this letter.</strong></p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 10px;">We look forward to your association with {{company_name}} and wish you a rewarding internship experience.</p>
<p style="margin:12px 0 0;font-size:9.5px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">{{company_name}}</strong>,</p>
<div style="margin-top:6px;">
${sigBlock}
<p style="margin:0;font-weight:700;color:#0000AA;font-size:11px;">{{signatory_name}}</p>
<p style="margin:1px 0 0;font-size:9px;color:#555;">{{signatory_designation}}</p>
<p style="margin:1px 0 0;font-size:9px;color:#555;">{{company_name}}</p>
</div>
<div style="margin-top:16px;padding-top:8px;border-top:1px dashed #ccc;">
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:0 0 3px;">Intern&rsquo;s Acceptance</p>
<p style="font-size:8.5px;color:#333;line-height:1.5;margin:0 0 10px;">I, <strong>{{student_name}}</strong>, hereby accept the terms and conditions stated above and agree to abide by the policies of {{company_name}} during my internship.</p>
<table style="width:100%;font-size:9px;color:#555;"><tr><td style="width:50%;padding:2px 0;">Signature: ________________________</td><td style="width:50%;padding:2px 0;">Date: ________________________</td></tr><tr><td style="padding:2px 0;">Name: {{student_name}}</td><td></td></tr></table>
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
      .replace(/\{\{signatory_name\}\}/g, escapeHtml(signatoryName))
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

    return NextResponse.json(offerLetter, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate offer letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
