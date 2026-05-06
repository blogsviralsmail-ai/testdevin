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

    const defaultOfferHtml = `<div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 0; border: 2px solid #1a237e;">
<div style="background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); padding: 20px 40px; display: flex; align-items: center; gap: 16px;">
  <img src="/uploads/kkhs-logo-new.jpg" alt="KKHS Media" style="height: 60px; background: white; padding: 4px; border-radius: 6px;" />
  <div>
    <h1 style="margin: 0; color: white; font-size: 22px; letter-spacing: 2px;">KKHS MEDIA PRIVATE LIMITED</h1>
    <p style="margin: 2px 0 0; color: rgba(255,255,255,0.8); font-size: 11px;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
  </div>
</div>
<div style="height: 4px; background: linear-gradient(to right, #d32f2f, #1a237e);"></div>
<div style="padding: 40px 50px;">
  <div style="text-align: right; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 13px; color: #555;">Ref: <strong>{{letter_number}}</strong></p>
    <p style="margin: 4px 0 0; font-size: 13px; color: #555;">Date: ${todayDate}</p>
  </div>
  <h2 style="text-align: center; color: #1a237e; font-size: 24px; margin: 30px 0; letter-spacing: 3px; border-bottom: 2px solid #1a237e; padding-bottom: 10px;">OFFER LETTER</h2>
  <p style="font-size: 14px; color: #333;">Dear <strong style="color: #1a237e;">{{student_name}}</strong>,</p>
  <p style="font-size: 14px; color: #333; line-height: 1.8; text-align: justify;">
    We are pleased to offer you the position of <strong>Intern</strong> in the <strong>{{program_name}}</strong> program at 
    <strong>{{company_name}}</strong>. We are confident that your skills and enthusiasm will be valuable to our team.
  </p>
  <h3 style="color: #1a237e; margin-top: 25px; font-size: 16px;">Terms & Conditions:</h3>
  <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
    <tr style="background: #f5f5f5;"><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; width: 180px; color: #1a237e;">Program</td><td style="padding: 10px 15px; border: 1px solid #ddd;">{{program_name}}</td></tr>
    <tr><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Duration</td><td style="padding: 10px 15px; border: 1px solid #ddd;">{{duration}} Days</td></tr>
    <tr style="background: #f5f5f5;"><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Joining Date</td><td style="padding: 10px 15px; border: 1px solid #ddd;">${joiningDateFormatted}</td></tr>
    <tr><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Work Timing</td><td style="padding: 10px 15px; border: 1px solid #ddd;">{{work_timing}}</td></tr>
    <tr style="background: #f5f5f5;"><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Mode</td><td style="padding: 10px 15px; border: 1px solid #ddd;">{{mode}}</td></tr>
    <tr><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Stipend / Salary</td><td style="padding: 10px 15px; border: 1px solid #ddd;">₹{{salary}}/month</td></tr>
    <tr style="background: #f5f5f5;"><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Weekly Off</td><td style="padding: 10px 15px; border: 1px solid #ddd;">{{weekoffs}} day(s)</td></tr>
    <tr><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Paid Leaves</td><td style="padding: 10px 15px; border: 1px solid #ddd;">{{paid_leaves}} per month</td></tr>
    <tr style="background: #f5f5f5;"><td style="padding: 10px 15px; border: 1px solid #ddd; font-weight: bold; color: #1a237e;">Payment Type</td><td style="padding: 10px 15px; border: 1px solid #ddd;">${feeLabel}</td></tr>
  </table>
  <p style="font-size: 14px; color: #333; line-height: 1.8; text-align: justify;">
    Please confirm your acceptance of this offer by joining on the specified date. We look forward to having you on our team.
  </p>
  <div style="margin-top: 60px;">
    <p style="margin: 0; font-size: 14px; color: #333;">Best Regards,</p>
    <div style="margin-top: 40px;">
      <p style="margin: 0; font-weight: bold; color: #1a237e; font-size: 15px;">HR Department</p>
      <p style="margin: 4px 0 0; font-size: 13px; color: #555;">{{company_name}}</p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #888;">190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012</p>
    </div>
  </div>
</div>
<div style="height: 4px; background: linear-gradient(to right, #1a237e, #d32f2f);"></div>
<div style="background: #1a237e; padding: 12px 40px; text-align: center;">
  <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 11px;">Phone: 9782005500 | Email: hari@kkhsmedia.com | GST: 08AAICK3853C1ZL</p>
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
