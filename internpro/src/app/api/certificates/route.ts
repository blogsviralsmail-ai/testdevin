import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { enrollmentId } = await request.json();
  if (!enrollmentId) return NextResponse.json({ error: "enrollmentId required" }, { status: 400 });

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      batch: { include: { program: { include: { organization: true } } } },
    },
  });

  if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  if (enrollment.status !== "completed") return NextResponse.json({ error: "Internship not completed yet" }, { status: 400 });

  const existing = await prisma.certificate.findFirst({ where: { enrollmentId, type: "completion" } });
  if (existing) return NextResponse.json({ error: "Certificate already generated", certificate: existing }, { status: 409 });

  const certNumber = `CERT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const qrData = `https://internship.kkhsmedia.com/verify/${certNumber}`;

  const certificate = await prisma.certificate.create({
    data: {
      enrollmentId,
      certNumber,
      type: "completion",
      studentName: enrollment.student.name,
      programName: enrollment.batch.program.title,
      orgName: enrollment.batch.program.organization.name,
      qrCode: qrData,
    },
  });

  await logActivity("generated", "certificate", certificate.id, `Certificate ${certNumber} for ${enrollment.student.name}`, session.id, session.name);

  return NextResponse.json({ certificate });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where: Record<string, unknown> = {};
  if (session.role === "student") {
    const enrollments = await prisma.enrollment.findMany({ where: { studentId: session.id }, select: { id: true } });
    where.enrollmentId = { in: enrollments.map(e => e.id) };
  }

  const certificates = await prisma.certificate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { enrollment: { include: { student: { select: { name: true, email: true } }, batch: { include: { program: { select: { title: true } } } } } } },
  });

  return NextResponse.json({ certificates });
}
