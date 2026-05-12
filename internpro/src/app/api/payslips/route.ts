import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const payslipId = searchParams.get("id");

  if (payslipId) {
    const payslip = await prisma.payslip.findUnique({ where: { id: payslipId } });
    if (!payslip) return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
    if (!["admin", "organization"].includes(session.role) && payslip.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user and enrollment info
    const user = await prisma.user.findUnique({ where: { id: payslip.userId }, select: { id: true, name: true, email: true, employeeId: true, phone: true } });
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: payslip.enrollmentId },
      include: { batch: { include: { program: { select: { title: true } } } } },
    });

    return NextResponse.json({ ...payslip, user, enrollment });
  }

  // List payslips (exclude soft-deleted users)
  const deletedUsers = await prisma.user.findMany({ where: { deletedAt: { not: null } }, select: { id: true } });
  const deletedIds = deletedUsers.map(u => u.id);
  const where: Record<string, unknown> = deletedIds.length ? { userId: { notIn: deletedIds } } : {};
  if (!["admin", "organization"].includes(session.role)) {
    where.userId = session.id;
  }

  const payslips = await prisma.payslip.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Enrich
  const userIds = [...new Set(payslips.map(p => p.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, employeeId: true } });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const enriched = payslips.map(p => ({ ...p, user: userMap[p.userId] || null }));
  return NextResponse.json(enriched);
}
