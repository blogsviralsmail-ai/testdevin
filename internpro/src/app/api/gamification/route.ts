import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeaderboardEmail } from "@/lib/email";

// GET - Leaderboard + user points/badges
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all"; // weekly, monthly, all

  let dateFilter: Date | undefined;
  if (period === "weekly") {
    dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 7);
  } else if (period === "monthly") {
    dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 1);
  }

  // Get leaderboard
  const allPoints = await prisma.gamificationPoint.groupBy({
    by: ["userId"],
    _sum: { points: true },
    ...(dateFilter ? { where: { createdAt: { gte: dateFilter } } } : {}),
    orderBy: { _sum: { points: "desc" } },
    take: 50,
  });

  const userIds = allPoints.map(p => p.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true, employeeId: true },
  });

  const leaderboard = allPoints.map((p, idx) => {
    const user = users.find(u => u.id === p.userId);
    return { rank: idx + 1, userId: p.userId, name: user?.name || "Unknown", avatar: user?.avatar, employeeId: user?.employeeId, points: p._sum.points || 0 };
  });

  // Get current user stats
  const myPoints = await prisma.gamificationPoint.aggregate({
    where: { userId: session.id, ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}) },
    _sum: { points: true },
  });

  const myBadges = await prisma.userBadge.findMany({
    where: { userId: session.id },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });

  const myRank = leaderboard.findIndex(l => l.userId === session.id) + 1;

  // All badges for display
  const allBadges = await prisma.badge.findMany({ orderBy: { threshold: "asc" } });

  return NextResponse.json({
    leaderboard,
    myStats: { points: myPoints._sum.points || 0, rank: myRank || leaderboard.length + 1, badges: myBadges },
    allBadges,
  });
}

// POST - Award points (admin/system)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, points, reason, category } = await request.json();
  if (!userId || !points || !reason) {
    return NextResponse.json({ error: "userId, points, and reason required" }, { status: 400 });
  }

  const point = await prisma.gamificationPoint.create({
    data: { userId, points, reason, category: category || "bonus" },
  });

  // Send leaderboard email to user (non-blocking)
  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  const totalPts = await prisma.gamificationPoint.aggregate({ where: { userId }, _sum: { points: true } });
  const allRanked = await prisma.gamificationPoint.groupBy({ by: ["userId"], _sum: { points: true }, orderBy: { _sum: { points: "desc" } } });
  const userRank = allRanked.findIndex(r => r.userId === userId) + 1;
  if (targetUser?.email) {
    sendLeaderboardEmail(targetUser.name, targetUser.email, points, userRank || 1, reason).catch(() => {});
  }

  // Check badge eligibility
  const totalPoints = await prisma.gamificationPoint.aggregate({
    where: { userId },
    _sum: { points: true },
  });

  const badges = await prisma.badge.findMany({ where: { threshold: { lte: totalPoints._sum.points || 0 } } });
  for (const badge of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    });
  }

  return NextResponse.json(point);
}
