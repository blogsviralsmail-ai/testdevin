import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get("enrollmentId");

    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        batch: {
          include: {
            program: { include: { organization: true } },
            mentor: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const { student, batch } = enrollment;
    const { program } = batch;
    const { organization } = program;

    const offerLetterHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Offer Letter - ${student.name}</title>
  <style>
    body { font-family: 'Georgia', serif; margin: 0; padding: 40px; color: #333; }
    .container { max-width: 800px; margin: 0 auto; border: 2px solid #1a365d; padding: 50px; }
    .header { text-align: center; border-bottom: 3px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1a365d; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
    .header p { color: #666; margin: 5px 0; }
    .date { text-align: right; margin-bottom: 30px; color: #666; }
    .subject { font-weight: bold; text-align: center; font-size: 18px; margin: 20px 0; color: #1a365d; text-decoration: underline; }
    .salutation { margin: 20px 0; }
    .body p { line-height: 1.8; margin: 10px 0; text-align: justify; }
    .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    .details td:first-child { font-weight: bold; width: 40%; color: #1a365d; }
    .signature { margin-top: 50px; }
    .signature .name { font-weight: bold; color: #1a365d; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #1a365d; color: #666; font-size: 12px; }
    .stamp { display: inline-block; border: 2px solid #c53030; color: #c53030; padding: 8px 20px; transform: rotate(-5deg); font-weight: bold; font-size: 14px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${organization.name}</h1>
      ${organization.address ? `<p>${organization.address}</p>` : ""}
      ${organization.website ? `<p>${organization.website}</p>` : ""}
      ${organization.phone ? `<p>Phone: ${organization.phone}</p>` : ""}
    </div>

    <div class="date">
      <p>Date: ${formatDate(enrollment.enrolledAt)}</p>
      <p>Ref: OL/${new Date(enrollment.enrolledAt).getFullYear()}/${enrollment.id.substring(0, 6).toUpperCase()}</p>
    </div>

    <div class="subject">INTERNSHIP OFFER LETTER</div>

    <div class="salutation">
      <p>Dear <strong>${student.name}</strong>,</p>
    </div>

    <div class="body">
      <p>We are pleased to inform you that you have been selected for the <strong>${program.title}</strong> internship program at <strong>${organization.name}</strong>. We are confident that your skills and enthusiasm will be a valuable addition to our team.</p>

      <div class="details">
        <table>
          <tr><td>Program</td><td>${program.title}</td></tr>
          <tr><td>Domain</td><td>${program.domain}</td></tr>
          <tr><td>Mode</td><td>${program.mode === "online" ? "Online (Remote)" : program.mode === "offline" ? "Offline (On-site)" : "Hybrid"}</td></tr>
          <tr><td>Batch</td><td>${batch.name}</td></tr>
          <tr><td>Duration</td><td>${program.duration} days</td></tr>
          <tr><td>Start Date</td><td>${formatDate(batch.startDate)}</td></tr>
          <tr><td>End Date</td><td>${formatDate(batch.endDate)}</td></tr>
          ${batch.mentor ? `<tr><td>Mentor</td><td>${batch.mentor.name}</td></tr>` : ""}
          <tr><td>Fee Type</td><td>${program.feeType === "free" ? "Free of Cost" : program.feeType === "paid" ? `Paid - ₹${program.feeAmount}` : `Stipend: ₹${program.stipendAmount}/month`}</td></tr>
        </table>
      </div>

      <p><strong>Terms & Conditions:</strong></p>
      <p>1. You are expected to maintain a minimum attendance of 75% throughout the internship period.</p>
      <p>2. All assigned tasks and assessments must be completed within the given deadlines.</p>
      <p>3. Upon successful completion, you will receive an Internship Completion Certificate.</p>
      <p>4. Any form of misconduct or violation of company policies may result in termination of the internship.</p>
      ${program.feeType === "stipend" ? `<p>5. Stipend of ₹${program.stipendAmount}/month will be disbursed based on your attendance and performance.</p>` : ""}

      <p>We look forward to having you as part of our team. Please confirm your acceptance by joining the batch on the start date mentioned above.</p>
    </div>

    <div class="signature">
      <p>Best Regards,</p>
      <br/>
      <p class="name">${organization.name}</p>
      <p>Internship Program Management</p>
      <div class="stamp">APPROVED</div>
    </div>

    <div class="footer">
      <p>This is a computer-generated offer letter and does not require a physical signature.</p>
      <p>Generated by InternPro - Internship Management Platform</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(offerLetterHTML, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate offer letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
