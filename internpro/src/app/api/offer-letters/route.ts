import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { escapeHtml, generateUniqueId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");

  const where: Record<string, unknown> = {};
  if (enrollmentId) where.enrollmentId = enrollmentId;
  if (session.role === "student") {
    where.enrollment = { studentId: session.id };
  }

  const letters = await prisma.offerLetter.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { name: true, email: true } },
          batch: { include: { program: { select: { title: true, mode: true, duration: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(letters);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, salary, weekoffs, paidLeaves, workTiming, joiningDate, feeType, feeAmount, stipendAmount } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        batch: { include: { program: { include: { organization: true } } } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Get template and org before transaction
    const template = await prisma.offerLetterTemplate.findFirst({ where: { isDefault: true } });
    const org = enrollment.batch.program.organization;

    const letterNumber = generateUniqueId("OL");
    const cardNumber = generateUniqueId("EMP");

    const todayDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const joiningDateFormatted = joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : todayDate;
    const feeLabel = body.feeType === "paid_by_student" ? "Training Fee" : body.feeType === "stipend" ? "Monthly Stipend" : "Free";

    const defaultOfferHtml = `<div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 0; background: white; color: #222;">
<!-- Letterhead -->
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
      <td style="font-size: 12px; color: #555;">Ref: <strong style="color: #222;">{{letter_number}}</strong></td>
      <td style="text-align: right; font-size: 12px; color: #555;">Date: <strong style="color: #222;">${todayDate}</strong></td>
    </tr>
  </table>

  <div style="text-align: center; margin: 10px 0 25px;">
    <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #0000AA; letter-spacing: 3px; text-transform: uppercase;">Offer Letter</h2>
    <div style="width: 60px; height: 3px; background: #d32f2f; margin: 8px auto 0;"></div>
  </div>

  <p style="font-size: 13px; color: #333; margin: 20px 0 8px;">Dear <strong style="color: #0000AA;">{{student_name}}</strong>,</p>

  <p style="font-size: 13px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 15px;">
    We are delighted to extend this offer of internship at <strong>{{company_name}}</strong>. Based on your application and evaluation, we are pleased to offer you a position in our <strong>{{program_name}}</strong> program. We believe your skills, dedication, and enthusiasm will make a meaningful contribution to our team.
  </p>

  <p style="font-size: 14px; font-weight: 700; color: #0000AA; margin: 20px 0 8px;">Terms &amp; Conditions</p>
  <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px; font-size: 13px; border: 1px solid #ddd;">
    <tr style="background: #0000AA;"><td style="padding: 9px 14px; color: white; font-weight: 600; width: 180px; border: 1px solid #0000AA;">Particulars</td><td style="padding: 9px 14px; color: white; font-weight: 600; border: 1px solid #0000AA;">Details</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Program</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">{{program_name}}</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Duration</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">{{duration}} Days</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Joining Date</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">${joiningDateFormatted}</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Work Timing</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">{{work_timing}}</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Mode of Work</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">{{mode}}</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Stipend / Salary</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;"><strong>&#8377;{{salary}}</strong> per month</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Weekly Off</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">{{weekoffs}} day(s)</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Paid Leaves</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">{{paid_leaves}} per month</td></tr>
    <tr><td style="padding: 8px 14px; border: 1px solid #e0e0e0; font-weight: 600; color: #333; background: #fafbff;">Payment Type</td><td style="padding: 8px 14px; border: 1px solid #e0e0e0;">${feeLabel}</td></tr>
  </table>

  <p style="font-size: 13px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 8px;">
    Please confirm your acceptance of this offer by reporting on the specified joining date. Kindly carry your original identification documents on the day of joining.
  </p>
  <p style="font-size: 13px; color: #333; line-height: 1.9; text-align: justify; margin: 0 0 15px;">
    We are excited to welcome you to the {{company_name}} family and look forward to a productive association.
  </p>

  <p style="margin: 45px 0 0; font-size: 13px; color: #333;">Warm Regards,</p>
  <div style="margin-top: 30px;">
    <p style="margin: 0; font-weight: 700; color: #0000AA; font-size: 14px;">HR Department</p>
    <p style="margin: 2px 0 0; font-size: 12px; color: #555;">{{company_name}}</p>
    <p style="margin: 2px 0 0; font-size: 11px; color: #888;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
  </div>
</div>

<div style="height: 2px; background: linear-gradient(90deg, #0000AA, #0000AA 70%, #d32f2f 70%, #d32f2f); margin-top: 15px;"></div>
<div style="padding: 8px 30px; text-align: center;">
  <p style="margin: 0; font-size: 8pt; font-weight: 600; color: #0000AA;">KKHS Media Private Limited</p>
  <p style="margin: 2px 0 0; font-size: 7pt; color: #777;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012 | Phone: 9782005500 | Email: hari@kkhsmedia.com</p>
</div>
</div>`;

    let htmlContent = template?.htmlContent || defaultOfferHtml;
    htmlContent = htmlContent
      .replace(/\{\{company_name\}\}/g, escapeHtml(org.name))
      .replace(/\{\{student_name\}\}/g, escapeHtml(enrollment.student.name))
      .replace(/\{\{program_name\}\}/g, escapeHtml(enrollment.batch.program.title))
      .replace(/\{\{letter_number\}\}/g, escapeHtml(letterNumber))
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString("en-IN"))
      .replace(/\{\{joining_date\}\}/g, joiningDate ? new Date(joiningDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN"))
      .replace(/\{\{duration\}\}/g, String(enrollment.batch.program.duration))
      .replace(/\{\{salary\}\}/g, String(salary || 0))
      .replace(/\{\{weekoffs\}\}/g, String(weekoffs || 1))
      .replace(/\{\{paid_leaves\}\}/g, String(paidLeaves || 0))
      .replace(/\{\{work_timing\}\}/g, escapeHtml(workTiming || "10:00 AM - 6:00 PM"))
      .replace(/\{\{mode\}\}/g, escapeHtml(enrollment.batch.program.mode));

    const interview = await prisma.interview.findFirst({
      where: { enrollmentId },
    });

    // All DB writes in a single transaction for atomicity
    const offerLetter = await prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "selected",
          salary: salary || 0,
          weekoffs: weekoffs || 1,
          paidLeaves: paidLeaves || 0,
          workTiming: workTiming || "10:00 AM - 6:00 PM",
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          feeType: feeType || "free",
          feeAmount: feeAmount || 0,
          stipendAmount: stipendAmount || 0,
        },
      });

      const letter = await tx.offerLetter.create({
        data: {
          enrollmentId,
          letterNumber,
          htmlContent,
          templateId: template?.id,
        },
      });

      if (interview) {
        await tx.interview.update({
          where: { id: interview.id },
          data: { status: "completed", result: "selected" },
        });
      }

      await tx.employeeCard.create({
        data: {
          userId: enrollment.studentId,
          cardNumber,
          designation: `${enrollment.batch.program.title} Intern`,
          department: enrollment.batch.program.domain,
          validFrom: joiningDate ? new Date(joiningDate) : new Date(),
          validUntil: enrollment.batch.endDate,
        },
      });

      return letter;
    });

    return NextResponse.json(offerLetter, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate offer letter";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
