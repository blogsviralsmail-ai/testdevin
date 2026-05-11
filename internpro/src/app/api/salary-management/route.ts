import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifySalaryGenerated, notifySalaryPaid } from "@/lib/notifications";

// GET: List all salaries with enrollment info
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const action = searchParams.get("action");

  // Auto-generate salaries for a month
  if (action === "generate" && month && ["admin", "organization"].includes(session.role)) {
    return generateSalaries(month);
  }

  const where: Record<string, unknown> = {};
  if (month) where.month = month;

  if (!["admin", "organization"].includes(session.role)) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: session.id, status: { in: ["selected", "active", "completed"] } },
    });
    if (enrollment) where.enrollmentId = enrollment.id;
    else return NextResponse.json([]);
  }

  const salaries = await prisma.salary.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, email: true, phone: true, employeeId: true } },
          batch: { include: { program: { select: { title: true, stipendAmount: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(salaries);
}

async function generateSalaries(month: string) {
  // month format: "2026-05"
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Get all active enrollments with stipend
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: { in: ["selected", "active"] },
      batch: { program: { stipendAmount: { gt: 0 } } },
    },
    include: {
      student: { select: { id: true, name: true } },
      batch: { include: { program: { select: { title: true, stipendAmount: true } } } },
    },
  });

  const results = [];
  for (const enrollment of enrollments) {
    // Check if salary already exists
    const existing = await prisma.salary.findUnique({
      where: { enrollmentId_month: { enrollmentId: enrollment.id, month } },
    });
    if (existing) { results.push({ id: existing.id, status: "exists" }); continue; }

    // Count attendance days
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);
    const attendances = await prisma.attendance.count({
      where: {
        enrollmentId: enrollment.id,
        date: { gte: startOfMonth, lte: endOfMonth },
        status: "present",
      },
    });

    // Count approved leaves
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        userId: enrollment.studentId,
        status: "approved",
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
    });
    let leaveDays = 0;
    for (const leave of approvedLeaves) {
      const ls = leave.startDate < startOfMonth ? startOfMonth : leave.startDate;
      const le = leave.endDate > endOfMonth ? endOfMonth : leave.endDate;
      leaveDays += Math.ceil((le.getTime() - ls.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const paidDays = attendances + Math.min(leaveDays, enrollment.paidLeaves || 0);
    const stipend = enrollment.batch.program.stipendAmount || 0;
    const dailyRate = stipend / daysInMonth;
    const amount = Math.round(dailyRate * paidDays);

    const salary = await prisma.salary.create({
      data: {
        enrollmentId: enrollment.id,
        month,
        amount,
        attendanceDays: attendances,
        totalDays: daysInMonth,
        status: "pending",
      },
    });

    // Auto-generate payslip
    await prisma.payslip.create({
      data: {
        salaryId: salary.id,
        enrollmentId: enrollment.id,
        userId: enrollment.studentId,
        month: monthStr,
        year,
        basicPay: amount,
        allowances: 0,
        deductions: 0,
        bonus: 0,
        netPay: amount,
        workingDays: daysInMonth,
        presentDays: attendances,
        leaveDays,
        status: "generated",
      },
    });

    // Notify student about salary generation
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const studentUser = await prisma.user.findUnique({ where: { id: enrollment.studentId }, select: { id: true, email: true, name: true } });
    if (studentUser) {
      notifySalaryGenerated(studentUser.id, studentUser.email, studentUser.name, `${MONTHS[monthNum - 1]} ${year}`, amount).catch(() => {});
    }

    results.push({ id: salary.id, student: enrollment.student.name, amount, status: "generated" });
  }

  return NextResponse.json({ generated: results.length, results });
}

// POST: Pay salary (manual or payout)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { salaryId, paymentMethod, paymentRef } = body;

  if (!salaryId) return NextResponse.json({ error: "Salary ID required" }, { status: 400 });

  const salary = await prisma.salary.update({
    where: { id: salaryId },
    data: { status: "paid", paidAt: new Date() },
    include: { enrollment: { include: { student: { select: { id: true, email: true, name: true } } } } },
  });

  // Update payslip
  await prisma.payslip.updateMany({
    where: { salaryId },
    data: { status: "paid", paymentMethod: paymentMethod || "manual", paymentRef: paymentRef || null, paidAt: new Date() },
  });

  // Notify student about salary payment
  if (salary.enrollment?.student) {
    const s = salary.enrollment.student;
    notifySalaryPaid(s.id, s.email, s.name, salary.month, salary.amount, paymentMethod || "manual").catch(() => {});
  }

  return NextResponse.json(salary);
}

// PATCH: Update salary amount/bonus
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { salaryId, amount, bonus, deductions } = body;

  if (!salaryId) return NextResponse.json({ error: "Salary ID required" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (amount !== undefined) updateData.amount = amount;

  const salary = await prisma.salary.update({ where: { id: salaryId }, data: updateData });

  // Update payslip too
  const payslipUpdate: Record<string, unknown> = {};
  if (amount !== undefined) payslipUpdate.basicPay = amount;
  if (bonus !== undefined) payslipUpdate.bonus = bonus;
  if (deductions !== undefined) payslipUpdate.deductions = deductions;
  if (Object.keys(payslipUpdate).length > 0) {
    const netPay = (amount || salary.amount) + (bonus || 0) - (deductions || 0);
    payslipUpdate.netPay = netPay;
    await prisma.payslip.updateMany({ where: { salaryId }, data: payslipUpdate });
  }

  return NextResponse.json(salary);
}
