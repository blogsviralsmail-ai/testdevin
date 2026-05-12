const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient({
  datasources: { db: { url: "file:/var/www/internpro/internpro/prisma/dev.db" } },
});

function genId() {
  return crypto.randomBytes(12).toString("hex");
}

function generateCertNumber() {
  const year = new Date().getFullYear();
  const bytes = crypto.randomBytes(8);
  const random = Array.from(bytes).map(b => b.toString(36)).join("").substring(0, 12).toUpperCase();
  return `IP-${year}-${random}`;
}

async function main() {
  // Check if Deepak already exists
  const existing = await prisma.user.findUnique({ where: { email: "deepak@internpro.com" } });
  if (existing) {
    console.log("Deepak already exists:", existing.id);
    return;
  }

  const password = await bcrypt.hash("student123", 12);

  // Get batch and program info
  const batch = await prisma.batch.findFirst({ where: { name: "Batch 2025-A" } });
  if (!batch) {
    console.error("Batch 2025-A not found!");
    return;
  }
  const program = await prisma.program.findUnique({ where: { id: batch.programId } });
  const org = await prisma.organization.findFirst();

  // Get settings for letterhead
  const settings = await prisma.setting.findMany();
  const sMap = {};
  for (const s of settings) sMap[s.key] = s.value;
  const lhLogo = sMap.letterhead_logo || "/kkhs-logo.png";
  const lhCompany = sMap.letterhead_company || "KKHS Media Private Limited";
  const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
  const lhPhone = sMap.letterhead_phone || "9782005500";
  const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
  const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";
  const sigImage = sMap.signature_image || "";
  const sigName = sMap.signatory_name || "Hari Soni";
  const sigDesignation = sMap.signatory_designation || "Director";

  console.log("Creating Deepak Yadav...");

  // 1. Create user
  const userId = genId();
  const user = await prisma.user.create({
    data: {
      id: userId,
      name: "Deepak Yadav",
      email: "deepak@internpro.com",
      password,
      phone: "+91 9876543210",
      role: "student",
      collegeName: "Rajasthan Technical University",
      dob: new Date("2002-03-15"),
      address: "45, Malviya Nagar, Jaipur, Rajasthan 302017",
    },
  });
  console.log("User created:", user.id);

  // 2. Create enrollment (completed)
  const enrollmentId = genId();
  const enrollment = await prisma.enrollment.create({
    data: {
      id: enrollmentId,
      studentId: userId,
      batchId: batch.id,
      status: "completed",
      adminApproved: true,
      completedAt: new Date(),
    },
  });
  console.log("Enrollment created:", enrollment.id);

  // 3. Create Employee Card
  const card = await prisma.employeeCard.create({
    data: {
      userId,
      cardNumber: "EMP-2025-002",
      designation: "Web Development Intern",
      validFrom: new Date("2025-01-15"),
      validUntil: new Date("2025-12-31"),
    },
  });
  console.log("Employee Card created:", card.cardNumber);

  // Letterhead HTML helper
  const LH = `<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px 10px;border-bottom:2px solid #0000AA;">
<div style="flex-shrink:0;"><img src="${lhLogo}" style="height:164px;" alt="Logo"/></div>
<div style="text-align:right;">
<div style="font-size:28px;font-weight:800;color:#0000AA;font-family:Calibri,Arial,sans-serif;">${lhCompany}</div>
<div style="font-size:16px;color:#333;margin-top:2px;">${lhAddress}</div>
<div style="font-size:16px;color:#555;margin-top:2px;">Phone: ${lhPhone} | Email: ${lhEmail} | GST: ${lhGst}</div>
</div></div>`;

  const FT = `<div style="border-top:2px solid #0000AA;padding:8px 20px;text-align:center;">
<div style="font-size:14px;color:#666;">© ${new Date().getFullYear()} ${lhCompany} | ${lhAddress}</div>
<div style="font-size:12px;color:#999;margin-top:2px;">Phone: ${lhPhone} | Email: ${lhEmail}</div>
</div>`;

  const sigBlock = `<div style="margin-top:20px;">
${sigImage ? `<img src="${sigImage}" style="height:60px;margin-bottom:4px;" alt="Signature"/>` : ""}
<div style="font-size:18px;font-weight:700;color:#1a202c;">${sigName}</div>
<div style="font-size:14px;color:#555;">${sigDesignation}</div>
<div style="font-size:13px;color:#555;">${lhCompany}</div>
</div>`;

  // 4. Create Offer Letter (2-page A4)
  const offerLetterNumber = "OL-2026-DY001";
  const offerHtml = `<div class="a4-page" style="width:210mm;min-height:297mm;display:flex;flex-direction:column;font-family:Calibri,Arial,sans-serif;box-sizing:border-box;">
${LH}
<div class="page-content" style="flex:1;padding:20px 36px 10px;">
<h2 style="text-align:center;font-size:30px;color:#0000AA;margin:18px 0 14px;font-weight:800;">OFFER LETTER</h2>
<p style="font-size:15px;color:#555;margin-bottom:4px;">Ref: ${offerLetterNumber} | Date: ${new Date().toLocaleDateString("en-IN")}</p>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:8px;">Dear <strong>Deepak Yadav</strong>,</p>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:12px;">We are pleased to offer you the position of <strong>Web Development Intern</strong> at <strong>${lhCompany}</strong>. This letter confirms your selection for our internship program.</p>

<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;width:35%;">Program</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">${program.title}</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Duration</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">${program.duration} Days</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Position</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">Web Development Intern</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Joining Date</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">15 January 2025</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Work Hours</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">10:00 AM - 5:00 PM (Mon-Sat)</td></tr>
</table>

<h3 style="font-size:14px;color:#0000AA;margin:14px 0 6px;">1. Reporting & Probation</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:8px;">You will report to the assigned Team Leader. The first 15 days of the internship will be treated as a probation period during which your performance, attendance, and conduct will be evaluated.</p>

<h3 style="font-size:14px;color:#0000AA;margin:14px 0 6px;">2. Code of Conduct</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:8px;">You are expected to maintain professional decorum at all times. Any form of misconduct, dishonesty, or violation of company policies may result in immediate termination.</p>

<h3 style="font-size:14px;color:#0000AA;margin:14px 0 6px;">3. Confidentiality & NDA</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:8px;">You agree to maintain strict confidentiality of all proprietary information, trade secrets, and client data of ${lhCompany}. This obligation survives termination.</p>
</div>
${FT}
</div>

<div class="a4-page" style="width:210mm;min-height:297mm;display:flex;flex-direction:column;font-family:Calibri,Arial,sans-serif;box-sizing:border-box;page-break-before:always;">
${LH}
<div class="page-content" style="flex:1;padding:20px 36px 10px;">
<h3 style="font-size:14px;color:#0000AA;margin:14px 0 6px;">4. Intellectual Property</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:8px;">Any work, code, designs, or content created by you during the internship shall be the exclusive property of ${lhCompany}.</p>

<h3 style="font-size:14px;color:#0000AA;margin:14px 0 6px;">5. Termination</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:8px;">Either party may terminate this arrangement with 7 days written notice. The company reserves the right to terminate immediately in case of gross misconduct.</p>

<h3 style="font-size:14px;color:#0000AA;margin:14px 0 6px;">6. General Terms</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:8px;">This offer is subject to verification of your credentials and educational qualifications. Please carry original documents on your joining date.</p>

<h3 style="font-size:14px;color:#0000AA;margin:14px 0 6px;">7. Acceptance</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:12px;">Please sign and return this letter within 7 days to confirm your acceptance.</p>

<div style="margin-top:22px;">
<p style="font-size:13px;color:#333;">We look forward to having you on our team.</p>
<p style="font-size:13px;color:#333;margin-top:12px;">Warm regards,</p>
${sigBlock}
</div>

<div style="margin-top:30px;border-top:1px dashed #ccc;padding-top:14px;">
<p style="font-size:14px;font-weight:700;color:#0000AA;margin-bottom:8px;">Intern's Acceptance</p>
<p style="font-size:13px;color:#333;">I, <strong>Deepak Yadav</strong>, accept this offer and agree to the terms.</p>
<div style="display:flex;gap:40px;margin-top:16px;">
<div><p style="font-size:13px;color:#333;">Signature: _______________</p></div>
<div><p style="font-size:13px;color:#333;">Date: _______________</p></div>
</div>
</div>
</div>
${FT}
</div>`;

  const offerLetter = await prisma.offerLetter.create({
    data: {
      enrollmentId,
      letterNumber: offerLetterNumber,
      htmlContent: offerHtml,
    },
  });
  console.log("Offer Letter created:", offerLetter.letterNumber);

  // 5. Create Experience Letter (1-page A4)
  const expLetterNumber = "EXP-2026-DY001";
  const expHtml = `<div class="a4-page" style="width:210mm;min-height:297mm;display:flex;flex-direction:column;font-family:Calibri,Arial,sans-serif;box-sizing:border-box;">
${LH}
<div class="page-content" style="flex:1;padding:20px 36px 10px;">
<h2 style="text-align:center;font-size:30px;color:#0000AA;margin:18px 0 14px;font-weight:800;">EXPERIENCE CERTIFICATE</h2>
<p style="font-size:15px;color:#555;margin-bottom:6px;">Ref: ${expLetterNumber} | Date: ${new Date().toLocaleDateString("en-IN")}</p>
<p style="font-size:13px;color:#333;margin-bottom:4px;">To Whom It May Concern,</p>

<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:10px;">This is to certify that <strong>Deepak Yadav</strong> has successfully completed the <strong>${program.title}</strong> internship program at <strong>${lhCompany}</strong>.</p>

<h3 style="font-size:14px;color:#0000AA;margin:12px 0 6px;">Performance Summary</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:10px;">During the internship, Deepak demonstrated excellent technical skills and a strong work ethic. He showed consistent dedication and produced high-quality work across all assigned projects.</p>

<h3 style="font-size:14px;color:#0000AA;margin:12px 0 6px;">Key Strengths Observed</h3>
<ul style="font-size:13px;color:#333;line-height:1.45;padding-left:20px;margin-bottom:10px;">
<li style="margin-bottom:5px;">Strong proficiency in HTML, CSS, JavaScript, and React.js</li>
<li style="margin-bottom:5px;">Excellent problem-solving abilities with clean code practices</li>
<li style="margin-bottom:5px;">Good communication and collaboration with team members</li>
<li style="margin-bottom:5px;">Consistent punctuality and professional conduct</li>
<li style="margin-bottom:5px;">Quick learner with proactive approach to challenges</li>
</ul>

<h3 style="font-size:14px;color:#0000AA;margin:12px 0 6px;">Recommendation</h3>
<p style="font-size:13px;color:#333;line-height:1.45;margin-bottom:10px;">We highly recommend Deepak Yadav for any future opportunities in web development. His dedication and skills will be an asset to any organization.</p>

<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;width:35%;">Program</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">${program.title}</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Duration</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">${program.duration} Days</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Period</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">15 January 2025 — ${new Date().toLocaleDateString("en-IN")}</td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Performance</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;"><strong style="color:green;">Excellent</strong></td></tr>
<tr><td style="padding:5px 8px;border:1px solid #ddd;font-weight:700;font-size:13px;background:#f8f9fa;">Remarks</td><td style="padding:5px 8px;border:1px solid #ddd;font-size:13px;">Outstanding performance in all tasks and assignments</td></tr>
</table>

<p style="font-size:13px;color:#333;line-height:1.45;margin-top:10px;">We wish Deepak Yadav all the best in his future endeavors.</p>

${sigBlock}
<p style="font-size:13px;color:#555;margin-top:4px;">Authorized Signatory</p>
<p style="font-size:13px;color:#555;">${lhCompany}</p>
</div>
${FT}
</div>`;

  const expLetter = await prisma.experienceLetter.create({
    data: {
      enrollmentId,
      letterNumber: expLetterNumber,
      category: "excellent",
      htmlContent: expHtml,
    },
  });
  console.log("Experience Letter created:", expLetter.letterNumber);

  // 6. Create Internship Certificate
  const certNumber = generateCertNumber();
  const cert = await prisma.certificate.create({
    data: {
      enrollmentId,
      certNumber,
      type: "completion",
      studentName: "Deepak Yadav",
      programName: program.title,
      orgName: org ? org.name : "KKHS Media Private Limited",
    },
  });
  console.log("Certificate created:", cert.certNumber);

  console.log("\nDone! Deepak Yadav account ready:");
  console.log("  Email: deepak@internpro.com");
  console.log("  Password: student123");
  console.log("  Enrollment: completed");
  console.log("  Offer Letter:", offerLetterNumber);
  console.log("  Experience Letter:", expLetterNumber);
  console.log("  ID Card: EMP-2025-002");
  console.log("  Certificate:", certNumber);
}

main().catch(console.error).finally(() => prisma.$disconnect());
