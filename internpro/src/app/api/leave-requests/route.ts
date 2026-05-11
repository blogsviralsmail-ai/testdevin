import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (["admin", "organization"].includes(session.role)) {
    if (userId) where.userId = userId;
  } else {
    where.userId = session.id;
  }

  const leaves = await prisma.leaveRequest.findMany({ where, orderBy: { createdAt: "desc" } });

  // Enrich with user info
  const userIds = [...new Set(leaves.map(l => l.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true, avatar: true } });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const enriched = leaves.map(l => ({ ...l, user: userMap[l.userId] || null }));
  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { leaveType, startDate, endDate, reason } = body;

  if (!startDate || !endDate || !reason) {
    return NextResponse.json({ error: "Start date, end date, and reason are required" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);

  // Get enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: session.id, status: { in: ["selected", "active", "completed"] } },
    orderBy: { createdAt: "desc" },
  });

  const leave = await prisma.leaveRequest.create({
    data: {
      userId: session.id,
      enrollmentId: enrollment?.id || null,
      leaveType: leaveType || "casual",
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "pending",
    },
  });

  return NextResponse.json(leave, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, action, adminRemarks } = body;

  if (!id || !action) {
    return NextResponse.json({ error: "ID and action required" }, { status: 400 });
  }

  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: action === "approve" ? "approved" : "rejected",
      approvedBy: session.id,
      adminRemarks: adminRemarks || null,
    },
  });

  return NextResponse.json(leave);
}
