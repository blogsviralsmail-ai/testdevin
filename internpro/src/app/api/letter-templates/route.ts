import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const DEFAULT_EXP_TEMPLATE = `<div style="font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; border: 2px solid #1e1b4b; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
    <h1 style="color: #1e1b4b; font-size: 28px; margin: 0;">{{company_name}}</h1>
    <p style="color: #64748b; margin: 4px 0;">{{company_address}}</p>
    <h2 style="color: #374151; margin-top: 16px; font-size: 20px; letter-spacing: 2px;">EXPERIENCE / COMPLETION CERTIFICATE</h2>
  </div>
  <p style="color: #6b7280; font-size: 14px;"><strong>Ref No:</strong> {{letter_number}} &nbsp;&nbsp; <strong>Date:</strong> {{date}}</p>
  <p style="color: #374151; margin-top: 24px; font-size: 16px;">To Whom It May Concern,</p>
  <p style="color: #374151; line-height: 1.8; font-size: 15px;">This is to certify that <strong>{{student_name}}</strong> has successfully completed the <strong>{{program_name}}</strong> internship program at <strong>{{company_name}}</strong>.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr><td style="padding: 10px 14px; border: 1px solid #e5e7eb; background: #f9fafb; color: #6b7280; width: 40%;">Program</td><td style="padding: 10px 14px; border: 1px solid #e5e7eb; color: #111827;">{{program_name}}</td></tr>
    <tr><td style="padding: 10px 14px; border: 1px solid #e5e7eb; background: #f9fafb; color: #6b7280;">Duration</td><td style="padding: 10px 14px; border: 1px solid #e5e7eb; color: #111827;">{{duration}} days</td></tr>
    <tr><td style="padding: 10px 14px; border: 1px solid #e5e7eb; background: #f9fafb; color: #6b7280;">Period</td><td style="padding: 10px 14px; border: 1px solid #e5e7eb; color: #111827;">{{start_date}} to {{end_date}}</td></tr>
    <tr><td style="padding: 10px 14px; border: 1px solid #e5e7eb; background: #f9fafb; color: #6b7280;">Performance</td><td style="padding: 10px 14px; border: 1px solid #e5e7eb; color: #111827; text-transform: capitalize;">{{category}}</td></tr>
  </table>
  <p style="color: #374151; line-height: 1.8; font-size: 15px;">During the internship, {{student_name}} demonstrated dedication and commitment. We wish them all the best in their future endeavors.</p>
  <div style="margin-top: 60px;">
    <p style="color: #374151; margin: 0;">Authorized Signatory</p>
    <p style="color: #1e1b4b; font-weight: 700; margin: 4px 0;">{{company_name}}</p>
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
