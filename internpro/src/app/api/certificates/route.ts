import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateCertNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get("enrollmentId");
  const certNumber = searchParams.get("certNumber");

  const where: Record<string, unknown> = {};
  if (enrollmentId) where.enrollmentId = enrollmentId;
  if (certNumber) where.certNumber = certNumber;

  const certificates = await prisma.certificate.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: { select: { name: true, email: true } },
          batch: { include: { program: { select: { title: true, domain: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(certificates);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["admin", "organization"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId, type } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        batch: { include: { program: { include: { organization: true } } } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    let certificate;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const certNumber = generateCertNumber();
        certificate = await prisma.certificate.create({
          data: {
            enrollmentId,
            certNumber,
            type: type || "completion",
            studentName: enrollment.student.name,
            programName: enrollment.batch.program.title,
            orgName: enrollment.batch.program.organization.name,
          },
        });
        break;
      } catch (err: unknown) {
        const isPrismaUnique = err instanceof Error && "code" in err && (err as Record<string, unknown>).code === "P2002";
        if (!isPrismaUnique || attempt === 4) throw err;
      }
    }

    return NextResponse.json(certificate, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate certificate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
