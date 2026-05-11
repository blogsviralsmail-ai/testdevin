import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateEmployeeId } from "@/lib/employee-id";
import { notifyApplicationStatusChange } from "@/lib/notifications";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, teamLeaderCategory, teamLeaderRemarks, adminRemarks,
      salary, weekoffs, paidLeaves, workTiming, joiningDate,
      feeType, feeAmount, stipendAmount, batchId, preferredMode } = body;

    const data: Record<string, unknown> = {};

    if (status) data.status = status;

    // Team leader or admin can categorize
    if ((session.role === "teamleader" || session.role === "admin") && teamLeaderCategory) {
      data.teamLeaderCategory = teamLeaderCategory;
      if (teamLeaderRemarks) data.teamLeaderRemarks = teamLeaderRemarks;
    }

    // Admin can add remarks and edit enrollment details
    if (session.role === "admin" || session.role === "organization") {
      if (adminRemarks) data.adminRemarks = adminRemarks;
      if (salary !== undefined) data.salary = salary;
      if (weekoffs !== undefined) data.weekoffs = weekoffs;
      if (paidLeaves !== undefined) data.paidLeaves = paidLeaves;
      if (workTiming !== undefined) data.workTiming = workTiming;
      if (joiningDate !== undefined) {
        data.joiningDate = new Date(joiningDate);

        // Auto-generate employee ID if not already set
        const enrollment = await prisma.enrollment.findUnique({
          where: { id },
          select: { studentId: true },
        });
        if (enrollment) {
          const student = await prisma.user.findUnique({
            where: { id: enrollment.studentId },
            select: { employeeId: true },
          });
          if (!student?.employeeId) {
            const empId = await generateEmployeeId(new Date(joiningDate));
            await prisma.user.update({
              where: { id: enrollment.studentId },
              data: { employeeId: empId },
            });
          }
        }
      }
      if (feeType !== undefined) data.feeType = feeType;
      if (feeAmount !== undefined) data.feeAmount = feeAmount;
      if (stipendAmount !== undefined) data.stipendAmount = stipendAmount;
    }

    if (status === "selected" && !joiningDate) {
      data.joiningDate = new Date();
    }

    // Auto-generate employee ID when student is selected or active
    if (status && ["selected", "active"].includes(status)) {
      const enrollmentForId = await prisma.enrollment.findUnique({
        where: { id },
        select: { studentId: true },
      });
      if (enrollmentForId) {
        const studentForId = await prisma.user.findUnique({
          where: { id: enrollmentForId.studentId },
          select: { employeeId: true },
        });
        if (!studentForId?.employeeId) {
          const empId = await generateEmployeeId(new Date());
          await prisma.user.update({
            where: { id: enrollmentForId.studentId },
            data: { employeeId: empId },
          });
        }
      }
    }

    if (status === "completed") {
      data.completedAt = new Date();
    }

    if ((session.role === "admin" || session.role === "organization") && batchId) {
      data.batchId = batchId;
    }
    if ((session.role === "admin" || session.role === "organization") && preferredMode) {
      data.preferredMode = preferredMode;
    }

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data,
      include: { student: { select: { email: true, name: true } }, batch: { include: { program: { select: { title: true } } } } },
    });

    // Send notification on status change
    if (status && ["selected", "rejected", "shortlisted", "interview"].includes(status)) {
      notifyApplicationStatusChange(enrollment.student.email, enrollment.student.name, status, enrollment.batch.program.title).catch(() => {});
    }

    return NextResponse.json(enrollment);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update enrollment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.enrollment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete enrollment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
