import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<string, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  selected: "Selected",
  active: "Working / Currently Interning",
  completed: "Internship Completed",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  dropped: "Dropped Out",
  terminated: "Terminated",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const number = searchParams.get("number")?.trim();

  if (!number) {
    return NextResponse.json({ valid: false, error: "Number is required" }, { status: 400 });
  }

  // Search across all letter/certificate types
  const [offerLetter, experienceLetter, certificate] = await Promise.all([
    prisma.offerLetter.findFirst({
      where: { letterNumber: number },
      include: {
        enrollment: {
          include: {
            student: { select: { name: true, email: true } },
            batch: { include: { program: { select: { title: true, domain: true, duration: true, mode: true } } } },
          },
        },
      },
    }),
    prisma.experienceLetter.findFirst({
      where: { letterNumber: number },
      include: {
        enrollment: {
          include: {
            student: { select: { name: true, email: true } },
            batch: { include: { program: { select: { title: true, domain: true, duration: true, mode: true } } } },
          },
        },
      },
    }),
    prisma.certificate.findFirst({
      where: { certNumber: number },
      include: {
        enrollment: {
          include: {
            student: { select: { name: true } },
            batch: { include: { program: { select: { title: true, domain: true, duration: true, mode: true } } } },
          },
        },
      },
    }),
  ]);

  if (offerLetter) {
    const prog = offerLetter.enrollment.batch.program;
    const enrollStatus = offerLetter.enrollment.status;
    return NextResponse.json({
      valid: true,
      type: "Offer Letter",
      data: {
        number: offerLetter.letterNumber,
        studentName: offerLetter.enrollment.student.name,
        programName: prog.title,
        domain: prog.domain,
        duration: prog.duration,
        mode: prog.mode,
        issuedAt: offerLetter.issuedAt,
        currentStatus: statusLabels[enrollStatus] || enrollStatus,
        enrolledAt: offerLetter.enrollment.enrolledAt,
        completedAt: offerLetter.enrollment.completedAt,
      },
    });
  }

  if (experienceLetter) {
    const prog = experienceLetter.enrollment.batch.program;
    const enrollStatus = experienceLetter.enrollment.status;
    return NextResponse.json({
      valid: true,
      type: "Experience Certificate",
      data: {
        number: experienceLetter.letterNumber,
        studentName: experienceLetter.enrollment.student.name,
        programName: prog.title,
        domain: prog.domain,
        duration: prog.duration,
        mode: prog.mode,
        category: experienceLetter.category,
        issuedAt: experienceLetter.issuedAt,
        currentStatus: statusLabels[enrollStatus] || enrollStatus,
        enrolledAt: experienceLetter.enrollment.enrolledAt,
        completedAt: experienceLetter.enrollment.completedAt,
      },
    });
  }

  if (certificate) {
    const enrollStatus = certificate.enrollment.status;
    return NextResponse.json({
      valid: true,
      type: "Certificate",
      data: {
        number: certificate.certNumber,
        studentName: certificate.studentName,
        programName: certificate.programName,
        orgName: certificate.orgName,
        issuedAt: certificate.issueDate,
        currentStatus: statusLabels[enrollStatus] || enrollStatus,
        enrolledAt: certificate.enrollment.enrolledAt,
        completedAt: certificate.enrollment.completedAt,
      },
    });
  }

  return NextResponse.json({ valid: false, error: "Document not found" }, { status: 404 });
}
