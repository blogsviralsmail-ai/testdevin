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

    const letterheadHtml = `<table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
  <tr>
    <td style="width: 100px; vertical-align: middle; padding: 14px 0 14px 28px;">
      <img src="${lhLogo}" alt="${lhCompany}" style="height: 70px; display: block; object-fit: contain;" />
    </td>
    <td style="text-align: right; vertical-align: middle; padding: 14px 28px 14px 10px;">
      <p style="margin: 0; font-size: 22px; font-weight: 700; color: #0000AA; letter-spacing: 0.5px;">${escapeHtml(lhCompany)}</p>
      <p style="margin: 4px 0 0; font-size: 11px; color: #555; line-height: 1.5;">${escapeHtml(lhAddress)}</p>
      <p style="margin: 2px 0 0; font-size: 11px; color: #555;">Phone: ${escapeHtml(lhPhone)} &nbsp;|&nbsp; Email: ${escapeHtml(lhEmail)} &nbsp;|&nbsp; GST: ${escapeHtml(lhGst)}</p>
    </td>
  </tr>
</table>
<div style="height: 3px; background: linear-gradient(90deg, #0000AA, #0000AA 70%, #d32f2f 70%, #d32f2f);"></div>`;

    const footerHtml = `<div style="height: 2px; background: linear-gradient(90deg, #0000AA, #0000AA 70%, #d32f2f 70%, #d32f2f); margin-top: 10px;"></div>
<div style="padding: 6px 28px; text-align: center;">
  <p style="margin: 0; font-size: 9px; font-weight: 600; color: #0000AA;">${escapeHtml(lhCompany)}</p>
  <p style="margin: 2px 0 0; font-size: 8px; color: #666;">${escapeHtml(lhAddress)} | Phone: ${escapeHtml(lhPhone)} | Email: ${escapeHtml(lhEmail)} | GST: ${escapeHtml(lhGst)}</p>
</div>`;

    const pgStyle = "width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; background: white; position: relative; box-sizing: border-box; page-break-after: always; display: flex; flex-direction: column;";
    const pgStyleLast = "width: 210mm; min-height: 297mm; padding: 0; margin: 0 auto; background: white; position: relative; box-sizing: border-box; display: flex; flex-direction: column;";
    const pcStyle = "flex: 1; padding: 16px 32px 8px;";
    const pfStyle = "flex-shrink: 0;";

    const defaultOfferHtml = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 0 auto; padding: 0; background: white; color: #222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">

<div style="${pgStyle}">
${letterheadHtml}
<div style="${pcStyle}">
  <table style="width: 100%; margin-bottom: 10px;">
    <tr>
      <td style="font-size: 11px; color: #555;">Ref: <strong style="color: #222;">{{letter_number}}</strong></td>
      <td style="text-align: right; font-size: 11px; color: #555;">Date: <strong style="color: #222;">${todayDate}</strong></td>
    </tr>
  </table>

  <div style="text-align: center; margin: 4px 0 12px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #0000AA; letter-spacing: 3px; text-transform: uppercase;">Offer Letter</h2>
    <div style="width: 50px; height: 2px; background: #d32f2f; margin: 4px auto 0;"></div>
  </div>

  <p style="font-size: 11.5px; color: #333; margin: 10px 0 4px;">Dear <strong style="color: #0000AA;">{{student_name}}</strong>,</p>

  <p style="font-size: 11px; color: #333; line-height: 1.7; text-align: justify; margin: 0 0 8px;">
    With reference to your application and subsequent discussions, we are pleased to offer you an internship position at <strong>{{company_name}}</strong> for the <strong>{{program_name}}</strong> program. This offer is subject to the terms and conditions outlined herein.
  </p>

  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 10px 0 4px;">1. Position Details</p>
  <table style="width: 100%; border-collapse: collapse; margin: 0 0 8px; font-size: 10.5px; border: 1px solid #ddd;">
    <tr style="background: #0000AA;"><td style="padding: 5px 10px; color: white; font-weight: 600; width: 170px; border: 1px solid #0000AA;">Particulars</td><td style="padding: 5px 10px; color: white; font-weight: 600; border: 1px solid #0000AA;">Details</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Program</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">{{program_name}}</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Duration</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">{{duration}} Days</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Date of Joining</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">${joiningDateFormatted}</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Work Timing</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">{{work_timing}}</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Mode of Work</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">{{mode}}</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Stipend / Compensation</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;"><strong>&#8377;{{salary}}</strong> per month</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Weekly Off</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">{{weekoffs}} day(s)</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Paid Leaves</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">{{paid_leaves}} per month</td></tr>
    <tr><td style="padding: 4px 10px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Payment Type</td><td style="padding: 4px 10px; border: 1px solid #e0e0e0;">${feeLabel}</td></tr>
  </table>

  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 8px 0 3px;">2. Reporting &amp; Probation</p>
  <p style="font-size: 10.5px; color: #333; line-height: 1.65; text-align: justify; margin: 0 0 6px;">
    You shall report to your designated Team Leader / Project Manager on the date of joining. The first <strong>7 working days</strong> shall be treated as a probationary period during which either party may terminate the engagement without notice. Post probation, a minimum notice period of <strong>7 days</strong> is required from either side.
  </p>

  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 8px 0 3px;">3. Code of Conduct</p>
  <p style="font-size: 10.5px; color: #333; line-height: 1.6; text-align: justify; margin: 0 0 2px;">You are expected to:</p>
  <ul style="font-size: 10.5px; color: #333; line-height: 1.6; margin: 0 0 6px; padding-left: 18px;">
    <li>Maintain professional behaviour and adhere to the company&rsquo;s workplace policies at all times.</li>
    <li>Follow the prescribed work schedule and obtain prior approval for any leave or absence.</li>
    <li>Complete all assigned tasks within stipulated deadlines with a quality-first approach.</li>
    <li>Treat colleagues, clients, and stakeholders with respect and integrity.</li>
    <li>Refrain from any activity that brings disrepute to the organization.</li>
  </ul>

  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 8px 0 3px;">4. Confidentiality &amp; Non-Disclosure</p>
  <p style="font-size: 10.5px; color: #333; line-height: 1.65; text-align: justify; margin: 0 0 6px;">
    During and after the tenure of your internship, you shall not disclose, publish, or otherwise reveal any proprietary information, trade secrets, business strategies, client data, source code, or any other confidential material belonging to {{company_name}} or its clients to any third party without prior written consent. Violation of this clause may result in immediate termination and legal action.
  </p>
