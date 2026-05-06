import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const DEFAULT_EXP_TEMPLATE = `<div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 0; border: 1px solid #ccc;">
  <!-- Letterhead -->
  <div style="padding: 20px 40px; border-bottom: 3px solid #0000AA;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 160px; vertical-align: middle;"><img src="/uploads/kkhs-logo.png" style="width: 150px; height: auto;" alt="Company Logo" /></td>
        <td style="text-align: right; vertical-align: middle;">
          <div style="font-weight: bold; color: #0000AA; font-size: 14px; line-height: 1.6;">
            {{company_name}}<br/>
            <span style="font-weight: normal; font-size: 12px; color: #333;">{{company_address}}</span><br/>
            <span style="font-weight: normal; font-size: 12px; color: #333;">Mob: {{company_phone}} | Email: {{company_email}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>
  <!-- Body -->
  <div style="padding: 30px 40px;">
    <h2 style="text-align: center; color: #0000AA; font-size: 22px; letter-spacing: 2px; margin-bottom: 24px; text-decoration: underline;">EXPERIENCE / COMPLETION CERTIFICATE</h2>
    <p style="color: #555; font-size: 13px;"><strong>Ref No:</strong> {{letter_number}} &nbsp;&nbsp;&nbsp; <strong>Date:</strong> {{date}}</p>
    <p style="color: #222; margin-top: 24px; font-size: 15px;">To Whom It May Concern,</p>
    <p style="color: #222; line-height: 1.8; font-size: 15px; text-align: justify;">This is to certify that <strong>{{student_name}}</strong> has successfully completed the <strong>{{program_name}}</strong> internship program at <strong>{{company_name}}</strong>.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 10px 14px; border: 1px solid #ddd; background: #f5f5f5; color: #555; width: 40%; font-size: 14px;">Program</td><td style="padding: 10px 14px; border: 1px solid #ddd; color: #111; font-size: 14px;">{{program_name}}</td></tr>
      <tr><td style="padding: 10px 14px; border: 1px solid #ddd; background: #f5f5f5; color: #555; font-size: 14px;">Duration</td><td style="padding: 10px 14px; border: 1px solid #ddd; color: #111; font-size: 14px;">{{duration}} days</td></tr>
      <tr><td style="padding: 10px 14px; border: 1px solid #ddd; background: #f5f5f5; color: #555; font-size: 14px;">Period</td><td style="padding: 10px 14px; border: 1px solid #ddd; color: #111; font-size: 14px;">{{start_date}} to {{end_date}}</td></tr>
      <tr><td style="padding: 10px 14px; border: 1px solid #ddd; background: #f5f5f5; color: #555; font-size: 14px;">Performance</td><td style="padding: 10px 14px; border: 1px solid #ddd; color: #111; font-size: 14px; text-transform: capitalize;">{{category}}</td></tr>
    </table>
    <p style="color: #222; line-height: 1.8; font-size: 15px; text-align: justify;">During the internship period, {{student_name}} demonstrated sincerity, dedication, and a strong willingness to learn. We appreciate the contribution and wish them all the very best in their future professional endeavors.</p>
    <div style="margin-top: 60px;">
      <p style="color: #222; margin: 0; font-size: 14px;">For <strong>{{company_name}}</strong></p>
      <div style="margin-top: 40px;">
        <p style="color: #222; margin: 0; font-weight: bold; font-size: 14px;">Authorized Signatory</p>
      </div>
    </div>
  </div>
  <!-- Footer -->
  <div style="padding: 10px 40px; border-top: 2px solid #0000AA; background: #f9f9f9; text-align: center;">
    <p style="color: #888; font-size: 11px; margin: 0;">This is a computer-generated document. Verify at {{verify_url}}</p>
  </div>
</div>`;

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-seed default experience template if none exists
  const expCount = await prisma.offerLetterTemplate.count({ where: { type: "experience" } });
  if (expCount === 0) {
    await prisma.offerLetterTemplate.create({
      data: { name: "Default Experience Letter", type: "experience", htmlContent: DEFAULT_EXP_TEMPLATE, isDefault: true },
    });
  }

  const templates = await prisma.offerLetterTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, htmlContent, isDefault, type } = body;

    if (!name || !htmlContent) {
      return NextResponse.json({ error: "Name and HTML content are required" }, { status: 400 });
    }

    if (isDefault) {
      await prisma.offerLetterTemplate.updateMany({
        where: { isDefault: true, type: type || "offer" },
        data: { isDefault: false },
      });
    }

    const template = await prisma.offerLetterTemplate.create({
      data: { name, htmlContent, isDefault: isDefault || false, type: type || "offer" },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
