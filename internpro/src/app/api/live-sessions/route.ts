import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLiveSessionEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");

  const where: Record<string, unknown> = {};
  if (programId) where.programId = programId;

  // Students see only their enrolled program's live sessions + general sessions
  if (session.role === "student" && !programId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.id, status: { in: ["selected", "active", "completed"] } },
      include: { batch: { select: { programId: true } } },
    });
    if (enrollments.length > 0) {
      const myProgramIds = enrollments.map(e => e.batch.programId);
      where.OR = [
        { programId: { in: myProgramIds } },
        { programId: null },
      ];
    }
  }

  const sessions = await prisma.liveSession.findMany({
    where,
    orderBy: { scheduledAt: "desc" },
  });

  const hostIds = [...new Set(sessions.map(s => s.hostId))];
  const hosts = await prisma.user.findMany({ where: { id: { in: hostIds } }, select: { id: true, name: true } });
  const hostMap = Object.fromEntries(hosts.map(h => [h.id, h]));

  // Get program titles
  const programIds = [...new Set(sessions.filter(s => s.programId).map(s => s.programId!))];
  const programs = programIds.length ? await prisma.program.findMany({ where: { id: { in: programIds } }, select: { id: true, title: true } }) : [];
  const programMap = Object.fromEntries(programs.map(p => [p.id, p.title]));

  return NextResponse.json(sessions.map(s => ({
    ...s,
    hostName: hostMap[s.hostId]?.name || "Unknown",
    programTitle: s.programId ? programMap[s.programId] || null : null,
  })));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, programId, batchId, meetLink, platform, scheduledAt, duration } = await request.json();
  if (!title || !scheduledAt) return NextResponse.json({ error: "Title and schedule required" }, { status: 400 });

  const liveSession = await prisma.liveSession.create({
    data: { title, description, programId, batchId, hostId: session.id, meetLink, platform: platform || "google_meet", scheduledAt: new Date(scheduledAt), duration: duration || 60 },
  });

  // Email all students in the batch/program about new live session (non-blocking)
  const enrollWhere: Record<string, unknown> = { status: { in: ["selected", "active"] } };
  if (batchId) enrollWhere.batchId = batchId;
  else if (programId) {
    const batches = await prisma.batch.findMany({ where: { programId }, select: { id: true } });
    enrollWhere.batchId = { in: batches.map(b => b.id) };
  }
  const enrollments = await prisma.enrollment.findMany({ where: enrollWhere, select: { student: { select: { name: true, email: true } } } });
  const schedStr = new Date(scheduledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  for (const e of enrollments) {
    if (e.student.email) sendLiveSessionEmail(e.student.name, e.student.email, title, schedStr, meetLink || "").catch(() => {});
  }

  return NextResponse.json(liveSession, { status: 201 });
}
