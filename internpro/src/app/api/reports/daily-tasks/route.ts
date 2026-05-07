import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function escapeHtml(s: string) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") || (session.role === "student" ? session.id : null);
  const batchId = searchParams.get("batchId");

  if (!studentId) return NextResponse.json({ error: "Student ID required" }, { status: 400 });

  // Get enrollment
  const enrollWhere: Record<string, unknown> = { studentId, status: { in: ["selected", "completed"] } };
  if (batchId) enrollWhere.batchId = batchId;
  const enrollment = await prisma.enrollment.findFirst({
    where: enrollWhere,
    include: {
      student: { select: { name: true, email: true, collegeName: true } },
      batch: { include: { program: { select: { title: true, duration: true } }, leader: { select: { name: true } } } },
    },
  });

  if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

  // Get all tasks for this batch
  const tasks = await prisma.task.findMany({
    where: { batchId: enrollment.batchId },
    include: {
      submissions: { where: { studentId }, select: { content: true, status: true, percentage: true, feedback: true, createdAt: true } },
    },
    orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
  });

  // Get attendance
  const attendances = await prisma.attendance.findMany({
    where: { enrollmentId: enrollment.id },
    orderBy: { date: "asc" },
  });

  // Settings
  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const lhLogo = sMap.letterhead_logo || "/kkhs-logo.png";
  const lhCompany = sMap.letterhead_company || "KKHS Media Private Limited";
  const lhAddress = sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur, Rajasthan 302012";
  const lhPhone = sMap.letterhead_phone || "9782005500";
  const lhEmail = sMap.letterhead_email || "hari@kkhsmedia.com";
  const lhGst = sMap.letterhead_gst || "08AAICK3853C1ZL";
  const cn = lhCompany;

  const studentName = escapeHtml(enrollment.student.name);
  const programName = escapeHtml(enrollment.batch.program.title);
  const batchName = escapeHtml(enrollment.batch.name);
  const leaderName = enrollment.batch.leader?.name ? escapeHtml(enrollment.batch.leader.name) : "N/A";
  const collegeName = enrollment.student.collegeName ? escapeHtml(enrollment.student.collegeName) : "N/A";
  // Date range: joining date to completion date (or today/program end, whichever is earlier)
  const joiningDt = enrollment.joiningDate ? new Date(enrollment.joiningDate) : new Date(enrollment.batch.startDate);
  const completedDt = enrollment.completedAt ? new Date(enrollment.completedAt) : null;
  const programEndDt = new Date(joiningDt);
  programEndDt.setDate(programEndDt.getDate() + enrollment.batch.program.duration);
  const today = new Date();
  // End date: if completed use completedAt; else min(today, program end date)
  const reportEndDt = completedDt || (today < programEndDt ? today : programEndDt);
  const startDate = joiningDt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const endDate = reportEndDt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const LH = `<table style="width:100%;border-collapse:collapse;"><tr><td style="width:180px;vertical-align:middle;padding:12px 0 12px 28px;"><img src="${lhLogo}" alt="${escapeHtml(cn)}" style="height:164px;display:block;object-fit:contain;" /></td><td style="text-align:right;vertical-align:middle;padding:12px 28px 12px 14px;"><p style="margin:0;font-size:28px;font-weight:700;color:#0000AA;letter-spacing:0.5px;">${escapeHtml(cn)}</p><p style="margin:5px 0 0;font-size:16px;color:#555;line-height:1.4;">${escapeHtml(lhAddress)}</p><p style="margin:4px 0 0;font-size:16px;color:#555;">Ph: ${escapeHtml(lhPhone)} &nbsp;|&nbsp; ${escapeHtml(lhEmail)} &nbsp;|&nbsp; GST: ${escapeHtml(lhGst)}</p></td></tr></table><div style="height:4px;background:linear-gradient(90deg,#0000AA,#0000AA 70%,#d32f2f 70%,#d32f2f);"></div>`;

  // Group tasks by day
  const dayMap = new Map<number, typeof tasks>();
  for (const t of tasks) {
    const day = t.dayNumber || 0;
    if (!dayMap.has(day)) dayMap.set(day, []);
    dayMap.get(day)!.push(t);
  }

  // Build day-wise rows
  let taskRows = "";
  const sortedDays = [...dayMap.keys()].sort((a, b) => a - b);
  for (const day of sortedDays) {
    const dayTasks = dayMap.get(day)!;
    const att = attendances.find(a => {
      const attDate = new Date(a.date);
      return a.workDay === day || (day > 0 && attDate.toDateString() !== "");
    });
    const attStatus = att ? (att.status === "present" ? "Present" : att.status === "absent" ? "Absent" : att.status) : "—";
    const checkIn = att?.checkIn || "—";
    const checkOut = att?.checkOut || "—";

    for (let i = 0; i < dayTasks.length; i++) {
      const t = dayTasks[i];
      const sub = t.submissions[0];
      const subStatus = sub ? (sub.status === "reviewed" ? `Reviewed (${sub.percentage || 0}%)` : sub.status) : "Not Submitted";
      const feedback = sub?.feedback || "—";

      taskRows += `<tr>`;
      if (i === 0) {
        taskRows += `<td style="padding:5px 10px;border:1px solid #e0e0e0;font-weight:600;color:#0000AA;text-align:center;vertical-align:top;" rowspan="${dayTasks.length}">Day ${day || "?"}</td>`;
        taskRows += `<td style="padding:5px 10px;border:1px solid #e0e0e0;text-align:center;vertical-align:top;" rowspan="${dayTasks.length}">${attStatus}<br/><span style="font-size:10px;color:#888;">${checkIn} - ${checkOut}</span></td>`;
      }
      taskRows += `<td style="padding:5px 10px;border:1px solid #e0e0e0;">${escapeHtml(t.title)}</td>`;
      taskRows += `<td style="padding:5px 10px;border:1px solid #e0e0e0;text-align:center;">${subStatus}</td>`;
      taskRows += `<td style="padding:5px 10px;border:1px solid #e0e0e0;">${escapeHtml(feedback)}</td>`;
      taskRows += `</tr>`;
    }
  }

  if (!taskRows) {
    taskRows = `<tr><td colspan="5" style="padding:20px;text-align:center;color:#888;border:1px solid #e0e0e0;">No tasks assigned yet.</td></tr>`;
  }

  // Summary stats
  const totalTasks = tasks.length;
  const submitted = tasks.filter(t => t.submissions.length > 0).length;
  const reviewed = tasks.filter(t => t.submissions[0]?.status === "reviewed").length;
  const avgScore = tasks.filter(t => t.submissions[0]?.percentage).reduce((sum, t) => sum + (t.submissions[0]?.percentage || 0), 0) / (reviewed || 1);
  const presentDays = attendances.filter(a => a.status === "present").length;
  const totalDays = enrollment.currentWorkDay || attendances.length;

  const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const html = `<div style="font-family:'Calibri','Segoe UI',Arial,sans-serif;margin:0 auto;padding:0;background:white;color:#222;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;">
<div style="width:210mm;min-height:297mm;padding:0;margin:0 auto;background:white;position:relative;box-sizing:border-box;">
${LH}
<div style="padding:14px 32px 20px;">
<div style="text-align:center;margin:6px 0 14px;"><h2 style="margin:0;font-size:24px;font-weight:700;color:#0000AA;letter-spacing:2px;text-transform:uppercase;">Daily Task Report</h2><div style="width:50px;height:3px;background:#d32f2f;margin:4px auto 0;"></div></div>

<table style="width:100%;border-collapse:collapse;margin:0 0 12px;font-size:13px;">
<tr><td style="padding:4px 0;width:50%;"><strong>Student Name:</strong> ${studentName}</td><td style="padding:4px 0;"><strong>Program:</strong> ${programName}</td></tr>
<tr><td style="padding:4px 0;"><strong>Batch:</strong> ${batchName}</td><td style="padding:4px 0;"><strong>Team Leader:</strong> ${leaderName}</td></tr>
<tr><td style="padding:4px 0;"><strong>College:</strong> ${collegeName}</td><td style="padding:4px 0;"><strong>Period:</strong> ${startDate} to ${endDate}</td></tr>
<tr><td style="padding:4px 0;"><strong>Report Date:</strong> ${todayStr}</td><td style="padding:4px 0;"><strong>Current Day:</strong> ${enrollment.currentWorkDay} / ${enrollment.batch.program.duration}</td></tr>
</table>

<div style="display:flex;gap:10px;margin-bottom:14px;">
<div style="flex:1;background:#f0f4ff;border-radius:8px;padding:10px;text-align:center;border:1px solid #0000AA20;">
<p style="margin:0;font-size:22px;font-weight:700;color:#0000AA;">${totalTasks}</p><p style="margin:2px 0 0;font-size:11px;color:#666;">Total Tasks</p></div>
<div style="flex:1;background:#f0fff4;border-radius:8px;padding:10px;text-align:center;border:1px solid #16a34a20;">
<p style="margin:0;font-size:22px;font-weight:700;color:#16a34a;">${submitted}</p><p style="margin:2px 0 0;font-size:11px;color:#666;">Submitted</p></div>
<div style="flex:1;background:#fffbeb;border-radius:8px;padding:10px;text-align:center;border:1px solid #ca8a0420;">
<p style="margin:0;font-size:22px;font-weight:700;color:#ca8a04;">${reviewed}</p><p style="margin:2px 0 0;font-size:11px;color:#666;">Reviewed</p></div>
<div style="flex:1;background:#fef2f2;border-radius:8px;padding:10px;text-align:center;border:1px solid #dc262620;">
<p style="margin:0;font-size:22px;font-weight:700;color:#dc2626;">${avgScore.toFixed(0)}%</p><p style="margin:2px 0 0;font-size:11px;color:#666;">Avg Score</p></div>
<div style="flex:1;background:#f5f3ff;border-radius:8px;padding:10px;text-align:center;border:1px solid #7c3aed20;">
<p style="margin:0;font-size:22px;font-weight:700;color:#7c3aed;">${presentDays}/${totalDays}</p><p style="margin:2px 0 0;font-size:11px;color:#666;">Attendance</p></div>
</div>

<table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #ddd;">
<thead><tr style="background:#0000AA;">
<th style="padding:6px 10px;color:white;font-weight:600;border:1px solid #0000AA;width:60px;">Day</th>
<th style="padding:6px 10px;color:white;font-weight:600;border:1px solid #0000AA;width:80px;">Attendance</th>
<th style="padding:6px 10px;color:white;font-weight:600;border:1px solid #0000AA;">Task</th>
<th style="padding:6px 10px;color:white;font-weight:600;border:1px solid #0000AA;width:100px;">Status</th>
<th style="padding:6px 10px;color:white;font-weight:600;border:1px solid #0000AA;">Feedback</th>
</tr></thead>
<tbody>${taskRows}</tbody>
</table>

</div>
<div style="padding:8px 32px;text-align:center;margin-top:auto;"><p style="margin:0;font-size:11px;color:#888;">This is a system-generated report from ${escapeHtml(cn)}. Generated on ${todayStr}.</p></div>
</div>
</div>`;

  return NextResponse.json({ html, studentName: enrollment.student.name, programName: enrollment.batch.program.title });
}
