import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await request.json();
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const card = await prisma.employeeCard.findFirst({
      where: { userId: studentId },
      include: { user: { select: { name: true, email: true, phone: true, avatar: true, collegeName: true, dob: true } } },
    });

    if (!card) {
      return NextResponse.json({ error: "ID Card not found for this student" }, { status: 404 });
    }

    const settings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    for (const s of settings) sMap[s.key] = s.value;

    const siteUrl = "https://internship.kkhsmedia.com";
    const logoPath = sMap.letterhead_logo || "/uploads/kkhs-logo.png";
    const logoUrl = logoPath.startsWith("http") ? logoPath : siteUrl + logoPath;
    const companyName = sMap.letterhead_company_name || "KKHS Media Private Limited";
    const photoSrc = card.user.avatar || card.photoUrl || "";
    const photoUrl = photoSrc && !photoSrc.startsWith("http") ? siteUrl + photoSrc : photoSrc;

    const idCardHtml = `<div style="font-family:'Segoe UI','Calibri',Arial,sans-serif;max-width:600px;margin:0 auto;">
<div style="text-align:center;margin-bottom:20px;">
  <h2 style="color:#0000AA;margin:0;">Employee ID Card</h2>
  <p style="color:#666;font-size:13px;margin:4px 0 0;">Your employee ID card details are below</p>
</div>
<div style="width:260px;margin:0 auto 20px;border-radius:12px;overflow:hidden;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid #e0e0e0;">
  <div style="background:linear-gradient(135deg,#1a365d,#2563eb);padding:12px 10px;text-align:center;">
    <img src="${logoUrl}" alt="${companyName}" style="height:28px;display:inline-block;" />
    <div style="font-size:8px;color:white;font-weight:700;margin-top:3px;letter-spacing:0.5px;">${companyName}</div>
  </div>
  <div style="text-align:center;padding:12px 0 8px;">
    ${photoUrl ? `<img src="${photoUrl}" style="width:80px;height:80px;border-radius:50%;border:3px solid #2563eb;object-fit:cover;" />` : `<div style="width:80px;height:80px;border-radius:50%;border:3px solid #2563eb;background:#f0f4ff;display:inline-block;line-height:80px;font-size:32px;color:#2563eb;">&#128100;</div>`}
  </div>
  <div style="text-align:center;padding:4px 10px;">
    <div style="font-size:14px;font-weight:800;color:#1a202c;">${card.user.name}</div>
    <span style="display:inline-block;background:#2563eb;color:white;font-size:8px;font-weight:700;padding:2px 10px;border-radius:10px;text-transform:uppercase;margin-top:4px;">${card.designation}</span>
  </div>
  <div style="padding:8px 16px 12px;">
    <div style="font-size:10px;margin-bottom:4px;"><strong style="color:#1a202c;">ID No:</strong> <span style="color:#4a5568;">${card.cardNumber}</span></div>
    <div style="font-size:10px;margin-bottom:4px;"><strong style="color:#1a202c;">Email:</strong> <span style="color:#4a5568;">${card.user.email}</span></div>
    ${card.user.phone ? `<div style="font-size:10px;margin-bottom:4px;"><strong style="color:#1a202c;">Phone:</strong> <span style="color:#4a5568;">${card.user.phone}</span></div>` : ""}
    <div style="font-size:10px;"><strong style="color:#1a202c;">Valid:</strong> <span style="color:#4a5568;">${new Date(card.validFrom).toLocaleDateString("en-IN")} - ${new Date(card.validUntil).toLocaleDateString("en-IN")}</span></div>
  </div>
</div>
<p style="text-align:center;color:#4b5563;font-size:13px;">You can also view your ID card on your <a href="${siteUrl}/dashboard/id-cards" style="color:#4f46e5;font-weight:600;">dashboard</a>.</p>
</div>`;

    const sent = await sendEmail({
      to: card.user.email,
      subject: `ID Card — ${card.user.name}`,
      html: idCardHtml,
    });

    if (sent) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Failed to send email. Check SMTP settings." }, { status: 500 });
  } catch (err) {
    console.error("[send-id-card-email] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