</div>
<div style="${pfStyle}">${footerHtml}</div>
</div>

<div style="${pgStyleLast}">
${letterheadHtml}
<div style="${pcStyle}">
  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 6px 0 3px;">5. Intellectual Property</p>
  <p style="font-size: 10.5px; color: #333; line-height: 1.65; text-align: justify; margin: 0 0 6px;">
    Any work, code, design, content, innovation, or creative output produced by you during the course of this internship shall be the sole intellectual property of {{company_name}}. You agree to assign all rights, title, and interest in such work to the company without any additional compensation.
  </p>

  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 8px 0 3px;">6. Termination</p>
  <p style="font-size: 10.5px; color: #333; line-height: 1.65; text-align: justify; margin: 0 0 6px;">
    The company reserves the right to terminate this internship at any time in case of misconduct, breach of confidentiality, poor performance, or violation of company policies. In such an event, no experience certificate or recommendation shall be issued. The intern may also resign by providing a written notice of <strong>7 days</strong>.
  </p>

  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 8px 0 3px;">7. General Terms</p>
  <ul style="font-size: 10.5px; color: #333; line-height: 1.65; margin: 0 0 6px; padding-left: 18px;">
    <li>This offer is contingent upon the verification of your educational qualifications and identity documents.</li>
    <li>The company may assign you to any project, team, or department as per business requirements.</li>
    <li>Use of personal mobile phones during working hours is restricted to breaks only.</li>
    <li>You shall not engage in any freelancing or competing business activity during the internship.</li>
    <li>Any disputes arising shall be subject to the jurisdiction of courts in Jaipur, Rajasthan.</li>
  </ul>

  <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 8px 0 3px;">8. Acceptance</p>
  <p style="font-size: 10.5px; color: #333; line-height: 1.65; text-align: justify; margin: 0 0 8px;">
    Please confirm your acceptance of this offer by reporting on the specified date of joining along with the following documents: <strong>Aadhar Card, PAN Card (if available), Passport-size photographs (2 copies), Educational certificates, and a signed copy of this offer letter.</strong>
  </p>

  <p style="font-size: 10.5px; color: #333; line-height: 1.65; text-align: justify; margin: 0 0 12px;">
    We look forward to your association with {{company_name}} and wish you a rewarding internship experience.
  </p>

  <p style="margin: 16px 0 0; font-size: 11px; color: #333;">For &amp; on behalf of <strong style="color: #0000AA;">{{company_name}}</strong>,</p>
  <div style="margin-top: 8px;">
    ${sigBlock}
    <p style="margin: 0; font-weight: 700; color: #0000AA; font-size: 13px;">{{signatory_name}}</p>
    <p style="margin: 2px 0 0; font-size: 10px; color: #555;">{{signatory_designation}}</p>
    <p style="margin: 2px 0 0; font-size: 10px; color: #555;">{{company_name}}</p>
  </div>

  <div style="margin-top: 20px; padding-top: 10px; border-top: 1px dashed #ccc;">
    <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 0 0 4px;">Intern&rsquo;s Acceptance</p>
    <p style="font-size: 10px; color: #333; line-height: 1.6; margin: 0 0 14px;">
      I, <strong>{{student_name}}</strong>, hereby accept the terms and conditions as stated above and agree to abide by the policies of {{company_name}} during the course of my internship.
    </p>
    <table style="width: 100%; font-size: 10px; color: #555;">
      <tr>
        <td style="width: 50%; padding: 3px 0;">Signature: ________________________</td>
        <td style="width: 50%; padding: 3px 0;">Date: ________________________</td>
      </tr>
      <tr>
        <td style="padding: 3px 0;">Name: {{student_name}}</td>
        <td style="padding: 3px 0;"></td>
      </tr>
    </table>
  </div>
</div>
<div style="${pfStyle}">${footerHtml}</div>
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
