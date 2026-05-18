import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ certNumber: string }> }) {
  const { certNumber } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { certNumber },
    include: {
      enrollment: {
        include: {
          student: { select: { name: true } },
          batch: {
            include: {
              program: {
                select: { title: true, domain: true, duration: true, mode: true },
              },
            },
          },
        },
      },
    },
  });

  if (!certificate) {
    return NextResponse.json({ valid: false, error: "Certificate not found" }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    certificate: {
      certNumber: certificate.certNumber,
      type: certificate.type,
      studentName: certificate.studentName,
      programName: certificate.programName,
      orgName: certificate.orgName,
      issueDate: certificate.issueDate,
      domain: certificate.enrollment.batch.program.domain,
      duration: certificate.enrollment.batch.program.duration,
      mode: certificate.enrollment.batch.program.mode,
    },
  });
}
