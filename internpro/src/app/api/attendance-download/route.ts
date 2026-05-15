import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { htmlToPdfBuffer } from "@/lib/pdf";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!enrollmentId) {
    return NextResponse.json({ error: "enrollmentId required" }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { select: { name: true, email: true, phone: true, employeeId: true, collegeName: true, degree: true, year: true } },
      batch: { include: { program: { select: { title: true, domain: true, mode: true, duration: true, totalDays: true } } } },
    },
  });

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  // Students can only download their own
  if (session.role === "student" && enrollment.studentId !== session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where: Record<string, unknown> = { enrollmentId };
  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      dateFilter.lt = toDate;
    }
    where.date = dateFilter;
  }

  const records = await prisma.attendance.findMany({
    where,
    orderBy: { date: "asc" },
  });

  const presentDays = records.filter(r => r.status === "present" || r.status === "late" || r.status === "half-day").length;
  const absentDays = records.filter(r => r.status === "absent").length;
  const leaveDays = records.filter(r => r.status === "leave").length;
  const totalRecords = records.length;
  const attendancePercentage = totalRecords > 0 ? Math.round((presentDays / totalRecords) * 100) : 0;

  const dateRange = from && to
    ? `${formatDateIN(from)} to ${formatDateIN(to)}`
    : from
      ? `From ${formatDateIN(from)}`
      : to
        ? `Till ${formatDateIN(to)}`
        : "Complete Record";

  const joiningDateStr = enrollment.joiningDate ? formatDateIN(enrollment.joiningDate) : "N/A";
  const generatedDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `
<div style="padding:40px 50px;font-family:'Calibri','Segoe UI',Arial,sans-serif;color:#1a1a1a;max-width:800px;margin:0 auto;">
  <!-- Header -->
  <div style="text-align:center;border-bottom:3px solid #0EA5B8;padding-bottom:20px;margin-bottom:25px;">
    <h1 style="font-size:24px;color:#0EA5B8;margin:0 0 4px 0;letter-spacing:1px;">KKHS Media Private Limited</h1>
    <p style="font-size:11px;color:#666;margin:0;">CIN: U74999RJ2024PTC098302 | MSME: UDYAM-RJ-20-0075835</p>
    <p style="font-size:11px;color:#666;margin:2px 0 0 0;">Jaipur, Rajasthan | internship.kkhsmedia.com</p>
    <h2 style="font-size:18px;color:#333;margin:15px 0 0 0;text-transform:uppercase;letter-spacing:2px;">Attendance Report</h2>
  </div>

  <!-- Student Details -->
  <table style="width:100%;font-size:13px;margin-bottom:20px;border-collapse:collapse;">
    <tr>
      <td style="padding:5px 10px;width:25%;color:#666;font-weight:600;">Student Name</td>
      <td style="padding:5px 10px;width:25%;"><b>${enrollment.student.name}</b></td>
      <td style="padding:5px 10px;width:25%;color:#666;font-weight:600;">Employee ID</td>
      <td style="padding:5px 10px;width:25%;">${enrollment.student.employeeId || "N/A"}</td>
    </tr>
    <tr style="background:#f8f9fa;">
      <td style="padding:5px 10px;color:#666;font-weight:600;">Email</td>
      <td style="padding:5px 10px;">${enrollment.student.email}</td>
      <td style="padding:5px 10px;color:#666;font-weight:600;">Phone</td>
      <td style="padding:5px 10px;">${enrollment.student.phone || "N/A"}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px;color:#666;font-weight:600;">College</td>
      <td style="padding:5px 10px;">${enrollment.student.collegeName || "N/A"}</td>
      <td style="padding:5px 10px;color:#666;font-weight:600;">Degree / Year</td>
      <td style="padding:5px 10px;">${enrollment.student.degree || "—"} ${enrollment.student.year ? `(${enrollment.student.year})` : ""}</td>
    </tr>
    <tr style="background:#f8f9fa;">
      <td style="padding:5px 10px;color:#666;font-weight:600;">Program</td>
      <td style="padding:5px 10px;"><b>${enrollment.batch.program.title}</b></td>
      <td style="padding:5px 10px;color:#666;font-weight:600;">Batch</td>
      <td style="padding:5px 10px;">${enrollment.batch.name}</td>
    </tr>
    <tr>
      <td style="padding:5px 10px;color:#666;font-weight:600;">Joining Date</td>
      <td style="padding:5px 10px;">${joiningDateStr}</td>
      <td style="padding:5px 10px;color:#666;font-weight:600;">Duration</td>
      <td style="padding:5px 10px;">${enrollment.batch.program.duration} days</td>
    </tr>
    <tr style="background:#f8f9fa;">
      <td style="padding:5px 10px;color:#666;font-weight:600;">Report Period</td>
      <td style="padding:5px 10px;" colspan="3"><b>${dateRange}</b></td>
    </tr>
  </table>

  <!-- Summary Box -->
  <div style="display:flex;gap:10px;margin-bottom:20px;">
    <div style="flex:1;text-align:center;background:#e0f7fa;border-radius:8px;padding:12px 8px;">
      <div style="font-size:22px;font-weight:700;color:#0EA5B8;">${presentDays}</div>
      <div style="font-size:11px;color:#666;">Present</div>
    </div>
    <div style="flex:1;text-align:center;background:#fce4ec;border-radius:8px;padding:12px 8px;">
      <div style="font-size:22px;font-weight:700;color:#e53935;">${absentDays}</div>
      <div style="font-size:11px;color:#666;">Absent</div>
    </div>
    <div style="flex:1;text-align:center;background:#fff3e0;border-radius:8px;padding:12px 8px;">
      <div style="font-size:22px;font-weight:700;color:#f57c00;">${leaveDays}</div>
      <div style="font-size:11px;color:#666;">Leave</div>
    </div>
    <div style="flex:1;text-align:center;background:#e8f5e9;border-radius:8px;padding:12px 8px;">
      <div style="font-size:22px;font-weight:700;color:#2e7d32;">${attendancePercentage}%</div>
      <div style="font-size:11px;color:#666;">Attendance</div>
    </div>
    <div style="flex:1;text-align:center;background:#f3e5f5;border-radius:8px;padding:12px 8px;">
      <div style="font-size:22px;font-weight:700;color:#7b1fa2;">${totalRecords}</div>
      <div style="font-size:11px;color:#666;">Total Days</div>
    </div>
  </div>

  <!-- Attendance Table -->
  <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:25px;">
    <thead>
      <tr style="background:#0EA5B8;color:white;">
        <th style="padding:8px 10px;text-align:left;font-weight:600;">#</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600;">Date</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600;">Day</th>
        <th style="padding:8px 10px;text-align:center;font-weight:600;">Status</th>
        <th style="padding:8px 10px;text-align:center;font-weight:600;">Check In</th>
        <th style="padding:8px 10px;text-align:center;font-weight:600;">Check Out</th>
        <th style="padding:8px 10px;text-align:left;font-weight:600;">Method</th>
      </tr>
    </thead>
    <tbody>
      ${records.map((r, i) => {
        const d = new Date(r.date);
        const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
        const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const statusColor = r.status === "present" ? "#2e7d32" : r.status === "absent" ? "#e53935" : r.status === "late" ? "#f57c00" : r.status === "leave" ? "#1565c0" : "#666";
        const bg = i % 2 === 0 ? "#fff" : "#f8f9fa";
        return `<tr style="background:${bg};">
          <td style="padding:6px 10px;">${i + 1}</td>
          <td style="padding:6px 10px;">${dateStr}</td>
          <td style="padding:6px 10px;">${dayName}</td>
          <td style="padding:6px 10px;text-align:center;"><span style="background:${statusColor};color:white;padding:2px 8px;border-radius:10px;font-size:10px;text-transform:uppercase;">${r.status}</span></td>
          <td style="padding:6px 10px;text-align:center;">${r.checkIn || "—"}</td>
          <td style="padding:6px 10px;text-align:center;">${r.checkOut || "—"}</td>
          <td style="padding:6px 10px;text-transform:capitalize;">${r.method}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>

  ${records.length === 0 ? '<p style="text-align:center;color:#999;padding:20px;font-size:13px;">No attendance records found for the selected period.</p>' : ""}

  <!-- Footer / Signature -->
  <div style="margin-top:30px;border-top:1px solid #ddd;padding-top:20px;">
    <div style="display:flex;justify-content:space-between;">
      <div>
        <p style="font-size:11px;color:#999;margin:0;">Generated on: ${generatedDate}</p>
        <p style="font-size:11px;color:#999;margin:3px 0 0 0;">This is a system-generated document from InternPro by KKHS Media.</p>
      </div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #333;width:180px;margin-top:40px;padding-top:5px;">
          <p style="font-size:11px;color:#666;margin:0;">Authorized Signatory</p>
          <p style="font-size:10px;color:#999;margin:0;">KKHS Media Pvt. Ltd.</p>
        </div>
      </div>
    </div>
  </div>
</div>`;

  const pdfBuffer = await htmlToPdfBuffer(html);
  const safeName = enrollment.student.name.replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Attendance_${safeName}_${enrollment.batch.program.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function formatDateIN(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
