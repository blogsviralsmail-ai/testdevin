import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trashedUsers = await prisma.user.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
      employeeId: true,
      collegeName: true,
      deletedAt: true,
      createdAt: true,
      _count: {
        select: {
          enrollments: true,
          attendances: true,
          documents: true,
          submissions: true,
          employeeCards: true,
        },
      },
    },
    orderBy: { deletedAt: "desc" },
  });

  return NextResponse.json(trashedUsers);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, ids } = await request.json();
  if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  if (action === "restore") {
    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: null },
    });
    await logActivity("restore", "user", undefined, `Restored ${ids.length} users from trash`, session.id, session.name);
    return NextResponse.json({ success: true, count: ids.length });
  }

  if (action === "permanent_delete") {
    let count = 0;
    for (const userId of ids) {
      try {
        // Delete all related data in correct order (children first)
        const enrollments = await prisma.enrollment.findMany({ where: { studentId: userId }, select: { id: true } });
        const enrollmentIds = enrollments.map((e: { id: string }) => e.id);

        if (enrollmentIds.length > 0) {
          await prisma.attendance.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.payment.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.salary.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.certificate.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.offerLetter.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.experienceLetter.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.interview.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.payslip.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
          await prisma.enrollment.deleteMany({ where: { studentId: userId } });
        }

        await prisma.submission.deleteMany({ where: { studentId: userId } });
        await prisma.document.deleteMany({ where: { userId } });
        await prisma.employeeCard.deleteMany({ where: { userId } });
        await prisma.notification.deleteMany({ where: { userId } });
        await prisma.supportTicket.deleteMany({ where: { userId } });
        await prisma.loginSession.deleteMany({ where: { userId } });
        await prisma.gamificationPoint.deleteMany({ where: { userId } });
        await prisma.userBadge.deleteMany({ where: { userId } });
        await prisma.quizAttempt.deleteMany({ where: { userId } });
        await prisma.jobApplication.deleteMany({ where: { userId } });
        await prisma.walletTransaction.deleteMany({ where: { userId } });
        await prisma.withdrawalRequest.deleteMany({ where: { userId } });
        await prisma.leaveRequest.deleteMany({ where: { userId } });
        await prisma.chatMessage.deleteMany({ where: { senderId: userId } });
        await prisma.referral.deleteMany({ where: { studentId: userId } });

        // Delete agent profile if exists
        const agent = await prisma.agent.findUnique({ where: { userId } });
        if (agent) {
          await prisma.referral.deleteMany({ where: { agentId: agent.id } });
          await prisma.agentPayout.deleteMany({ where: { agentId: agent.id } });
          await prisma.agent.delete({ where: { userId } });
        }

        await prisma.user.delete({ where: { id: userId } });
        count++;
      } catch {
        // skip failed deletes
      }
    }
    await logActivity("permanent_delete", "user", undefined, `Permanently deleted ${count} users`, session.id, session.name);
    return NextResponse.json({ success: true, count });
  }

  return NextResponse.json({ error: "Invalid action. Use 'restore' or 'permanent_delete'" }, { status: 400 });
}
