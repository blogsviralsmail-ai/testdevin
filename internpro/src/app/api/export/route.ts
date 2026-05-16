import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object") return JSON.stringify(val).replace(/"/g, '""');
  return String(val).replace(/"/g, '""');
}

function buildCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(h => `"${h}"`).join(",");
  const dataLines = rows.map(row => row.map(v => `"${escapeCSV(v)}"`).join(","));
  return [headerLine, ...dataLines].join("\n");
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + " " + date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = ["admin", "organization"].includes(session.role);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "students";
  const format = searchParams.get("format") || "csv";

  let headers: string[] = [];
  let rows: string[][] = [];
  let jsonData: Record<string, unknown>[] = [];
  let filename = "";

  switch (type) {
    case "students": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const enrollments = await prisma.enrollment.findMany({
        include: {
          student: { include: { referredBy: { include: { agent: { include: { user: { select: { name: true, email: true } } } } } } } },
          batch: { include: { program: { select: { title: true, domain: true, mode: true, duration: true, feeType: true, feeAmount: true } }, leader: { select: { name: true } } } },
          offerLetter: { select: { isAccepted: true, acceptedAt: true, letterNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      headers = ["Employee ID", "Name", "Email", "Phone", "College", "Degree", "Year", "State", "Address", "DOB", "Program", "Domain", "Program Mode", "Program Duration (days)", "Program Fee Type", "Batch", "Batch Leader", "Referred By", "Referrer Email", "Referral Code", "Referral Status", "Employment Type", "Status", "Fee Type", "Fee Amount", "Stipend Amount", "Salary", "Weekoffs", "Paid Leaves", "Work Timing", "Joining Date", "Preferred Mode", "Payment Status", "Current Work Day", "Admin Approved", "Admin Remarks", "TL Category", "TL Remarks", "Offer Letter #", "Offer Accepted", "Offer Accepted At", "Enrolled At", "Completed At", "Created At"];
      rows = enrollments.map(e => [
        e.student.employeeId || "", e.student.name, e.student.email, e.student.phone || "", e.student.collegeName || "", e.student.degree || "", e.student.year || "", e.student.state || "", e.student.address || "", formatDate(e.student.dob),
        e.batch.program.title, e.batch.program.domain, e.batch.program.mode, String(e.batch.program.duration), e.batch.program.feeType,
        e.batch.name, e.batch.leader?.name || "",
        e.student.referredBy?.[0]?.agent?.user?.name || "", e.student.referredBy?.[0]?.agent?.user?.email || "", e.student.referredBy?.[0]?.agent?.referralCode || "", e.student.referredBy?.[0]?.status || "",
        e.employmentType || "intern", e.status, e.feeType || "", String(e.feeAmount || ""), String(e.stipendAmount || ""), String(e.salary || ""), String(e.weekoffs || ""), String(e.paidLeaves || ""), e.workTiming || "", formatDate(e.joiningDate), e.preferredMode || "", e.paymentStatus, String(e.currentWorkDay),
        e.adminApproved ? "Yes" : "No", e.adminRemarks || "", e.teamLeaderCategory || "", e.teamLeaderRemarks || "",
        e.offerLetter?.letterNumber || "", e.offerLetter?.isAccepted ? "Yes" : "No", formatDateTime(e.offerLetter?.acceptedAt),
        formatDateTime(e.enrolledAt), formatDateTime(e.completedAt), formatDateTime(e.createdAt),
      ]);
      jsonData = enrollments.map(e => ({
        employeeId: e.student.employeeId || "", name: e.student.name, email: e.student.email, phone: e.student.phone || "", college: e.student.collegeName || "", degree: e.student.degree || "", year: e.student.year || "", state: e.student.state || "", address: e.student.address || "", dob: formatDate(e.student.dob),
        program: e.batch.program.title, domain: e.batch.program.domain, programMode: e.batch.program.mode, programDuration: e.batch.program.duration, programFeeType: e.batch.program.feeType,
        batch: e.batch.name, batchLeader: e.batch.leader?.name || "",
        referredBy: e.student.referredBy?.[0]?.agent?.user?.name || "", referrerEmail: e.student.referredBy?.[0]?.agent?.user?.email || "", referralCode: e.student.referredBy?.[0]?.agent?.referralCode || "", referralStatus: e.student.referredBy?.[0]?.status || "",
        status: e.status, feeType: e.feeType || "", feeAmount: e.feeAmount || 0, stipendAmount: e.stipendAmount || 0, salary: e.salary || 0, weekoffs: e.weekoffs || 0, paidLeaves: e.paidLeaves || 0, workTiming: e.workTiming || "", joiningDate: formatDate(e.joiningDate), preferredMode: e.preferredMode || "", paymentStatus: e.paymentStatus, currentWorkDay: e.currentWorkDay,
        adminApproved: e.adminApproved ? "Yes" : "No", adminRemarks: e.adminRemarks || "", tlCategory: e.teamLeaderCategory || "", tlRemarks: e.teamLeaderRemarks || "",
        offerLetterNumber: e.offerLetter?.letterNumber || "", offerAccepted: e.offerLetter?.isAccepted ? "Yes" : "No", offerAcceptedAt: formatDateTime(e.offerLetter?.acceptedAt),
        enrolledAt: formatDateTime(e.enrolledAt), completedAt: formatDateTime(e.completedAt), createdAt: formatDateTime(e.createdAt),
      }));
      filename = `students_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "applications": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const enrollments = await prisma.enrollment.findMany({
        include: {
          student: true,
          batch: { include: { program: { select: { title: true, domain: true, mode: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      headers = ["Name", "Email", "Phone", "College", "Degree", "Year", "State", "Program", "Domain", "Mode", "Batch", "Status", "Fee Type", "Fee Amount", "Stipend Amount", "Preferred Mode", "Payment Status", "Admin Approved", "Admin Remarks", "TL Category", "TL Remarks", "Applied At", "Joining Date"];
      rows = enrollments.map(e => [
        e.student.name, e.student.email, e.student.phone || "", e.student.collegeName || "", e.student.degree || "", e.student.year || "", e.student.state || "",
        e.batch.program.title, e.batch.program.domain, e.batch.program.mode, e.batch.name,
        e.status, e.feeType || "", String(e.feeAmount || ""), String(e.stipendAmount || ""), e.preferredMode || "", e.paymentStatus, e.adminApproved ? "Yes" : "No", e.adminRemarks || "", e.teamLeaderCategory || "", e.teamLeaderRemarks || "",
        formatDateTime(e.createdAt), formatDate(e.joiningDate),
      ]);
      jsonData = enrollments.map(e => ({
        name: e.student.name, email: e.student.email, phone: e.student.phone || "", college: e.student.collegeName || "", degree: e.student.degree || "", year: e.student.year || "", state: e.student.state || "",
        program: e.batch.program.title, domain: e.batch.program.domain, mode: e.batch.program.mode, batch: e.batch.name,
        status: e.status, feeType: e.feeType || "", feeAmount: e.feeAmount || 0, stipendAmount: e.stipendAmount || 0, preferredMode: e.preferredMode || "", paymentStatus: e.paymentStatus, adminApproved: e.adminApproved ? "Yes" : "No", adminRemarks: e.adminRemarks || "", tlCategory: e.teamLeaderCategory || "", tlRemarks: e.teamLeaderRemarks || "",
        appliedAt: formatDateTime(e.createdAt), joiningDate: formatDate(e.joiningDate),
      }));
      filename = `applications_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "interviews": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const interviews = await prisma.interview.findMany({
        include: {
          enrollment: { include: { student: true, batch: { include: { program: { select: { title: true } } } } } },
          interviewer: { select: { name: true, email: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });

      headers = ["Student Name", "Student Email", "Student Phone", "College", "Program", "Batch", "Interviewer", "Interviewer Email", "Scheduled At", "Duration (min)", "Mode", "Meet Link", "Location", "Status", "Feedback", "Rating", "Result", "Created At"];
      rows = interviews.map(i => [
        i.enrollment.student.name, i.enrollment.student.email, i.enrollment.student.phone || "", i.enrollment.student.collegeName || "",
        i.enrollment.batch.program.title, i.enrollment.batch.name,
        i.interviewer.name, i.interviewer.email,
        formatDateTime(i.scheduledAt), String(i.duration), i.mode, i.meetLink || "", i.location || "",
        i.status, i.feedback || "", String(i.rating || ""), i.result || "", formatDateTime(i.createdAt),
      ]);
      jsonData = interviews.map(i => ({
        studentName: i.enrollment.student.name, studentEmail: i.enrollment.student.email, studentPhone: i.enrollment.student.phone || "", college: i.enrollment.student.collegeName || "",
        program: i.enrollment.batch.program.title, batch: i.enrollment.batch.name,
        interviewer: i.interviewer.name, interviewerEmail: i.interviewer.email,
        scheduledAt: formatDateTime(i.scheduledAt), duration: i.duration, mode: i.mode, meetLink: i.meetLink || "", location: i.location || "",
        status: i.status, feedback: i.feedback || "", rating: i.rating || "", result: i.result || "", createdAt: formatDateTime(i.createdAt),
      }));
      filename = `interviews_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "users": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      headers = ["Name", "Email", "Phone", "Role", "Employee ID", "College", "Degree", "Year", "State", "Address", "DOB", "Active", "Bio", "Skills", "LinkedIn", "Portfolio", "Created At"];
      rows = users.map(u => [
        u.name, u.email, u.phone || "", u.role, u.employeeId || "", u.collegeName || "", u.degree || "", u.year || "", u.state || "", u.address || "", formatDate(u.dob), u.isActive ? "Yes" : "No", u.bio || "", u.skills || "", u.linkedinUrl || "", u.portfolioUrl || "", formatDateTime(u.createdAt),
      ]);
      jsonData = users.map(u => ({
        name: u.name, email: u.email, phone: u.phone || "", role: u.role, employeeId: u.employeeId || "", college: u.collegeName || "", degree: u.degree || "", year: u.year || "", state: u.state || "", address: u.address || "", dob: formatDate(u.dob), active: u.isActive ? "Yes" : "No", bio: u.bio || "", skills: u.skills || "", linkedin: u.linkedinUrl || "", portfolio: u.portfolioUrl || "", createdAt: formatDateTime(u.createdAt),
      }));
      filename = `users_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "agents": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const agents = await prisma.agent.findMany({
        include: {
          user: { select: { name: true, email: true, phone: true } },
          referrals: { include: { student: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Name", "Email", "Phone", "Referral Code", "Commission Rate %", "Total Earnings", "Wallet Balance", "Bank Name", "Account Number", "IFSC Code", "UPI ID", "Active", "Total Referrals", "Converted Referrals", "Created At"];
      rows = agents.map(a => [
        a.user.name, a.user.email, a.user.phone || "", a.referralCode, String(a.commissionRate), String(a.totalEarnings), String(a.walletBalance), a.bankName || "", a.accountNumber || "", a.ifscCode || "", a.upiId || "", a.isActive ? "Yes" : "No", String(a.referrals.length), String(a.referrals.filter(r => r.status === "converted").length), formatDateTime(a.createdAt),
      ]);
      jsonData = agents.map(a => ({
        name: a.user.name, email: a.user.email, phone: a.user.phone || "", referralCode: a.referralCode, commissionRate: a.commissionRate, totalEarnings: a.totalEarnings, walletBalance: a.walletBalance, bankName: a.bankName || "", accountNumber: a.accountNumber || "", ifscCode: a.ifscCode || "", upiId: a.upiId || "", active: a.isActive ? "Yes" : "No", totalReferrals: a.referrals.length, convertedReferrals: a.referrals.filter(r => r.status === "converted").length, createdAt: formatDateTime(a.createdAt),
      }));
      filename = `agents_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "team-leaders": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const tls = await prisma.user.findMany({
        where: { role: "team_leader" },
        include: { leaderBatches: { include: { program: { select: { title: true } } } } },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Name", "Email", "Phone", "Employee ID", "College", "State", "Active", "Batches Assigned", "Programs", "Created At"];
      rows = tls.map(t => [
        t.name, t.email, t.phone || "", t.employeeId || "", t.collegeName || "", t.state || "", t.isActive ? "Yes" : "No",
        String(t.leaderBatches.length), t.leaderBatches.map(b => b.program.title).join("; "), formatDateTime(t.createdAt),
      ]);
      jsonData = tls.map(t => ({
        name: t.name, email: t.email, phone: t.phone || "", employeeId: t.employeeId || "", college: t.collegeName || "", state: t.state || "", active: t.isActive ? "Yes" : "No",
        batchesAssigned: t.leaderBatches.length, programs: t.leaderBatches.map(b => b.program.title).join("; "), createdAt: formatDateTime(t.createdAt),
      }));
      filename = `team_leaders_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "programs": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const programs = await prisma.program.findMany({
        include: { batches: { select: { name: true, _count: { select: { enrollments: true } } } }, organization: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Title", "Slug", "Domain", "Mode", "Duration (days)", "Fee Type", "Fee Amount", "Stipend Amount", "Max Seats", "Total Days", "Weekoffs", "Working Hours", "Published", "Organization", "Total Batches", "Total Enrollments", "Created At"];
      rows = programs.map(p => [
        p.title, p.slug, p.domain, p.mode, String(p.duration), p.feeType, String(p.feeAmount), String(p.stipendAmount), String(p.maxSeats), String(p.totalDays), p.weekoffs, p.workingHours || "", p.isPublished ? "Yes" : "No", p.organization.name, String(p.batches.length), String(p.batches.reduce((s, b) => s + b._count.enrollments, 0)), formatDateTime(p.createdAt),
      ]);
      jsonData = programs.map(p => ({
        title: p.title, slug: p.slug, domain: p.domain, mode: p.mode, duration: p.duration, feeType: p.feeType, feeAmount: p.feeAmount, stipendAmount: p.stipendAmount, maxSeats: p.maxSeats, totalDays: p.totalDays, weekoffs: p.weekoffs, workingHours: p.workingHours || "", published: p.isPublished ? "Yes" : "No", organization: p.organization.name, totalBatches: p.batches.length, totalEnrollments: p.batches.reduce((s, b) => s + b._count.enrollments, 0), createdAt: formatDateTime(p.createdAt),
      }));
      filename = `programs_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "attendance": {
      const where: Record<string, unknown> = {};
      if (!isAdmin) where.userId = session.id;
      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true, employeeId: true } },
          enrollment: { include: { batch: { include: { program: { select: { title: true } } } } } },
        },
        orderBy: { date: "desc" },
      });
      headers = ["Employee ID", "Name", "Email", "Phone", "Program", "Batch", "Date", "Status", "Work Day", "Check In", "Check Out", "Method", "IP Address", "Notes", "Created At"];
      rows = attendances.map(a => [
        a.user.employeeId || "", a.user.name, a.user.email, a.user.phone || "",
        a.enrollment.batch.program.title, a.enrollment.batch.name,
        formatDate(a.date), a.status, String(a.workDay || ""), a.checkIn || "", a.checkOut || "", a.method === "bulk-autofill" || a.method === "task-completion" ? "Auto" : a.method, a.ipAddress || "", a.notes || "", formatDateTime(a.createdAt),
      ]);
      jsonData = attendances.map(a => ({
        employeeId: a.user.employeeId || "", name: a.user.name, email: a.user.email, phone: a.user.phone || "",
        program: a.enrollment.batch.program.title, batch: a.enrollment.batch.name,
        date: formatDate(a.date), status: a.status, workDay: a.workDay || "", checkIn: a.checkIn || "", checkOut: a.checkOut || "", method: a.method === "bulk-autofill" || a.method === "task-completion" ? "Auto" : a.method, ipAddress: a.ipAddress || "", notes: a.notes || "", createdAt: formatDateTime(a.createdAt),
      }));
      filename = `attendance_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "payments": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const payments = await prisma.payment.findMany({
        include: {
          enrollment: { include: { student: { select: { name: true, email: true, phone: true, employeeId: true } }, batch: { include: { program: { select: { title: true } } } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Student Name", "Email", "Phone", "Employee ID", "Program", "Batch", "Amount", "Type", "Status", "Payment ID", "Method", "Description", "Created At", "Updated At"];
      rows = payments.map(p => [
        p.enrollment.student.name, p.enrollment.student.email, p.enrollment.student.phone || "", p.enrollment.student.employeeId || "",
        p.enrollment.batch.program.title, p.enrollment.batch.name,
        String(p.amount), p.type, p.status, p.paymentId || "", p.method || "", p.description || "", formatDateTime(p.createdAt), formatDateTime(p.updatedAt),
      ]);
      jsonData = payments.map(p => ({
        studentName: p.enrollment.student.name, email: p.enrollment.student.email, phone: p.enrollment.student.phone || "", employeeId: p.enrollment.student.employeeId || "",
        program: p.enrollment.batch.program.title, batch: p.enrollment.batch.name,
        amount: p.amount, type: p.type, status: p.status, paymentId: p.paymentId || "", method: p.method || "", description: p.description || "", createdAt: formatDateTime(p.createdAt), updatedAt: formatDateTime(p.updatedAt),
      }));
      filename = `payments_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "salary": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const salaries = await prisma.salary.findMany({
        include: {
          enrollment: { include: { student: { select: { name: true, email: true, employeeId: true } }, batch: { include: { program: { select: { title: true } } } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Employee ID", "Name", "Email", "Program", "Batch", "Month", "Amount", "Attendance Days", "Total Days", "Status", "Paid At", "Created At"];
      rows = salaries.map(s => [
        s.enrollment.student.employeeId || "", s.enrollment.student.name, s.enrollment.student.email,
        s.enrollment.batch.program.title, s.enrollment.batch.name,
        s.month, String(s.amount), String(s.attendanceDays), String(s.totalDays), s.status, formatDateTime(s.paidAt), formatDateTime(s.createdAt),
      ]);
      jsonData = salaries.map(s => ({
        employeeId: s.enrollment.student.employeeId || "", name: s.enrollment.student.name, email: s.enrollment.student.email,
        program: s.enrollment.batch.program.title, batch: s.enrollment.batch.name,
        month: s.month, amount: s.amount, attendanceDays: s.attendanceDays, totalDays: s.totalDays, status: s.status, paidAt: formatDateTime(s.paidAt), createdAt: formatDateTime(s.createdAt),
      }));
      filename = `salary_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "leaves": {
      const where: Record<string, unknown> = {};
      if (!isAdmin) where.userId = session.id;
      const leaves = await prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      const userIds = [...new Set(leaves.map(l => l.userId))];
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, employeeId: true } });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));

      headers = ["Employee ID", "Name", "Email", "Leave Type", "Start Date", "End Date", "Total Days", "Reason", "Status", "Approved By", "Admin Remarks", "Created At"];
      rows = leaves.map(l => {
        const u = userMap[l.userId];
        return [
          u?.employeeId || "", u?.name || "", u?.email || "", l.leaveType, formatDate(l.startDate), formatDate(l.endDate), String(l.totalDays), l.reason, l.status, l.approvedBy || "", l.adminRemarks || "", formatDateTime(l.createdAt),
        ];
      });
      jsonData = leaves.map(l => {
        const u = userMap[l.userId];
        return {
          employeeId: u?.employeeId || "", name: u?.name || "", email: u?.email || "", leaveType: l.leaveType, startDate: formatDate(l.startDate), endDate: formatDate(l.endDate), totalDays: l.totalDays, reason: l.reason, status: l.status, approvedBy: l.approvedBy || "", adminRemarks: l.adminRemarks || "", createdAt: formatDateTime(l.createdAt),
        };
      });
      filename = `leaves_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "my-leaves": {
      const leaves = await prisma.leaveRequest.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Leave Type", "Start Date", "End Date", "Total Days", "Reason", "Status", "Approved By", "Admin Remarks", "Created At"];
      rows = leaves.map(l => [
        l.leaveType, formatDate(l.startDate), formatDate(l.endDate), String(l.totalDays), l.reason, l.status, l.approvedBy || "", l.adminRemarks || "", formatDateTime(l.createdAt),
      ]);
      jsonData = leaves.map(l => ({
        leaveType: l.leaveType, startDate: formatDate(l.startDate), endDate: formatDate(l.endDate), totalDays: l.totalDays, reason: l.reason, status: l.status, approvedBy: l.approvedBy || "", adminRemarks: l.adminRemarks || "", createdAt: formatDateTime(l.createdAt),
      }));
      filename = `my_leaves_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "holidays": {
      const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
      headers = ["Title", "Date", "Type", "Description", "Active", "Created At"];
      rows = holidays.map(h => [
        h.title, formatDate(h.date), h.type, h.description || "", h.isActive ? "Yes" : "No", formatDateTime(h.createdAt),
      ]);
      jsonData = holidays.map(h => ({
        title: h.title, date: formatDate(h.date), type: h.type, description: h.description || "", active: h.isActive ? "Yes" : "No", createdAt: formatDateTime(h.createdAt),
      }));
      filename = `holidays_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "my-payslips": {
      const payslips = await prisma.payslip.findMany({
        where: { userId: session.id },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
      headers = ["Month", "Year", "Basic Pay", "Allowances", "Deductions", "Bonus", "Net Pay", "Working Days", "Present Days", "Leave Days", "Payment Method", "Payment Ref", "Status", "Paid At", "Created At"];
      rows = payslips.map(p => [
        p.month, String(p.year), String(p.basicPay), String(p.allowances), String(p.deductions), String(p.bonus), String(p.netPay), String(p.workingDays), String(p.presentDays), String(p.leaveDays), p.paymentMethod || "", p.paymentRef || "", p.status, formatDateTime(p.paidAt), formatDateTime(p.createdAt),
      ]);
      jsonData = payslips.map(p => ({
        month: p.month, year: p.year, basicPay: p.basicPay, allowances: p.allowances, deductions: p.deductions, bonus: p.bonus, netPay: p.netPay, workingDays: p.workingDays, presentDays: p.presentDays, leaveDays: p.leaveDays, paymentMethod: p.paymentMethod || "", paymentRef: p.paymentRef || "", status: p.status, paidAt: formatDateTime(p.paidAt), createdAt: formatDateTime(p.createdAt),
      }));
      filename = `my_payslips_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "live-sessions": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const sessions = await prisma.liveSession.findMany({ orderBy: { scheduledAt: "desc" } });
      const hostIds = [...new Set(sessions.map(s => s.hostId))];
      const hosts = await prisma.user.findMany({ where: { id: { in: hostIds } }, select: { id: true, name: true, email: true } });
      const hostMap = Object.fromEntries(hosts.map(h => [h.id, h]));

      headers = ["Title", "Description", "Host", "Host Email", "Platform", "Meet Link", "Scheduled At", "Duration (min)", "Status", "Recording URL", "Created At"];
      rows = sessions.map(s => {
        const h = hostMap[s.hostId];
        return [s.title, s.description || "", h?.name || "", h?.email || "", s.platform, s.meetLink || "", formatDateTime(s.scheduledAt), String(s.duration), s.status, s.recordingUrl || "", formatDateTime(s.createdAt)];
      });
      jsonData = sessions.map(s => {
        const h = hostMap[s.hostId];
        return { title: s.title, description: s.description || "", host: h?.name || "", hostEmail: h?.email || "", platform: s.platform, meetLink: s.meetLink || "", scheduledAt: formatDateTime(s.scheduledAt), duration: s.duration, status: s.status, recordingUrl: s.recordingUrl || "", createdAt: formatDateTime(s.createdAt) };
      });
      filename = `live_sessions_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "jobs": {
      const jobs = await prisma.jobPosting.findMany({
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Title", "Company", "Description", "Location", "Salary", "Type", "Skills", "Apply URL", "Active", "Applications Count", "Created At"];
      rows = jobs.map(j => [
        j.title, j.company, j.description, j.location || "", j.salary || "", j.type, j.skills || "", j.applyUrl || "", j.isActive ? "Yes" : "No", String(j._count.applications), formatDateTime(j.createdAt),
      ]);
      jsonData = jobs.map(j => ({
        title: j.title, company: j.company, description: j.description, location: j.location || "", salary: j.salary || "", type: j.type, skills: j.skills || "", applyUrl: j.applyUrl || "", active: j.isActive ? "Yes" : "No", applicationsCount: j._count.applications, createdAt: formatDateTime(j.createdAt),
      }));
      filename = `jobs_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "campaigns": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const campaigns = await prisma.emailCampaign.findMany({ orderBy: { createdAt: "desc" } });
      headers = ["Title", "Subject", "Target Role", "Status", "Sent Count", "Open Count", "Click Count", "Scheduled At", "Sent At", "Created At"];
      rows = campaigns.map(c => [
        c.title, c.subject, c.targetRole, c.status, String(c.sentCount), String(c.openCount), String(c.clickCount), formatDateTime(c.scheduledAt), formatDateTime(c.sentAt), formatDateTime(c.createdAt),
      ]);
      jsonData = campaigns.map(c => ({
        title: c.title, subject: c.subject, targetRole: c.targetRole, status: c.status, sentCount: c.sentCount, openCount: c.openCount, clickCount: c.clickCount, scheduledAt: formatDateTime(c.scheduledAt), sentAt: formatDateTime(c.sentAt), createdAt: formatDateTime(c.createdAt),
      }));
      filename = `campaigns_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "reviews": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const submissions = await prisma.submission.findMany({
        include: {
          student: { select: { name: true, email: true, employeeId: true } },
          task: { include: { batch: { include: { program: { select: { title: true } } } } } },
        },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Student Name", "Student Email", "Employee ID", "Task", "Program", "Batch", "Content", "File URL", "Score %", "Feedback", "Reviewed By", "Status", "Created At", "Updated At"];
      rows = submissions.map(s => [
        s.student.name, s.student.email, s.student.employeeId || "", s.task.title, s.task.batch.program.title, s.task.batch.name,
        s.content || "", s.fileUrl || "", String(s.percentage || ""), s.feedback || "", s.reviewedBy || "", s.status, formatDateTime(s.createdAt), formatDateTime(s.updatedAt),
      ]);
      jsonData = submissions.map(s => ({
        studentName: s.student.name, studentEmail: s.student.email, employeeId: s.student.employeeId || "", task: s.task.title, program: s.task.batch.program.title, batch: s.task.batch.name,
        content: s.content || "", fileUrl: s.fileUrl || "", score: s.percentage || 0, feedback: s.feedback || "", reviewedBy: s.reviewedBy || "", status: s.status, createdAt: formatDateTime(s.createdAt), updatedAt: formatDateTime(s.updatedAt),
      }));
      filename = `reviews_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "testimonials": {
      const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
      headers = ["Name", "Role", "Content", "Rating", "Video URL", "Published", "Created At"];
      rows = testimonials.map(t => [
        t.name, t.role || "", t.content, String(t.rating), t.videoUrl || "", t.isPublished ? "Yes" : "No", formatDateTime(t.createdAt),
      ]);
      jsonData = testimonials.map(t => ({
        name: t.name, role: t.role || "", content: t.content, rating: t.rating, videoUrl: t.videoUrl || "", published: t.isPublished ? "Yes" : "No", createdAt: formatDateTime(t.createdAt),
      }));
      filename = `testimonials_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "announcements": {
      const announcements = await prisma.announcement.findMany({
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      headers = ["Title", "Content", "Category", "Target Role", "Pinned", "Author", "Author Email", "Created At"];
      rows = announcements.map(a => [
        a.title, a.content, a.category, a.targetRole, a.isPinned ? "Yes" : "No", a.author.name, a.author.email, formatDateTime(a.createdAt),
      ]);
      jsonData = announcements.map(a => ({
        title: a.title, content: a.content, category: a.category, targetRole: a.targetRole, pinned: a.isPinned ? "Yes" : "No", author: a.author.name, authorEmail: a.author.email, createdAt: formatDateTime(a.createdAt),
      }));
      filename = `announcements_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "discussions": {
      const discussions = await prisma.discussion.findMany({
        include: { _count: { select: { replies: true } } },
        orderBy: { createdAt: "desc" },
      });
      const authorIds = [...new Set(discussions.map(d => d.authorId))];
      const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, email: true } });
      const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

      headers = ["Title", "Content", "Category", "Author", "Author Email", "Pinned", "Resolved", "Replies Count", "Created At"];
      rows = discussions.map(d => {
        const a = authorMap[d.authorId];
        return [d.title, d.content, d.category, a?.name || "", a?.email || "", d.isPinned ? "Yes" : "No", d.isResolved ? "Yes" : "No", String(d._count.replies), formatDateTime(d.createdAt)];
      });
      jsonData = discussions.map(d => {
        const a = authorMap[d.authorId];
        return { title: d.title, content: d.content, category: d.category, author: a?.name || "", authorEmail: a?.email || "", pinned: d.isPinned ? "Yes" : "No", resolved: d.isResolved ? "Yes" : "No", repliesCount: d._count.replies, createdAt: formatDateTime(d.createdAt) };
      });
      filename = `discussions_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "progress": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const enrollments = await prisma.enrollment.findMany({
        where: { status: { in: ["selected", "active"] } },
        include: {
          student: { select: { name: true, email: true, employeeId: true } },
          batch: { include: { program: { select: { title: true, totalDays: true } }, tasks: { select: { id: true } } } },
          attendances: { where: { status: "present" } },
        },
      });
      const allSubmissions = await prisma.submission.findMany({
        where: { status: { in: ["reviewed", "approved"] } },
        select: { studentId: true, taskId: true },
      });
      const subMap = new Map<string, Set<string>>();
      for (const s of allSubmissions) {
        if (!subMap.has(s.studentId)) subMap.set(s.studentId, new Set());
        subMap.get(s.studentId)!.add(s.taskId);
      }

      headers = ["Employee ID", "Name", "Email", "Program", "Batch", "Status", "Tasks Completed", "Total Tasks", "Task Completion %", "Days Present", "Total Days", "Attendance %", "Current Work Day", "Joining Date"];
      rows = enrollments.map(e => {
        const totalTasks = e.batch.tasks.length;
        const completedTasks = e.batch.tasks.filter(t => subMap.get(e.studentId)?.has(t.id)).length;
        const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const daysPresent = e.attendances.length;
        const totalDays = e.batch.program.totalDays;
        const attPct = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0;
        return [
          e.student.employeeId || "", e.student.name, e.student.email, e.batch.program.title, e.batch.name, e.status,
          String(completedTasks), String(totalTasks), `${taskPct}%`, String(daysPresent), String(totalDays), `${attPct}%`, String(e.currentWorkDay), formatDate(e.joiningDate),
        ];
      });
      jsonData = enrollments.map(e => {
        const totalTasks = e.batch.tasks.length;
        const completedTasks = e.batch.tasks.filter(t => subMap.get(e.studentId)?.has(t.id)).length;
        const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const daysPresent = e.attendances.length;
        const totalDays = e.batch.program.totalDays;
        const attPct = totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0;
        return {
          employeeId: e.student.employeeId || "", name: e.student.name, email: e.student.email, program: e.batch.program.title, batch: e.batch.name, status: e.status,
          tasksCompleted: completedTasks, totalTasks, taskCompletionPct: taskPct, daysPresent, totalDays, attendancePct: attPct, currentWorkDay: e.currentWorkDay, joiningDate: formatDate(e.joiningDate),
        };
      });
      filename = `progress_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "leaderboard": {
      const points = await prisma.gamificationPoint.findMany({
        include: { user: { select: { name: true, email: true, employeeId: true } } },
      });
      const userPoints = new Map<string, { name: string; email: string; employeeId: string; total: number; categories: Record<string, number> }>();
      for (const p of points) {
        if (!userPoints.has(p.userId)) {
          userPoints.set(p.userId, { name: p.user.name, email: p.user.email, employeeId: p.user.employeeId || "", total: 0, categories: {} });
        }
        const up = userPoints.get(p.userId)!;
        up.total += p.points;
        up.categories[p.category] = (up.categories[p.category] || 0) + p.points;
      }
      const sorted = [...userPoints.values()].sort((a, b) => b.total - a.total);

      headers = ["Rank", "Name", "Email", "Employee ID", "Total Points", "Task Points", "Attendance Points", "Quiz Points", "Other Points"];
      rows = sorted.map((u, i) => [
        String(i + 1), u.name, u.email, u.employeeId, String(u.total), String(u.categories["task"] || 0), String(u.categories["attendance"] || 0), String(u.categories["quiz"] || 0), String(u.categories["other"] || 0),
      ]);
      jsonData = sorted.map((u, i) => ({
        rank: i + 1, name: u.name, email: u.email, employeeId: u.employeeId, totalPoints: u.total, taskPoints: u.categories["task"] || 0, attendancePoints: u.categories["attendance"] || 0, quizPoints: u.categories["quiz"] || 0, otherPoints: u.categories["other"] || 0,
      }));
      filename = `leaderboard_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "activity-log": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const logs = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" } });
      headers = ["User", "Action", "Entity", "Entity ID", "Details", "IP Address", "Created At"];
      rows = logs.map(l => [
        l.userName || "", l.action, l.entity, l.entityId || "", l.details || "", l.ipAddress || "", formatDateTime(l.createdAt),
      ]);
      jsonData = logs.map(l => ({
        user: l.userName || "", action: l.action, entity: l.entity, entityId: l.entityId || "", details: l.details || "", ipAddress: l.ipAddress || "", createdAt: formatDateTime(l.createdAt),
      }));
      filename = `activity_log_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "reports": {
      if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const enrollments = await prisma.enrollment.findMany({
        include: {
          student: { select: { name: true, email: true, phone: true, employeeId: true, collegeName: true, state: true } },
          batch: { include: { program: { select: { title: true, totalDays: true, domain: true, mode: true } } } },
          attendances: true,
          payments: true,
          salaries: true,
        },
      });

      headers = ["Employee ID", "Name", "Email", "Phone", "College", "State", "Program", "Domain", "Mode", "Batch", "Status", "Days Present", "Days Absent", "Total Days", "Attendance %", "Total Payments", "Total Salary Paid", "Fee Type", "Fee Amount", "Joining Date", "Completed At", "Created At"];
      rows = enrollments.map(e => {
        const present = e.attendances.filter(a => a.status === "present").length;
        const absent = e.attendances.filter(a => a.status === "absent").length;
        const total = e.batch.program.totalDays;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        const totalPayments = e.payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
        const totalSalary = e.salaries.filter(s => s.status === "paid").reduce((s, sal) => s + sal.amount, 0);
        return [
          e.student.employeeId || "", e.student.name, e.student.email, e.student.phone || "", e.student.collegeName || "", e.student.state || "",
          e.batch.program.title, e.batch.program.domain, e.batch.program.mode, e.batch.name, e.status,
          String(present), String(absent), String(total), `${pct}%`, String(totalPayments), String(totalSalary),
          e.feeType || "", String(e.feeAmount || ""), formatDate(e.joiningDate), formatDateTime(e.completedAt), formatDateTime(e.createdAt),
        ];
      });
      jsonData = enrollments.map(e => {
        const present = e.attendances.filter(a => a.status === "present").length;
        const absent = e.attendances.filter(a => a.status === "absent").length;
        const total = e.batch.program.totalDays;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        const totalPayments = e.payments.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
        const totalSalary = e.salaries.filter(s => s.status === "paid").reduce((s, sal) => s + sal.amount, 0);
        return {
          employeeId: e.student.employeeId || "", name: e.student.name, email: e.student.email, phone: e.student.phone || "", college: e.student.collegeName || "", state: e.student.state || "",
          program: e.batch.program.title, domain: e.batch.program.domain, mode: e.batch.program.mode, batch: e.batch.name, status: e.status,
          daysPresent: present, daysAbsent: absent, totalDays: total, attendancePct: pct, totalPayments, totalSalary,
          feeType: e.feeType || "", feeAmount: e.feeAmount || 0, joiningDate: formatDate(e.joiningDate), completedAt: formatDateTime(e.completedAt), createdAt: formatDateTime(e.createdAt),
        };
      });
      filename = `reports_complete_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  if (format === "json") {
    return NextResponse.json({ data: jsonData, headers, filename });
  }

  const csvContent = buildCSV(headers, rows);
  return new NextResponse("\uFEFF" + csvContent, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
