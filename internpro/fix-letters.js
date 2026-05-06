// Regenerate ALL existing letters with fit-to-page A4 templates
// Offer letter: 2 full pages, Experience letter: 1 full page
// Logo height matches 3-line text, bigger fonts for professional look
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

async function main() {
  const allSettings = await prisma.setting.findMany();
  const sMap = {};
  allSettings.forEach(s => { sMap[s.key] = s.value; });

  const lhLogo = sMap.letterhead_logo || "/uploads/kkhs-logo-new.jpg";
  const lhCompany = sMap.letterhead_company_name || "KKHS Media Private Limited";
  const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
  const lhPhone = sMap.letterhead_phone || "9782005500";
  const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
  const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";
  const sigUrl = sMap.admin_signature || "";
  const sigName = sMap.signatory_name || "";
  const sigDesg = sMap.signatory_designation || "Authorized Signatory";
  const extraTerms = sMap.letter_offer_extra || "";
  const extraExpNote = sMap.letter_exp_extra || "";
  const cn = esc(lhCompany);

  const LH = `<table style="width:100%;border-collapse:collapse;margin:0;padding:0;"><tr><td style="width:80px;vertical-align:middle;padding:10px 0 10px 24px;"><img src="${lhLogo}" alt="${cn}" style="height:65px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:10px 24px 10px 12px;"><p style="margin:0;font-size:19px;font-weight:700;color:#0000AA;letter-spacing:0.5px;">${cn}</p><p style="margin:4px 0 0;font-size:11px;color:#555;line-height:1.4;">${esc(lhAddress)}</p><p style="margin:3px 0 0;font-size:11px;color:#555;">Ph: ${esc(lhPhone)} &nbsp;|&nbsp; ${esc(lhEmail)} &nbsp;|&nbsp; GST: ${esc(lhGst)}</p></td></tr></table><div style="height:3px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;

  const FT = `<div style="height:2px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);margin-top:auto;"></div><div style="padding:6px 24px;text-align:center;"><p style="margin:0;font-size:9px;font-weight:600;color:#0000AA;">${cn}</p><p style="margin:2px 0 0;font-size:8px;color:#666;">${esc(lhAddress)} &nbsp;|&nbsp; Ph: ${esc(lhPhone)} &nbsp;|&nbsp; ${esc(lhEmail)} &nbsp;|&nbsp; GST: ${esc(lhGst)}</p></div>`;

  const sigBlock = sigUrl
    ? `<img src="${sigUrl}" alt="Signature" style="height:50px;display:block;margin-bottom:4px;object-fit:contain;" />`
    : `<div style="height:50px;margin-bottom:4px;"></div>`;
  const sigNameLine = sigName ? `<p style="margin:0;font-weight:700;color:#0000AA;font-size:12px;">${esc(sigName)}</p>` : "";

  const PG = "width:210mm;height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;overflow:hidden;";
  const PGL = "width:210mm;height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;";
  const PC = "flex:1;padding:12px 30px 8px;";

  const extraSection = extraTerms ? `<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:10px 0 4px;">9. Additional Terms</p><p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 6px;">${esc(extraTerms)}</p>` : "";
  const extraExpSec = extraExpNote ? `<p style="font-size:10.5px;color:#333;line-height:1.55;text-align:justify;margin:6px 0 8px;">${esc(extraExpNote)}</p>` : "";

  // ==================== OFFER LETTERS ====================
  const offerLetters = await prisma.offerLetter.findMany({
    include: { enrollment: { include: { student: true, batch: { include: { program: { include: { organization: true } } } } } } }
  });
  console.log(`Found ${offerLetters.length} offer letters to regenerate`);

  for (const ol of offerLetters) {
    const e = ol.enrollment;
    const studentName = esc(e.student.name);
    const programName = esc(e.batch.program.title);
    const duration = e.batch.program.duration;
    const joiningDate = e.joiningDate ? new Date(e.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const todayDate = new Date(ol.issuedAt || ol.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const workTiming = esc(e.workTiming || "10:00 AM - 6:00 PM");
    const mode = esc(e.batch.program.mode || "online");
    const salary = e.salary || 0;
    const weekoffs = e.weekoffs || 1;
    const paidLeaves = e.paidLeaves || 0;
    const feeType = e.feeType || "free";
    const feeLabel = feeType === "paid_by_student" ? "Training Fee" : feeType === "stipend" ? "Monthly Stipend" : "Company Pays You";
    const letterNumber = ol.letterNumber;

    const html = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="${PG}">
${LH}
<div style="${PC}">
<table style="width:100%;margin-bottom:8px;"><tr><td style="font-size:10px;color:#555;">Ref: <strong style="color:#222;">${letterNumber}</strong></td><td style="text-align:right;font-size:10px;color:#555;">Date: <strong style="color:#222;">${todayDate}</strong></td></tr></table>
<div style="text-align:center;margin:4px 0 12px;"><h2 style="margin:0;font-size:20px;font-weight:700;color:#0000AA;letter-spacing:3px;text-transform:uppercase;">Offer Letter</h2><div style="width:50px;height:2px;background:#d32f2f;margin:4px auto 0;"></div></div>
<p style="font-size:11px;color:#333;margin:8px 0 6px;">Dear <strong style="color:#0000AA;">${studentName}</strong>,</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 8px;">With reference to your application and subsequent interactions, we are pleased to offer you an internship position at <strong>${cn}</strong> for the <strong>${programName}</strong> program. This offer is subject to the following terms and conditions outlined below.</p>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">1. Position Details</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 8px;font-size:10.5px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:5px 12px;color:white;font-weight:600;width:160px;border:1px solid #0000AA;">Particulars</td><td style="padding:5px 12px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${programName}</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${duration} Days</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Date of Joining</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${joiningDate}</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Work Timing</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${workTiming}</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Mode of Work</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${mode}</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Monthly Stipend</td><td style="padding:4px 12px;border:1px solid #e0e0e0;"><strong>&#8377;${salary}</strong>/month</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Weekly Off</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${weekoffs} day(s) per week</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Paid Leaves</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${paidLeaves} per month</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Payment Type</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${feeLabel}</td></tr>
</table>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">2. Reporting &amp; Probation</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 6px;">You shall report to your designated Team Leader on the date of joining. The first <strong>7 working days</strong> shall constitute a probationary period during which your performance, punctuality, and conduct will be evaluated. Upon successful completion of probation, a minimum written notice of <strong>7 days</strong> shall be required from either party for separation.</p>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">3. Code of Conduct</p>
<p style="font-size:10.5px;color:#333;line-height:1.55;text-align:justify;margin:0 0 2px;">As an intern, you are expected to:</p>
<ul style="font-size:10.5px;color:#333;line-height:1.6;margin:0 0 6px;padding-left:20px;">
<li style="margin-bottom:2px;">Maintain professional behaviour and adhere to all workplace policies and guidelines.</li>
<li style="margin-bottom:2px;">Follow the prescribed work schedule and obtain prior written approval for any leave.</li>
<li style="margin-bottom:2px;">Complete all assigned tasks within stipulated deadlines with a quality-first approach.</li>
<li style="margin-bottom:2px;">Treat colleagues, clients, and all stakeholders with respect, dignity, and integrity.</li>
<li>Refrain from any activity that may bring disrepute to the organization or its brand.</li>
</ul>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">4. Confidentiality &amp; Non-Disclosure Agreement</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 6px;">During the tenure and even after the conclusion of this internship, you shall not disclose, share, or make use of any proprietary information, trade secrets, client data, business strategies, or any other confidential material belonging to ${cn} or its clients, partners, and associates without obtaining prior written consent from the management. Any violation of this clause may result in immediate termination and appropriate legal action as deemed necessary.</p>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
<div style="${PGL}">
${LH}
<div style="${PC}">
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:6px 0 4px;">5. Intellectual Property Rights</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 6px;">Any and all work product, including but not limited to code, designs, content, documentation, creative output, research findings, or any other deliverables produced during the course of this internship shall be the sole and exclusive intellectual property of ${cn}. You hereby agree to irrevocably assign all rights, title, and interest in such work to the company without any additional consideration.</p>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">6. Termination &amp; Separation</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 6px;">The company reserves the right to terminate this internship at any time in the event of misconduct, breach of confidentiality, unsatisfactory performance, violation of company policies, or any behaviour detrimental to the organization. The intern may also choose to resign by providing a minimum of <strong>7 days</strong> written notice to the reporting authority. All company property, access credentials, and confidential materials must be returned upon separation.</p>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">7. General Terms &amp; Conditions</p>
<ul style="font-size:10.5px;color:#333;line-height:1.6;margin:0 0 6px;padding-left:20px;">
<li style="margin-bottom:3px;">This offer is contingent upon successful verification of your educational qualifications, identity documents, and any other credentials as may be required.</li>
<li style="margin-bottom:3px;">The company reserves the right to assign you to any project, team, or department as per prevailing business requirements and organizational needs.</li>
<li style="margin-bottom:3px;">Use of personal mobile phones during working hours shall be restricted to designated break periods only.</li>
<li style="margin-bottom:3px;">You shall not engage in any freelancing, part-time employment, or competing business activity during the period of this internship.</li>
<li>Any disputes arising out of or in connection with this offer shall be subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan, India.</li>
</ul>
${extraSection}
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">8. Acceptance</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 6px;">Please confirm your acceptance of this offer by reporting at the office on the above-mentioned date of joining along with the following documents: <strong>Aadhar Card, PAN Card (if applicable), two passport-size photographs, all relevant educational certificates,</strong> and a <strong>signed copy of this offer letter.</strong></p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 14px;">We look forward to your valuable association with ${cn} and wish you a highly productive and rewarding internship experience with us.</p>
<p style="margin:10px 0 0;font-size:11px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">${cn}</strong>,</p>
<div style="margin-top:8px;">
${sigBlock}
${sigNameLine}
<p style="margin:2px 0 0;font-size:10px;color:#555;">${esc(sigDesg)}</p>
<p style="margin:2px 0 0;font-size:10px;color:#555;">${cn}</p>
</div>
<div style="margin-top:20px;padding-top:10px;border-top:1px dashed #ccc;">
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:0 0 6px;">Intern&rsquo;s Acceptance</p>
<p style="font-size:10px;color:#333;line-height:1.6;margin:0 0 14px;">I, <strong>${studentName}</strong>, hereby accept the above-mentioned terms and conditions and agree to abide by all policies, rules, and regulations of ${cn} during the course of my internship.</p>
<table style="width:100%;font-size:10px;color:#555;"><tr><td style="width:50%;padding:3px 0;">Signature: ________________________</td><td style="width:50%;padding:3px 0;">Date: ________________________</td></tr><tr><td style="padding:3px 0;">Name: ${studentName}</td><td></td></tr></table>
</div>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
</div>`;

    await prisma.offerLetter.update({ where: { id: ol.id }, data: { htmlContent: html } });
    console.log(`  Updated offer letter ${letterNumber} for ${e.student.name}`);
  }

  // ==================== EXPERIENCE LETTERS ====================
  const expLetters = await prisma.experienceLetter.findMany({
    include: { enrollment: { include: { student: true, batch: { include: { program: { include: { organization: true } } } } } } }
  });
  console.log(`Found ${expLetters.length} experience letters to regenerate`);

  for (const el of expLetters) {
    const e = el.enrollment;
    const studentName = esc(e.student.name);
    const programName = esc(e.batch.program.title);
    const duration = e.batch.program.duration;
    const startDate = e.batch.startDate ? new Date(e.batch.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";
    const endDate = e.batch.endDate ? new Date(e.batch.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";
    const todayFormatted = new Date(el.issuedAt || el.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const category = el.category || "good";
    const perfLabel = category === "excellent" ? "Excellent" : category === "good" ? "Good" : "Average";
    const remarks = esc(e.adminRemarks || "");
    const letterNumber = el.letterNumber;

    const html = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="width:210mm;height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;">
${LH}
<div style="flex:1;padding:14px 30px 8px;">
<table style="width:100%;margin-bottom:8px;"><tr><td style="font-size:10px;color:#555;">Ref: <strong style="color:#222;">${letterNumber}</strong></td><td style="text-align:right;font-size:10px;color:#555;">Date: <strong style="color:#222;">${todayFormatted}</strong></td></tr></table>
<div style="text-align:center;margin:4px 0 14px;"><h2 style="margin:0;font-size:20px;font-weight:700;color:#0000AA;letter-spacing:3px;text-transform:uppercase;">Experience Certificate</h2><div style="width:50px;height:2px;background:#d32f2f;margin:4px auto 0;"></div></div>
<p style="font-size:11.5px;color:#333;margin:8px 0 6px;"><strong>To Whom It May Concern,</strong></p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 8px;">This is to certify that <strong style="color:#0000AA;">${studentName}</strong> was associated with <strong>${cn}</strong> as an intern under the <strong>${programName}</strong> program. The details of the engagement are summarized in the table below:</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 10px;font-size:10.5px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:5px 12px;color:white;font-weight:600;width:160px;border:1px solid #0000AA;">Particulars</td><td style="padding:5px 12px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${programName}</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${duration} Days</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Period</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${startDate} to ${endDate}</td></tr>
<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Performance</td><td style="padding:4px 12px;border:1px solid #e0e0e0;"><strong style="color:#0000AA;">${perfLabel}</strong></td></tr>
${remarks ? `<tr><td style="padding:4px 12px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Remarks</td><td style="padding:4px 12px;border:1px solid #e0e0e0;">${remarks}</td></tr>` : ""}
</table>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">Performance Summary</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 8px;">During the internship tenure, ${studentName} demonstrated commendable professionalism, technical aptitude, and a consistently proactive approach towards learning and skill development. The intern met assigned deadlines with diligence, exhibited strong analytical and problem-solving capabilities, and collaborated effectively with team members across various projects. The overall quality of work delivered was rated as <strong style="color:#0000AA;">${perfLabel}</strong> by the supervising authority.</p>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">Key Strengths Observed</p>
<ul style="font-size:10.5px;color:#333;line-height:1.6;margin:0 0 8px;padding-left:20px;">
<li style="margin-bottom:3px;">Strong understanding of core concepts and practical applications related to the ${programName} domain.</li>
<li style="margin-bottom:3px;">Demonstrated ability to work both independently and as an effective team contributor.</li>
<li style="margin-bottom:3px;">Excellent time management skills with consistent adherence to project deadlines and deliverables.</li>
<li style="margin-bottom:3px;">Willingness to learn new technologies, tools, and methodologies as required by the role.</li>
<li>Professional conduct, positive workplace attitude, and strong interpersonal communication skills throughout the engagement.</li>
</ul>
<p style="font-size:11.5px;font-weight:700;color:#0000AA;margin:8px 0 4px;">Recommendation</p>
<p style="font-size:10.5px;color:#333;line-height:1.6;text-align:justify;margin:0 0 8px;">Based on the overall performance, dedication, and professional conduct demonstrated during the internship period, we are pleased to recommend <strong style="color:#0000AA;">${studentName}</strong> for any suitable professional opportunity. We are confident that the skills and experience gained during this tenure will serve as a strong foundation for future career growth. We wish ${studentName} all the very best in all future endeavours.</p>
${extraExpSec}
<p style="margin:12px 0 0;font-size:11px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">${cn}</strong>,</p>
<div style="margin-top:8px;">
${sigBlock}
${sigNameLine}
<p style="margin:2px 0 0;font-size:10px;color:#555;">${esc(sigDesg)}</p>
<p style="margin:2px 0 0;font-size:10px;color:#555;">${cn}</p>
</div>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
</div>`;

    await prisma.experienceLetter.update({ where: { id: el.id }, data: { htmlContent: html } });
    console.log(`  Updated experience letter ${letterNumber} for ${e.student.name}`);
  }

  console.log("Done! All letters regenerated with fit-to-page templates.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
