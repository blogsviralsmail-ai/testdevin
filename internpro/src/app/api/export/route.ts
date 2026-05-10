import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "students";
  const format = searchParams.get("format") || "csv";

  let csvContent = "";
  let filename = "";

  switch (type) {
    case "students": {
      const enrollments = await prisma.enrollment.findMany({
        where: { status: "selected" },
        include: {
          student: { select: { name: true, email: true, phone: true, collegeName: true, state: true } },
          batch: { include: { program: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      csvContent = "Name,Email,Phone,College,State,Program,Batch,Status,Fee Type,Joining Date\n";
      for (const e of enrollments) {
        csvContent += `"${e.student.name}","${e.student.email}","${e.student.phone || ""}","${e.student.collegeName || ""}","${e.student.state || ""}","${e.batch.program.title}","${e.batch.name}","${e.status}","${e.feeType || ""}","${e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : ""}"\n`;
      }
      filename = `students_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "attendance": {
      const batchId = searchParams.get("batchId");
      const date = searchParams.get("date");
      const where: Record<string, unknown> = {};
      if (date) where.date = new Date(date);

      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          enrollment: { include: { batch: { select: { name: true, programId: true } } } },
        },
        orderBy: { date: "desc" },
        take: 1000,
      });

      const filtered = batchId ? attendances.filter(a => a.enrollment.batch?.programId || a.enrollment.batchId === batchId) : attendances;

      csvContent = "Name,Email,Date,Status,Check In,Check Out,Method\n";
      for (const a of filtered) {
        csvContent += `"${a.user.name}","${a.user.email}","${new Date(a.date).toLocaleDateString()}","${a.status}","${a.checkIn || ""}","${a.checkOut || ""}","${a.method}"\n`;
      }
      filename = `attendance_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "payments": {
      const payments = await prisma.payment.findMany({
        include: {
          enrollment: { include: { student: { select: { name: true, email: true } }, batch: { include: { program: { select: { title: true } } } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      csvContent = "Student,Email,Program,Amount,Type,Status,Method,Date\n";
      for (const p of payments) {
        csvContent += `"${p.enrollment.student.name}","${p.enrollment.student.email}","${p.enrollment.batch.program.title}","${p.amount}","${p.type}","${p.status}","${p.method || ""}","${new Date(p.createdAt).toLocaleDateString()}"\n`;
      }
      filename = `payments_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "reports": {
      const enrollments = await prisma.enrollment.findMany({
        include: {
          student: { select: { name: true, email: true } },
          batch: { include: { program: { select: { title: true, totalDays: true } } } },
          attendances: true,
        },
      });

      csvContent = "Student,Email,Program,Status,Days Present,Total Days,Attendance %\n";
      for (const e of enrollments) {
        const present = e.attendances.filter(a => a.status === "present").length;
        const total = e.batch.program.totalDays;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        csvContent += `"${e.student.name}","${e.student.email}","${e.batch.program.title}","${e.status}","${present}","${total}","${pct}%"\n`;
      }
      filename = `reports_${new Date().toISOString().split("T")[0]}`;
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  if (format === "csv") {
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Only CSV format supported" }, { status: 400 });
}
