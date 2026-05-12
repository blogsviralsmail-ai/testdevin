import { prisma } from "@/lib/prisma";
import { escapeHtml, generateUniqueId } from "@/lib/utils";
import { sendLetterGeneratedEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { generateEmployeeId } from "@/lib/employee-id";
import { generateQRDataUri } from "@/lib/qr";

export async function generateOfferLetterForEnrollment(enrollmentId: string, actorId: string, actorName: string): Promise<{ success: boolean; letterNumber?: string; error?: string }> {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        batch: { include: { program: { include: { organization: true } } } },
      },
    });
    if (!enrollment) return { success: false, error: "Enrollment not found" };

    const existing = await prisma.offerLetter.findFirst({ where: { enrollmentId } });
    if (existing) return { success: true, letterNumber: existing.letterNumber };

    // Auto-generate employee ID if not set
    if (!enrollment.student.employeeId) {
      const empId = await generateEmployeeId(enrollment.joiningDate || new Date());
      await prisma.user.update({ where: { id: enrollment.studentId }, data: { employeeId: empId } });
    }

    const template = await prisma.offerLetterTemplate.findFirst({ where: { isDefault: true, type: { not: "experience" } } });
    const org = enrollment.batch.program.organization;
    const allSettings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    allSettings.forEach(s => { sMap[s.key] = s.value; });
    const signatureUrl = sMap.admin_signature || "";
    const signatoryName = sMap.signatory_name || "";
    const signatoryDesignation = sMap.signatory_designation || "Authorized Signatory";

    const letterNumber = generateUniqueId("OL");
    const cardNumber = generateUniqueId("EMP");
    const siteUrl = sMap.site_url || "https://internship.kkhsmedia.com";
    const verifyUrl = `${siteUrl}/verify?number=${letterNumber}`;
    const qrImg = await generateQRDataUri(verifyUrl, 70);
    const todayDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const joiningDateFormatted = enrollment.joiningDate ? new Date(enrollment.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : todayDate;

    const sigBlock = signatureUrl
      ? `<img src="${signatureUrl}" alt="Signature" style="height: 50px; display: block; margin-bottom: 4px; object-fit: contain;" />`
      : `<div style="height: 50px; margin-bottom: 4px;"></div>`;

    const lhLogo = sMap.letterhead_logo || "/uploads/kkhs-logo.png";
    const lhCompany = sMap.letterhead_company_name || org?.name || "KKHS Media Private Limited";
    const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
    const lhPhone = sMap.letterhead_phone || "9782005500";
    const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
    const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";

    const LH = `<table style="width:100%;border-collapse:collapse;"><tr><td style="width:180px;vertical-align:middle;padding:12px 0 12px 28px;"><img src="${lhLogo}" alt="${escapeHtml(lhCompany)}" style="height:164px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:12px 28px 12px 14px;"><p style="margin:0;font-size:28px;font-weight:700;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:5px 0 0;font-size:16px;color:#555;">${escapeHtml(lhAddress)}</p><p style="margin:4px 0 0;font-size:16px;color:#555;">Ph: ${escapeHtml(lhPhone)} | ${escapeHtml(lhEmail)} | GST: ${escapeHtml(lhGst)}</p></td></tr></table><div style="height:4px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;
    const FT = `<div style="height:3px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);margin-top:auto;"></div><div style="padding:8px 28px;text-align:center;"><p style="margin:0;font-size:14px;font-weight:600;color:#0000AA;">${escapeHtml(lhCompany)}</p><p style="margin:3px 0 0;font-size:12px;color:#666;">${escapeHtml(lhAddress)} | Ph: ${escapeHtml(lhPhone)}</p></div>`;
    const PG = "width:210mm;height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;overflow:hidden;";
    const PC = "flex:1;min-height:0;overflow:hidden;padding:10px 32px 6px;display:flex;flex-direction:column;justify-content:space-between;";

    const feeLabel = enrollment.feeType === "paid" ? `Paid — ₹${(enrollment.feeAmount || 0).toLocaleString()}` : enrollment.feeType === "stipend" ? `Stipend — ₹${(enrollment.salary || 0).toLocaleString()}/month` : "Free";

    const htmlContent = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;">
<div style="${PG}">
${LH}
<div style="${PC}">
<table style="width:100%;margin-bottom:4px;"><tr><td style="font-size:13px;color:#555;">Ref: <strong>${letterNumber}</strong></td><td style="text-align:right;font-size:13px;color:#555;">Date: <strong>${todayDate}</strong></td></tr></table>
<div style="text-align:center;margin:2px 0 6px;"><h2 style="margin:0;font-size:26px;font-weight:700;color:#0000AA;letter-spacing:3px;text-transform:uppercase;">Offer Letter</h2></div>
<p style="font-size:14px;color:#333;">Dear <strong style="color:#0000AA;">${escapeHtml(enrollment.student.name)}</strong>,</p>
<p style="font-size:13px;color:#333;line-height:1.45;">We are pleased to offer you an internship position at <strong>${escapeHtml(lhCompany)}</strong> for the <strong>${escapeHtml(enrollment.batch.program.title)}</strong> program.</p>
<table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:5px 12px;color:white;font-weight:600;width:160px;">Particulars</td><td style="padding:5px 12px;color:white;font-weight:600;">Details</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;background:#fafbff;">Program</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${escapeHtml(enrollment.batch.program.title)}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;background:#fafbff;">Duration</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${enrollment.batch.program.duration} Days</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;background:#fafbff;">Date of Joining</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${joiningDateFormatted}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;background:#fafbff;">Work Timing</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${enrollment.workTiming || "9:30 AM - 6:30 PM"}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;background:#fafbff;">Fee Type</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${feeLabel}</td></tr>
<tr><td style="padding:5px 12px;border:1px solid #e0e0e0;font-weight:600;background:#fafbff;">Weekly Off</td><td style="padding:5px 12px;border:1px solid #e0e0e0;">${enrollment.weekoffs || 4} day(s)</td></tr>
</table>
<div style="margin-top:8px;">${sigBlock}<p style="margin:0;font-size:13px;font-weight:700;color:#0000AA;">${escapeHtml(signatoryName)}</p><p style="margin:0;font-size:12px;color:#555;">${escapeHtml(signatoryDesignation)}</p></div>
<div style="text-align:right;margin-top:4px;"><img src="${qrImg}" style="width:70px;height:70px;" /><p style="font-size:8px;color:#888;">Scan to verify</p></div>
</div>
${FT}
</div></div>`;

    const offerLetter = await prisma.$transaction(async (tx) => {
      const letter = await tx.offerLetter.create({
        data: { enrollmentId, letterNumber, htmlContent, templateId: template?.id },
      });
      await tx.employeeCard.create({
        data: {
          userId: enrollment.studentId,
          cardNumber,
          designation: `${enrollment.batch.program.title} Intern`,
          department: enrollment.batch.program.domain,
          validFrom: enrollment.joiningDate || new Date(),
          validUntil: enrollment.batch.endDate,
        },
      });
      return letter;
    });

    const extraDetails: Record<string, string> = {
      "{{program_name}}": enrollment.batch.program.title,
      "{{joining_date}}": joiningDateFormatted,
      "{{work_timing}}": enrollment.workTiming || "9:30 AM - 6:30 PM",
      "{{salary}}": String(enrollment.salary || 0),
      "{{weekoffs}}": String(enrollment.weekoffs || 4),
      "{{mode}}": enrollment.batch.program.mode,
      "{{duration}}": String(enrollment.batch.program.duration),
    };
    sendLetterGeneratedEmail(enrollment.student.name, enrollment.student.email, "Offer Letter", offerLetter.letterNumber, offerLetter.htmlContent || undefined, extraDetails).catch(() => {});

    logActivity("generated", "offer_letter", offerLetter.id, `Offer Letter ${offerLetter.letterNumber} for ${enrollment.student.name} (after payment)`, actorId, actorName).catch(() => {});

    return { success: true, letterNumber: offerLetter.letterNumber };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate offer letter";
    console.error("[generateOfferLetterForEnrollment]", message);
    return { success: false, error: message };
  }
}
