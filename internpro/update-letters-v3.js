const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function main() {
  // Update existing experience letters
  const expLetters = await prisma.experienceLetter.findMany({
    include: {
      enrollment: {
        include: {
          student: true,
          batch: { include: { program: { include: { organization: true } } } },
        },
      },
    },
  });

  console.log(`Found ${expLetters.length} experience letters to update`);

  for (const letter of expLetters) {
    const e = letter.enrollment;
    const org = e.batch.program.organization;
    const safeOrgName = escapeHtml(org.name);
    const safeStudentName = escapeHtml(e.student.name);
    const safeProgramTitle = escapeHtml(e.batch.program.title);
    const safeRemarks = e.teamLeaderRemarks ? escapeHtml(e.teamLeaderRemarks) : "";
    const performanceMap = { excellent: "Outstanding", good: "Very Good", average: "Satisfactory" };
    const performanceLabel = performanceMap[e.teamLeaderCategory || "good"] || "Good";
    const startDateStr = e.batch.startDate ? e.batch.startDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";
    const endDateStr = letter.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const todayFormatted = letter.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    const htmlContent = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 0; background: white; color: #222;">
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
      <td style="font-size: 12px; color: #555;">Ref: <strong style="color: #222;">${letter.letterNumber}</strong></td>
      <td style="text-align: right; font-size: 12px; color: #555;">Date: <strong style="color: #222;">${todayFormatted}</strong></td>
    </tr>
  </table>

  <div style="text-align: center; margin: 10px 0 25px;">
    <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #0000AA; letter-spacing: 3px; text-transform: uppercase;">Experience Certificate</h2>
    <div style="width: 60px; height: 3px; background: #d32f2f; margin: 8px auto 0;"></div>
  </div>

  <p style="font-size: 13px; color: #333; margin: 20px 0 12px;"><strong>To Whom It May Concern,</strong></p>

  <p style="font-size: 12px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 12px;">
    This is to certify that <strong style="color: #0000AA;">${safeStudentName}</strong> was associated with <strong>${safeOrgName}</strong> as an intern under the <strong>${safeProgramTitle}</strong> program. The details of the engagement are summarized below:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 12px; border: 1px solid #ddd;">
    <tr style="background: #0000AA;"><td style="padding: 8px 14px; color: white; font-weight: 600; width: 180px; border: 1px solid #0000AA;">Particulars</td><td style="padding: 8px 14px; color: white; font-weight: 600; border: 1px solid #0000AA;">Details</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Program</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${safeProgramTitle}</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Duration</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${e.batch.program.duration} Days</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Period of Internship</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${startDateStr} to ${endDateStr}</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Overall Performance</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;"><strong style="color: #0000AA;">${performanceLabel}</strong></td></tr>
    ${safeRemarks ? `<tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Supervisor Remarks</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${safeRemarks}</td></tr>` : ""}
  </table>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 16px 0 6px;">Performance Summary</p>
  <p style="font-size: 12px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 10px;">
    During the internship tenure, ${safeStudentName} demonstrated commendable professionalism, technical aptitude, and a proactive approach to learning. The intern consistently met assigned deadlines, exhibited strong problem-solving capabilities, and collaborated effectively with the team. The quality of work delivered was rated as <strong style="color: #0000AA;">${performanceLabel}</strong> by the supervising authority.
  </p>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 16px 0 6px;">Key Strengths Observed</p>
  <ul style="font-size: 12px; color: #333; line-height: 1.8; margin: 0 0 10px; padding-left: 20px;">
    <li>Strong understanding of core concepts related to the ${safeProgramTitle} domain.</li>
    <li>Ability to work independently as well as in a team environment.</li>
    <li>Excellent time management and adherence to project timelines.</li>
    <li>Willingness to learn new technologies and adapt to changing requirements.</li>
    <li>Professional conduct and positive workplace attitude throughout the engagement.</li>
  </ul>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 16px 0 6px;">Recommendation</p>
  <p style="font-size: 12px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 12px;">
    Based on the overall performance and conduct during the internship, we are pleased to recommend <strong style="color: #0000AA;">${safeStudentName}</strong> for any suitable professional opportunity. We are confident that the skills and experience gained during this internship will serve as a strong foundation for future career growth.
  </p>

  <p style="font-size: 12px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 16px;">
    We wish ${safeStudentName} all the very best in future endeavours and are confident they will be a valuable asset to any organization.
  </p>

  <p style="margin: 30px 0 0; font-size: 12px; color: #333;">For &amp; on behalf of <strong style="color: #0000AA;">${safeOrgName}</strong>,</p>
  <div style="margin-top: 30px;">
    <p style="margin: 0; font-weight: 700; color: #0000AA; font-size: 14px;">Authorized Signatory</p>
    <p style="margin: 2px 0 0; font-size: 11px; color: #555;">HR Department</p>
    <p style="margin: 2px 0 0; font-size: 10px; color: #888;">${safeOrgName}</p>
    <p style="margin: 2px 0 0; font-size: 10px; color: #888;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
  </div>
</div>

<div style="height: 2px; background: linear-gradient(90deg, #0000AA, #0000AA 70%, #d32f2f 70%, #d32f2f); margin-top: 15px;"></div>
<div style="padding: 8px 30px; text-align: center;">
  <p style="margin: 0; font-size: 8pt; font-weight: 600; color: #0000AA;">KKHS Media Private Limited</p>
  <p style="margin: 2px 0 0; font-size: 7pt; color: #777;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012 | Phone: 9782005500 | Email: hari@kkhsmedia.com | GST: 08AAICK3853C1ZL</p>
  <p style="margin: 2px 0 0; font-size: 6pt; color: #999;">This is a computer-generated document. No signature is required on the company&rsquo;s behalf.</p>
</div>
</div>`;

    await prisma.experienceLetter.update({
      where: { id: letter.id },
      data: { htmlContent },
    });
    console.log(`Updated experience letter: ${letter.letterNumber} for ${e.student.name}`);
  }

  // Update existing offer letters
  const offerLetters = await prisma.offerLetter.findMany({
    include: {
      enrollment: {
        include: {
          student: true,
          batch: { include: { program: { include: { organization: true } } } },
        },
      },
    },
  });

  console.log(`Found ${offerLetters.length} offer letters to update`);

  for (const letter of offerLetters) {
    const e = letter.enrollment;
    const org = e.batch.program.organization;
    const todayDate = letter.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const joiningDateFormatted = e.joiningDate ? e.joiningDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : todayDate;
    const feeLabel = e.feeType === "paid_by_student" ? "Training Fee" : e.feeType === "stipend" ? "Monthly Stipend" : "Free";

    const htmlContent = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 0; background: white; color: #222;">
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
      <td style="font-size: 12px; color: #555;">Ref: <strong style="color: #222;">${letter.letterNumber}</strong></td>
      <td style="text-align: right; font-size: 12px; color: #555;">Date: <strong style="color: #222;">${todayDate}</strong></td>
    </tr>
  </table>

  <div style="text-align: center; margin: 10px 0 25px;">
    <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #0000AA; letter-spacing: 3px; text-transform: uppercase;">Offer Letter</h2>
    <div style="width: 60px; height: 3px; background: #d32f2f; margin: 8px auto 0;"></div>
  </div>

  <p style="font-size: 13px; color: #333; margin: 20px 0 8px;">Dear <strong style="color: #0000AA;">${escapeHtml(e.student.name)}</strong>,</p>

  <p style="font-size: 13px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 12px;">
    With reference to your application and subsequent discussions, we are pleased to offer you an internship position at <strong>${escapeHtml(org.name)}</strong> for the <strong>${escapeHtml(e.batch.program.title)}</strong> program. This offer is subject to the terms and conditions outlined herein.
  </p>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 8px;">1. Position Details</p>
  <table style="width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 12px; border: 1px solid #ddd;">
    <tr style="background: #0000AA;"><td style="padding: 8px 14px; color: white; font-weight: 600; width: 180px; border: 1px solid #0000AA;">Particulars</td><td style="padding: 8px 14px; color: white; font-weight: 600; border: 1px solid #0000AA;">Details</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Program</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${escapeHtml(e.batch.program.title)}</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Duration</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${e.batch.program.duration} Days</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Date of Joining</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${joiningDateFormatted}</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Work Timing</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${escapeHtml(e.workTiming || "10:00 AM - 6:00 PM")}</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Mode of Work</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${escapeHtml(e.batch.program.mode)}</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Stipend / Compensation</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;"><strong>&#8377;${e.salary || 0}</strong> per month</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Weekly Off</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${e.weekoffs || 1} day(s)</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Paid Leaves</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${e.paidLeaves || 0} per month</td></tr>
    <tr><td style="padding: 7px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Payment Type</td><td style="padding: 7px 14px; border: 1px solid #e0e0e0;">${feeLabel}</td></tr>
  </table>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 6px;">2. Reporting &amp; Probation</p>
  <p style="font-size: 12px; color: #333; line-height: 1.8; text-align: justify; margin: 0 0 10px;">
    You shall report to your designated Team Leader / Project Manager on the date of joining. The first <strong>7 working days</strong> shall be treated as a probationary period during which either party may terminate the engagement without notice. Post probation, a minimum notice period of <strong>7 days</strong> is required from either side.
  </p>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 6px;">3. Code of Conduct</p>
  <p style="font-size: 12px; color: #333; line-height: 1.8; text-align: justify; margin: 0 0 4px;">You are expected to:</p>
  <ul style="font-size: 12px; color: #333; line-height: 1.8; margin: 0 0 10px; padding-left: 20px;">
    <li>Maintain professional behaviour and adhere to the company&rsquo;s workplace policies at all times.</li>
    <li>Follow the prescribed work schedule and obtain prior approval for any leave or absence.</li>
    <li>Complete all assigned tasks within stipulated deadlines with a quality-first approach.</li>
    <li>Treat colleagues, clients, and stakeholders with respect and integrity.</li>
    <li>Refrain from any activity that brings disrepute to the organization.</li>
  </ul>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 6px;">4. Confidentiality &amp; Non-Disclosure</p>
  <p style="font-size: 12px; color: #333; line-height: 1.8; text-align: justify; margin: 0 0 10px;">
    During and after the tenure of your internship, you shall not disclose, publish, or otherwise reveal any proprietary information, trade secrets, business strategies, client data, source code, or any other confidential material belonging to ${escapeHtml(org.name)} or its clients to any third party without prior written consent. Violation of this clause may result in immediate termination and legal action.
  </p>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 6px;">5. Intellectual Property</p>
  <p style="font-size: 12px; color: #333; line-height: 1.8; text-align: justify; margin: 0 0 10px;">
    Any work, code, design, content, innovation, or creative output produced by you during the course of this internship shall be the sole intellectual property of ${escapeHtml(org.name)}. You agree to assign all rights, title, and interest in such work to the company without any additional compensation.
  </p>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 6px;">6. Termination</p>
  <p style="font-size: 12px; color: #333; line-height: 1.8; text-align: justify; margin: 0 0 10px;">
    The company reserves the right to terminate this internship at any time in case of misconduct, breach of confidentiality, poor performance, or violation of company policies. In such an event, no experience certificate or recommendation shall be issued. The intern may also resign by providing a written notice of <strong>7 days</strong>.
  </p>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 6px;">7. General Terms</p>
  <ul style="font-size: 12px; color: #333; line-height: 1.8; margin: 0 0 10px; padding-left: 20px;">
    <li>This offer is contingent upon the verification of your educational qualifications and identity documents.</li>
    <li>The company may assign you to any project, team, or department as per business requirements.</li>
    <li>Use of personal mobile phones during working hours is restricted to breaks only.</li>
    <li>You shall not engage in any freelancing or competing business activity during the internship.</li>
    <li>Any disputes arising shall be subject to the jurisdiction of courts in Jaipur, Rajasthan.</li>
  </ul>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 18px 0 6px;">8. Acceptance</p>
  <p style="font-size: 12px; color: #333; line-height: 1.8; text-align: justify; margin: 0 0 12px;">
    Please confirm your acceptance of this offer by reporting on the specified date of joining along with the following documents: <strong>Aadhar Card, PAN Card (if available), Passport-size photographs (2 copies), Educational certificates, and a signed copy of this offer letter.</strong>
  </p>

  <p style="font-size: 12px; color: #333; line-height: 1.8; text-align: justify; margin: 0 0 16px;">
    We look forward to your association with ${escapeHtml(org.name)} and wish you a rewarding internship experience.
  </p>

  <p style="margin: 30px 0 0; font-size: 12px; color: #333;">For &amp; on behalf of <strong style="color: #0000AA;">${escapeHtml(org.name)}</strong>,</p>
  <div style="margin-top: 30px;">
    <p style="margin: 0; font-weight: 700; color: #0000AA; font-size: 14px;">HR Department</p>
    <p style="margin: 2px 0 0; font-size: 11px; color: #555;">${escapeHtml(org.name)}</p>
    <p style="margin: 2px 0 0; font-size: 10px; color: #888;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
  </div>

  <div style="margin-top: 40px; padding-top: 16px; border-top: 1px dashed #ccc;">
    <p style="font-size: 12px; font-weight: 700; color: #0000AA; margin: 0 0 8px;">Intern&rsquo;s Acceptance</p>
    <p style="font-size: 11px; color: #333; line-height: 1.7; margin: 0 0 20px;">
      I, <strong>${escapeHtml(e.student.name)}</strong>, hereby accept the terms and conditions as stated above and agree to abide by the policies of ${escapeHtml(org.name)} during the course of my internship.
    </p>
    <table style="width: 100%; font-size: 11px; color: #555;">
      <tr>
        <td style="width: 50%; padding: 4px 0;">Signature: ________________________</td>
        <td style="width: 50%; padding: 4px 0;">Date: ________________________</td>
      </tr>
      <tr>
        <td style="padding: 4px 0;">Name: ${escapeHtml(e.student.name)}</td>
        <td style="padding: 4px 0;"></td>
      </tr>
    </table>
  </div>
</div>

<div style="height: 2px; background: linear-gradient(90deg, #0000AA, #0000AA 70%, #d32f2f 70%, #d32f2f); margin-top: 15px;"></div>
<div style="padding: 8px 30px; text-align: center;">
  <p style="margin: 0; font-size: 8pt; font-weight: 600; color: #0000AA;">KKHS Media Private Limited</p>
  <p style="margin: 2px 0 0; font-size: 7pt; color: #777;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012 | Phone: 9782005500 | Email: hari@kkhsmedia.com | GST: 08AAICK3853C1ZL</p>
  <p style="margin: 2px 0 0; font-size: 6pt; color: #999;">This is a computer-generated document. No signature is required on the company&rsquo;s behalf.</p>
</div>
</div>`;

    await prisma.offerLetter.update({
      where: { id: letter.id },
      data: { htmlContent },
    });
    console.log(`Updated offer letter: ${letter.letterNumber} for ${e.student.name}`);
  }

  console.log("All letters updated with new pro-level designs!");
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
