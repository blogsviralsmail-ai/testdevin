const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function main() {
  const letters = await prisma.experienceLetter.findMany({
    include: {
      enrollment: {
        include: {
          student: true,
          batch: { include: { program: true } },
        },
      },
    },
  });

  console.log(`Found ${letters.length} experience letters to update`);

  const performanceMap = { excellent: "Outstanding", good: "Very Good", average: "Satisfactory" };

  for (const letter of letters) {
    const studentName = escapeHtml(letter.enrollment.student.name);
    const programTitle = escapeHtml(letter.enrollment.batch.program.title);
    const orgName = escapeHtml("KKH Media");
    const category = escapeHtml(letter.category || "good");
    const performanceLabel = performanceMap[letter.category || "good"] || "Good";
    const remarks = escapeHtml(letter.remarks || `${performanceLabel} performance`);
    const startDateStr = letter.enrollment.batch.startDate
      ? new Date(letter.enrollment.batch.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
      : "N/A";
    const endDateStr = new Date(letter.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const todayFormatted = new Date(letter.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const duration = letter.enrollment.batch.program.duration;

    const html = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 0; background: white;">
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
<div style="padding: 30px 40px 20px;">
  <div style="text-align: right; margin-bottom: 15px;">
    <p style="margin: 0; font-size: 12px; color: #555;">Ref: <strong>${letter.letterNumber}</strong></p>
    <p style="margin: 3px 0 0; font-size: 12px; color: #555;">Date: ${todayFormatted}</p>
  </div>
  <h2 style="text-align: center; color: #0000AA; font-size: 22px; margin: 20px 0; letter-spacing: 2px;">EXPERIENCE CERTIFICATE</h2>
  <p style="font-size: 13px; color: #333; margin-top: 20px;">To Whom It May Concern,</p>
  <p style="font-size: 13px; color: #333; line-height: 1.8; text-align: justify;">
    This is to certify that <strong style="color: #0000AA;">${studentName}</strong> has successfully completed the 
    <strong>${programTitle}</strong> program at <strong>${orgName}</strong>.
  </p>
  <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
    <tr style="background: #f5f7ff;">
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; width: 170px; color: #0000AA;">Program</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${programTitle}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Duration</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${duration} Days</td>
    </tr>
    <tr style="background: #f5f7ff;">
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Period</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${startDateStr} to ${endDateStr}</td>
    </tr>
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Performance</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;"><strong style="color: #0000AA;">${performanceLabel}</strong> (${category})</td>
    </tr>
    <tr style="background: #f5f7ff;">
      <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Remarks</td>
      <td style="padding: 8px 12px; border: 1px solid #ddd; color: #333;">${remarks}</td>
    </tr>
  </table>
  <p style="font-size: 13px; color: #333; line-height: 1.8; text-align: justify;">
    During the tenure, ${studentName} demonstrated a high level of dedication, professionalism, and competence. 
    We appreciate the contributions made and wish them all the very best in their future endeavors.
  </p>
  <div style="margin-top: 50px;">
    <p style="margin: 0; font-size: 13px; color: #333;">Warm Regards,</p>
    <div style="margin-top: 35px;">
      <p style="margin: 0; font-weight: bold; color: #0000AA; font-size: 14px;">Authorized Signatory</p>
      <p style="margin: 3px 0 0; font-size: 12px; color: #555;">${orgName}</p>
    </div>
  </div>
</div>
<div style="border-top: 2px solid #0000AA; padding: 8px 20px; text-align: center; margin-top: 20px;">
  <p style="margin: 0; font-size: 8pt; font-weight: bold; color: #0000AA;">KKHS Media Private Limited</p>
  <p style="margin: 2px 0 0; font-size: 7pt; color: #555;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012 | Mob: 9782005500 | Email: hari@kkhsmedia.com</p>
</div>
</div>`;

    await prisma.experienceLetter.update({
      where: { id: letter.id },
      data: { htmlContent: html },
    });
    console.log(`Updated: ${letter.letterNumber} — ${letter.enrollment.student.name}`);
  }

  // Also update any existing offer letters
  const offerLetters = await prisma.offerLetter.findMany({
    include: { enrollment: { include: { student: true, batch: { include: { program: true } } } } },
  });
  console.log(`\nFound ${offerLetters.length} offer letters to update`);

  for (const ol of offerLetters) {
    const studentName = escapeHtml(ol.enrollment.student.name);
    const programTitle = escapeHtml(ol.enrollment.batch.program.title);
    const orgName = "KKHS Media Private Limited";
    const duration = ol.enrollment.batch.program.duration;
    const salary = ol.enrollment.salary || 0;
    const weekoffs = ol.enrollment.weekoffs || 1;
    const paidLeaves = ol.enrollment.paidLeaves || 0;
    const workTiming = ol.enrollment.workTiming || "10:00 AM - 6:00 PM";
    const mode = ol.enrollment.batch.program.mode || "offline";
    const joiningDate = ol.enrollment.joiningDate ? new Date(ol.enrollment.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";
    const todayDate = new Date(ol.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const feeType = ol.enrollment.feeType || "stipend";
    const feeLabel = feeType === "paid_by_student" ? "Training Fee" : feeType === "stipend" ? "Monthly Stipend" : "Free";

    const html = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 0; background: white;">
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
<div style="padding: 30px 40px 20px;">
  <div style="text-align: right; margin-bottom: 15px;">
    <p style="margin: 0; font-size: 12px; color: #555;">Ref: <strong>${ol.letterNumber}</strong></p>
    <p style="margin: 3px 0 0; font-size: 12px; color: #555;">Date: ${todayDate}</p>
  </div>
  <h2 style="text-align: center; color: #0000AA; font-size: 22px; margin: 20px 0; letter-spacing: 2px;">OFFER LETTER</h2>
  <p style="font-size: 13px; color: #333; margin-top: 20px;">Dear <strong style="color: #0000AA;">${studentName}</strong>,</p>
  <p style="font-size: 13px; color: #333; line-height: 1.8; text-align: justify;">
    We are pleased to offer you the position of <strong>Intern</strong> in the <strong>${programTitle}</strong> program at 
    <strong>${orgName}</strong>. We are confident that your skills and enthusiasm will be valuable to our team.
  </p>
  <h3 style="color: #0000AA; margin-top: 20px; font-size: 14px;">Terms &amp; Conditions:</h3>
  <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px;">
    <tr style="background: #f5f7ff;"><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; width: 170px; color: #0000AA;">Program</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${programTitle}</td></tr>
    <tr><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Duration</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${duration} Days</td></tr>
    <tr style="background: #f5f7ff;"><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Joining Date</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${joiningDate}</td></tr>
    <tr><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Work Timing</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${workTiming}</td></tr>
    <tr style="background: #f5f7ff;"><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Mode</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${mode}</td></tr>
    <tr><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Stipend / Salary</td><td style="padding: 8px 12px; border: 1px solid #ddd;">₹${salary}/month</td></tr>
    <tr style="background: #f5f7ff;"><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Weekly Off</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${weekoffs} day(s)</td></tr>
    <tr><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Paid Leaves</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${paidLeaves} per month</td></tr>
    <tr style="background: #f5f7ff;"><td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold; color: #0000AA;">Payment Type</td><td style="padding: 8px 12px; border: 1px solid #ddd;">${feeLabel}</td></tr>
  </table>
  <p style="font-size: 13px; color: #333; line-height: 1.8; text-align: justify;">
    Please confirm your acceptance of this offer by joining on the specified date. We look forward to having you on our team.
  </p>
  <div style="margin-top: 50px;">
    <p style="margin: 0; font-size: 13px; color: #333;">Best Regards,</p>
    <div style="margin-top: 35px;">
      <p style="margin: 0; font-weight: bold; color: #0000AA; font-size: 14px;">HR Department</p>
      <p style="margin: 3px 0 0; font-size: 12px; color: #555;">${orgName}</p>
    </div>
  </div>
</div>
<div style="border-top: 2px solid #0000AA; padding: 8px 20px; text-align: center; margin-top: 20px;">
  <p style="margin: 0; font-size: 8pt; font-weight: bold; color: #0000AA;">KKHS Media Private Limited</p>
  <p style="margin: 2px 0 0; font-size: 7pt; color: #555;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012 | Mob: 9782005500 | Email: hari@kkhsmedia.com</p>
</div>
</div>`;

    await prisma.offerLetter.update({
      where: { id: ol.id },
      data: { htmlContent: html },
    });
    console.log(`Updated offer: ${ol.letterNumber} — ${ol.enrollment.student.name}`);
  }

  // Delete old templates
  const templates = await prisma.offerLetterTemplate.findMany();
  for (const t of templates) {
    await prisma.offerLetterTemplate.delete({ where: { id: t.id } });
    console.log(`Deleted template: ${t.name} (${t.type})`);
  }

  console.log("\nDone! All letters updated with new KKHS letterhead design.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
