// Regenerate ALL existing letters with the new compact A4 template
// Offer letter: 2 pages, Experience letter: 1 page
// Reads letterhead settings from DB
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

async function main() {
  // Read settings
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
  const sigName = sMap.signatory_name || "HR Department";
  const sigDesg = sMap.signatory_designation || "Authorized Signatory";

  const LH = `<table style="width:100%;border-collapse:collapse;margin:0;padding:0;"><tr><td style="width:60px;vertical-align:middle;padding:8px 0 8px 20px;"><img src="${lhLogo}" alt="${esc(lhCompany)}" style="height:50px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:8px 20px 8px 8px;"><p style="margin:0;font-size:16px;font-weight:700;color:#0000AA;">${esc(lhCompany)}</p><p style="margin:2px 0 0;font-size:9px;color:#555;">${esc(lhAddress)}</p><p style="margin:1px 0 0;font-size:9px;color:#555;">Ph: ${esc(lhPhone)} | ${esc(lhEmail)} | GST: ${esc(lhGst)}</p></td></tr></table><div style="height:2px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;

  const FT = `<div style="height:2px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);margin-top:6px;"></div><div style="padding:4px 20px;text-align:center;"><p style="margin:0;font-size:8px;font-weight:600;color:#0000AA;">${esc(lhCompany)}</p><p style="margin:1px 0 0;font-size:7px;color:#666;">${esc(lhAddress)} | Ph: ${esc(lhPhone)} | ${esc(lhEmail)} | GST: ${esc(lhGst)}</p></div>`;

  const sigBlock = sigUrl
    ? `<img src="${sigUrl}" alt="Signature" style="height:50px;display:block;margin-bottom:4px;object-fit:contain;" />`
    : `<div style="height:50px;margin-bottom:4px;"></div>`;

  const PG = "width:210mm;min-height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;page-break-after:always;display:flex;flex-direction:column;";
  const PGL = "width:210mm;min-height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;";
  const PC = "flex:1;padding:10px 24px 4px;";

  // Fix offer letters
  const offerLetters = await prisma.offerLetter.findMany({
    include: { enrollment: { include: { student: true, batch: { include: { program: { include: { organization: true } } } } } } }
  });
  console.log(`Found ${offerLetters.length} offer letters to regenerate`);

  for (const ol of offerLetters) {
    const e = ol.enrollment;
    const studentName = esc(e.student.name);
    const programName = esc(e.batch.program.title);
    const duration = e.batch.program.duration;
    const joiningDate = ol.joiningDate ? new Date(ol.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const todayDate = new Date(ol.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const workTiming = ol.workTiming || "10:00 AM - 6:00 PM";
    const mode = esc(e.batch.program.mode || "online");
    const salary = ol.salary || "0";
    const weekoffs = ol.weekoffs || "2";
    const paidLeaves = ol.paidLeaves || "2";
    const feeType = ol.feeType || "free";
    const feeLabel = feeType === "paid_by_student" ? "Training Fee" : feeType === "stipend" ? "Monthly Stipend" : "Free";
    const letterNumber = ol.letterNumber;
    const cn = esc(lhCompany);

    const html = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="${PG}">
${LH}
<div style="${PC}">
<table style="width:100%;margin-bottom:6px;"><tr><td style="font-size:9px;color:#555;">Ref: <strong style="color:#222;">${letterNumber}</strong></td><td style="text-align:right;font-size:9px;color:#555;">Date: <strong style="color:#222;">${todayDate}</strong></td></tr></table>
<div style="text-align:center;margin:2px 0 8px;"><h2 style="margin:0;font-size:16px;font-weight:700;color:#0000AA;letter-spacing:2px;text-transform:uppercase;">Offer Letter</h2><div style="width:40px;height:2px;background:#d32f2f;margin:3px auto 0;"></div></div>
<p style="font-size:9.5px;color:#333;margin:6px 0 3px;">Dear <strong style="color:#0000AA;">${studentName}</strong>,</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 5px;">With reference to your application, we are pleased to offer you an internship at <strong>${cn}</strong> for the <strong>${programName}</strong> program, subject to the following terms and conditions.</p>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:6px 0 3px;">1. Position Details</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 5px;font-size:9px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:3px 8px;color:white;font-weight:600;width:150px;border:1px solid #0000AA;">Particulars</td><td style="padding:3px 8px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${programName}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${duration} Days</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Joining Date</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${joiningDate}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Work Timing</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${esc(workTiming)}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Mode</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${mode}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Stipend</td><td style="padding:2px 8px;border:1px solid #e0e0e0;"><strong>&#8377;${salary}</strong>/month</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Weekly Off</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${weekoffs} day(s)</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Paid Leaves</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${paidLeaves}/month</td></tr>
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
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 4px;">During and after the internship, you shall not disclose any proprietary information, trade secrets, client data, or confidential material belonging to ${cn} or its clients without prior written consent. Violation may result in immediate termination and legal action.</p>
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:5px 0 2px;">5. Intellectual Property</p>
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 4px;">Any work, code, design, or creative output produced during this internship shall be the sole intellectual property of ${cn}. You agree to assign all rights to the company.</p>
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
<p style="font-size:9px;color:#333;line-height:1.5;text-align:justify;margin:0 0 10px;">We look forward to your association with ${cn} and wish you a rewarding internship experience.</p>
<p style="margin:12px 0 0;font-size:9.5px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">${cn}</strong>,</p>
<div style="margin-top:6px;">
${sigBlock}
<p style="margin:0;font-weight:700;color:#0000AA;font-size:11px;">${esc(sigName)}</p>
<p style="margin:1px 0 0;font-size:9px;color:#555;">${esc(sigDesg)}</p>
<p style="margin:1px 0 0;font-size:9px;color:#555;">${cn}</p>
</div>
<div style="margin-top:16px;padding-top:8px;border-top:1px dashed #ccc;">
<p style="font-size:10px;font-weight:700;color:#0000AA;margin:0 0 3px;">Intern&rsquo;s Acceptance</p>
<p style="font-size:8.5px;color:#333;line-height:1.5;margin:0 0 10px;">I, <strong>${studentName}</strong>, hereby accept the terms and conditions stated above and agree to abide by the policies of ${cn} during my internship.</p>
<table style="width:100%;font-size:9px;color:#555;"><tr><td style="width:50%;padding:2px 0;">Signature: ________________________</td><td style="width:50%;padding:2px 0;">Date: ________________________</td></tr><tr><td style="padding:2px 0;">Name: ${studentName}</td><td></td></tr></table>
</div>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
</div>`;

    await prisma.offerLetter.update({ where: { id: ol.id }, data: { htmlContent: html } });
    console.log(`Regenerated offer letter ${ol.letterNumber} for ${e.student.name}`);
  }

  // Fix experience letters
  const expLetters = await prisma.experienceLetter.findMany({
    include: { enrollment: { include: { student: true, batch: { include: { program: { include: { organization: true } } } } } } }
  });
  console.log(`Found ${expLetters.length} experience letters to regenerate`);

  const sigBlockSmall = sigUrl
    ? `<img src="${sigUrl}" alt="Signature" style="height:40px;display:block;margin-bottom:2px;object-fit:contain;" />`
    : `<div style="height:40px;margin-bottom:2px;"></div>`;

  for (const el of expLetters) {
    const e = el.enrollment;
    const studentName = esc(e.student.name);
    const programName = esc(e.batch.program.title);
    const duration = e.batch.program.duration;
    const startDate = e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A";
    const endDate = el.createdAt ? new Date(el.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const todayDate = new Date(el.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const category = el.category || "good";
    const performanceLabel = category.charAt(0).toUpperCase() + category.slice(1);
    const cn = esc(lhCompany);

    const html = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="width:210mm;min-height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;display:flex;flex-direction:column;">
${LH}
<div style="flex:1;padding:8px 24px 4px;">
<table style="width:100%;margin-bottom:4px;"><tr><td style="font-size:9px;color:#555;">Ref: <strong style="color:#222;">${el.letterNumber}</strong></td><td style="text-align:right;font-size:9px;color:#555;">Date: <strong style="color:#222;">${todayDate}</strong></td></tr></table>
<div style="text-align:center;margin:2px 0 6px;"><h2 style="margin:0;font-size:15px;font-weight:700;color:#0000AA;letter-spacing:2px;text-transform:uppercase;">Experience Certificate</h2><div style="width:40px;height:2px;background:#d32f2f;margin:3px auto 0;"></div></div>
<p style="font-size:9.5px;color:#333;margin:5px 0 3px;"><strong>To Whom It May Concern,</strong></p>
<p style="font-size:9px;color:#333;line-height:1.45;text-align:justify;margin:0 0 4px;">This is to certify that <strong style="color:#0000AA;">${studentName}</strong> was associated with <strong>${cn}</strong> as an intern under the <strong>${programName}</strong> program. The details are summarized below:</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 5px;font-size:8.5px;border:1px solid #ddd;">
<tr style="background:#0000AA;"><td style="padding:3px 8px;color:white;font-weight:600;width:140px;border:1px solid #0000AA;">Particulars</td><td style="padding:3px 8px;color:white;font-weight:600;border:1px solid #0000AA;">Details</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Program</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${programName}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Duration</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${duration} Days</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Period</td><td style="padding:2px 8px;border:1px solid #e0e0e0;">${startDate} to ${endDate}</td></tr>
<tr><td style="padding:2px 8px;border:1px solid #e0e0e0;font-weight:600;color:#333;background:#fafbff;">Performance</td><td style="padding:2px 8px;border:1px solid #e0e0e0;"><strong style="color:#0000AA;">${performanceLabel}</strong></td></tr>
</table>
<p style="font-size:9.5px;font-weight:700;color:#0000AA;margin:4px 0 2px;">Performance Summary</p>
<p style="font-size:8.5px;color:#333;line-height:1.45;text-align:justify;margin:0 0 4px;">During the internship, ${studentName} demonstrated professionalism, technical aptitude, and a proactive approach to learning. The intern consistently met deadlines, exhibited strong problem-solving skills, and collaborated effectively with the team. Work quality was rated as <strong style="color:#0000AA;">${performanceLabel}</strong>.</p>
<p style="font-size:9.5px;font-weight:700;color:#0000AA;margin:4px 0 2px;">Key Strengths Observed</p>
<ul style="font-size:8.5px;color:#333;line-height:1.4;margin:0 0 4px;padding-left:14px;">
<li>Strong understanding of core concepts in the ${programName} domain.</li>
<li>Ability to work independently and in a team environment.</li>
<li>Excellent time management and adherence to deadlines.</li>
<li>Willingness to learn new technologies and adapt to requirements.</li>
<li>Professional conduct and positive workplace attitude.</li>
</ul>
<p style="font-size:9.5px;font-weight:700;color:#0000AA;margin:4px 0 2px;">Recommendation</p>
<p style="font-size:8.5px;color:#333;line-height:1.45;text-align:justify;margin:0 0 6px;">Based on overall performance, we recommend <strong style="color:#0000AA;">${studentName}</strong> for any suitable professional opportunity. We wish ${studentName} all the best in future endeavours.</p>
<p style="margin:8px 0 0;font-size:9px;color:#333;">For &amp; on behalf of <strong style="color:#0000AA;">${cn}</strong>,</p>
<div style="margin-top:4px;">
${sigBlockSmall}
<p style="margin:0;font-weight:700;color:#0000AA;font-size:10px;">${esc(sigName)}</p>
<p style="margin:1px 0 0;font-size:8.5px;color:#555;">${esc(sigDesg)}</p>
<p style="margin:1px 0 0;font-size:8.5px;color:#555;">${cn}</p>
</div>
</div>
<div style="flex-shrink:0;">${FT}</div>
</div>
</div>`;

    await prisma.experienceLetter.update({ where: { id: el.id }, data: { htmlContent: html } });
    console.log(`Regenerated experience letter ${el.letterNumber} for ${e.student.name}`);
  }

  console.log("All letters regenerated with new compact template!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
