import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendAttendanceEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");
  const batchId = searchParams.get("batchId");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = { user: { deletedAt: null } };
  if (enrollmentId) where.enrollmentId = enrollmentId;
  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { gte: d, lt: nextDay };
  }
  if (batchId) {
    where.enrollment = { batchId };
  }
  if (session.role === "student") {
    where.userId = session.id;
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      enrollment: { select: { id: true, batchId: true } },
    },
    orderBy: { date: "desc" },
  });

  // For students, hide method and createdAt
  if (session.role === "student") {
    const sanitized = attendance.map((a: Record<string, unknown>) => {
      const { method, createdAt, ...rest } = a as Record<string, unknown>;
      return { ...rest, method: "auto" };
    });
    return NextResponse.json(sanitized);
  }

  return NextResponse.json(attendance);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "teamleader", "student"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { enrollmentId } = body;
    const { date, status, method, checkIn, checkOut, notes } = body;

    // For students, auto-find their active enrollment
    if (session.role === "student" && !enrollmentId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { studentId: session.id, status: { in: ["selected", "active"] } },
      });
      if (!enrollment) {
        return NextResponse.json({ error: "No active enrollment found" }, { status: 404 });
      }
      enrollmentId = enrollment.id;
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Students can only mark their own attendance
    if (session.role === "student" && enrollment.studentId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Half-day can only be marked by admin, not by students
    if (status === "half_day" && session.role === "student") {
      return NextResponse.json({ error: "Only admin can mark half-day attendance" }, { status: 403 });
    }

    const attendanceDate = new Date(date || new Date().toISOString().split("T")[0]);

    // Check if attendance already exists for today (to avoid duplicate emails)
    const existing = await prisma.attendance.findUnique({
      where: { enrollmentId_date: { enrollmentId, date: attendanceDate } },
    });
    const isNewAttendance = !existing;

    const attendance = await prisma.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId,
          date: attendanceDate,
        },
      },
      update: {
        status: status || "present",
        method: method || "manual",
        ...(checkIn && { checkIn }),
        ...(checkOut && { checkOut }),
        notes: notes || null,
      },
      create: {
        enrollmentId,
        userId: enrollment.studentId,
        date: attendanceDate,
        status: status || "present",
        method: method || "manual",
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        notes: notes || null,
      },
    });

    // Send attendance email ONLY on first check-in (not on checkout updates)
    if (isNewAttendance) {
      const student = await prisma.user.findUnique({ where: { id: enrollment.studentId }, select: { name: true, email: true } });
      if (student?.email) {
        const dateStr = attendanceDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        sendAttendanceEmail(student.name, student.email, attendance.status, dateStr).catch(() => {});
      }
    }

    return NextResponse.json(attendance, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to mark attendance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
