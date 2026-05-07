import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function escapeHtml(s: string) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");
  if (!enrollmentId) return NextResponse.json({ error: "Enrollment ID required" }, { status: 400 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { select: { name: true } },
      batch: { include: { program: { select: { title: true, duration: true } } } },
      certificates: { where: { type: "completion" }, take: 1 },
    },
  });

  if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const lhLogo = sMap.letterhead_logo || "/uploads/kkhs-logo-new.png";
  const lhCompany = sMap.letterhead_company_name || "KKHS Media Private Limited";
  const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
  const lhPhone = sMap.letterhead_phone || "9782005500";
  const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
  const sigImage = sMap.admin_signature || sMap.signature_image || "";
  const sigName = sMap.signatory_name || "Hari Soni";
  const sigDesignation = sMap.signatory_designation || "Director";

  const studentName = escapeHtml(enrollment.student.name);
  const programName = escapeHtml(enrollment.batch.program.title);
  const cn = escapeHtml(lhCompany);

  const startDate = new Date(enrollment.batch.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const endDate = enrollment.completedAt
    ? new Date(enrollment.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : new Date(enrollment.batch.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const cert = enrollment.certificates[0];
  const refNo = cert?.certNumber || `KKHS/HR/IC/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}/${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;
  const issueDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const sigBlock = sigImage ? `<img src="${sigImage}" style="height:50px;display:block;margin:0 auto 4px;" />` : `<div style="height:50px;"></div>`;

  // Landscape A4: 297mm x 210mm
  const html = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="width:297mm;height:210mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;overflow:hidden;">

<!-- Outer decorative border -->
<div style="position:absolute;inset:8px;border:3px solid #0000AA;border-radius:4px;"></div>
<div style="position:absolute;inset:14px;border:2px solid #c9a84c;border-radius:2px;"></div>

<!-- Corner snowflakes -->
<div style="position:absolute;top:20px;left:22px;font-size:36px;color:#c9a84c;">❄</div>
<div style="position:absolute;top:20px;right:22px;font-size:36px;color:#c9a84c;">❄</div>
<div style="position:absolute;bottom:20px;left:22px;font-size:36px;color:#c9a84c;">❄</div>
<div style="position:absolute;bottom:20px;right:22px;font-size:36px;color:#c9a84c;">❄</div>

<!-- Ref & Date -->
<div style="position:absolute;top:28px;right:40px;font-size:11px;color:#666;">Ref: ${escapeHtml(refNo)} &nbsp;|&nbsp; Date: ${issueDate}</div>

<!-- Content -->
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:30px 60px;text-align:center;">

<!-- Logo -->
<img src="${lhLogo}" alt="${cn}" style="height:80px;margin-bottom:12px;object-fit:contain;" />

<!-- Title -->
<h1 style="margin:0;font-size:52px;font-weight:700;color:#0000AA;letter-spacing:8px;text-transform:uppercase;">CERTIFICATE</h1>
<p style="margin:4px 0 20px;font-size:18px;font-weight:600;color:#c9a84c;letter-spacing:6px;text-transform:uppercase;">OF INTERNSHIP</p>

<!-- Subtitle -->
<p style="margin:0 0 10px;font-size:15px;color:#555;">This internship program is presented to</p>

<!-- Student Name -->
<h2 style="margin:0;font-size:44px;font-weight:700;color:#222;font-style:italic;padding:0 20px;">${studentName}</h2>
<div style="width:280px;height:2px;background:#c9a84c;margin:8px auto 20px;"></div>

<!-- Description -->
<p style="margin:0;font-size:14px;color:#444;line-height:1.7;max-width:700px;">
We want to show the utmost respect for the service and valuable contributions you&rsquo;ve rendered during your <strong>${programName} Internship</strong> at <strong style="color:#0000AA;">${cn}</strong> from <strong style="color:#c9a84c;">${startDate}</strong> to <strong style="color:#c9a84c;">${endDate}</strong>, and with sincere gratitude, we offer this certificate.
</p>

<!-- Signature & Badge -->
<div style="display:flex;align-items:flex-end;justify-content:center;gap:80px;margin-top:30px;">
<div style="text-align:center;">
<p style="margin:0 0 4px;font-size:12px;color:#666;">For ${cn}</p>
${sigBlock}
<div style="width:180px;height:1px;background:#333;margin:0 auto 4px;"></div>
<p style="margin:0;font-size:15px;font-weight:700;color:#222;">${escapeHtml(sigName)}</p>
<p style="margin:2px 0 0;font-size:12px;color:#666;">${escapeHtml(sigDesignation)}</p>
</div>
<div style="text-align:center;">
<div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#0000AA,#4444cc);display:flex;align-items:center;justify-content:center;margin:0 auto;">
<span style="color:#c9a84c;font-size:32px;">★</span>
</div>
</div>
</div>

<!-- Footer -->
<p style="margin:20px 0 0;font-size:10px;color:#888;">${cn} | ${escapeHtml(lhAddress)} | Mob: ${escapeHtml(lhPhone)} | Email: ${escapeHtml(lhEmail)}</p>

</div>
</div>
</div>`;

  return NextResponse.json({ html, studentName: enrollment.student.name, programName: enrollment.batch.program.title, refNo });
}
