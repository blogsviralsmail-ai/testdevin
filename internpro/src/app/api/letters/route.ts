import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const searchType = searchParams.get("type") || "name"; // name | employee_id | phone

  // Build enrollment filter based on role
  const enrollmentWhere: Record<string, unknown> = {
    status: { in: ["selected", "completed"] },
  };

  if (session.role === "student") {
    enrollmentWhere.studentId = session.id;
    enrollmentWhere.paymentStatus = { not: "pending" };
  } else if (session.role === "teamleader") {
    // Team leader sees only their team's batches
    const tlBatches = await prisma.batch.findMany({
      where: { leaderId: session.id },
      select: { id: true },
    });
    enrollmentWhere.batchId = { in: tlBatches.map((b) => b.id) };
  }
  // admin/organization sees all

  // Apply search filter
  if (search) {
    if (searchType === "all") {
      // Search across name, phone, employee ID, email
      const matchingCards = await prisma.employeeCard.findMany({
        where: { cardNumber: { contains: search } },
        select: { userId: true },
      });
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { employeeId: { contains: search } },
          ],
        },
        select: { id: true },
      });
      const userIds = [...new Set([...matchingCards.map(c => c.userId), ...matchingUsers.map(u => u.id)])];
      if (session.role === "student") {
        enrollmentWhere.studentId = session.id;
      } else {
        enrollmentWhere.studentId = { in: userIds };
      }
    } else if (searchType === "name") {
      enrollmentWhere.student = { name: { contains: search } };
    } else if (searchType === "employee_id") {
      const matchingCards = await prisma.employeeCard.findMany({
        where: { cardNumber: { contains: search } },
        select: { userId: true },
      });
      const matchingEmpIds = await prisma.user.findMany({
        where: { employeeId: { contains: search } },
        select: { id: true },
      });
      const userIds = [...new Set([...matchingCards.map(c => c.userId), ...matchingEmpIds.map(u => u.id)])];
      enrollmentWhere.studentId = session.role === "student" ? session.id : { in: userIds };
    } else if (searchType === "phone") {
      enrollmentWhere.student = { phone: { contains: search } };
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: enrollmentWhere,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          employeeCards: {
            select: { id: true, cardNumber: true, designation: true },
            take: 1,
          },
        },
      },
      batch: {
        include: {
          program: { select: { title: true, domain: true, duration: true } },
        },
      },
      offerLetter: {
        select: { id: true, letterNumber: true, htmlContent: true, issuedAt: true },
      },
      experienceLetter: {
        select: { id: true, letterNumber: true, htmlContent: true, category: true, issuedAt: true },
      },
      certificates: {
        where: { type: "completion" },
        select: { id: true, certNumber: true, issueDate: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get ID cards for all students in results
  const studentIds = [...new Set(enrollments.map((e) => e.studentId))];
  const idCards = await prisma.employeeCard.findMany({
    where: { userId: { in: studentIds } },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatar: true, collegeName: true, address: true, dob: true } },
    },
  });
  const idCardMap = new Map(idCards.map((c) => [c.userId, c]));

  // Fetch current settings for dynamic logo/signature replacement
  const currentSettings = await prisma.setting.findMany({
    where: { key: { in: ["letterhead_logo", "admin_signature", "letterhead_company_name"] } },
  });
  const settingsMap: Record<string, string> = {};
  currentSettings.forEach((s) => { settingsMap[s.key] = s.value; });
  const currentLogo = settingsMap.letterhead_logo || "/uploads/kkhs-logo.png";
  const currentSignature = settingsMap.admin_signature || "";

  function replaceSettingsInHtml(html: string | null): string | null {
    if (!html) return html;
    let result = html;
    // Replace logo img (has object-fit:contain and NOT alt="Signature")
    result = result.replace(/<img\s([^>]*)\/?>/g, (match, attrs: string) => {
      if (attrs.includes('alt="Signature"')) {
        if (currentSignature) return match.replace(/src="[^"]*"/, `src="${currentSignature}"`);
        return match;
      }
      if (attrs.includes('object-fit:contain') && !attrs.includes('alt="Signature"')) {
        return match.replace(/src="[^"]*"/, `src="${currentLogo}"`);
      }
      return match;
    });
    return result;
  }

  // Map results
  const results = enrollments.map((enr) => ({
    enrollmentId: enr.id,
    studentId: enr.studentId,
    studentName: enr.student.name,
    studentEmail: enr.student.email,
    studentPhone: enr.student.phone,
    studentAvatar: enr.student.avatar,
    program: enr.batch.program.title,
    batch: enr.batch.name,
    domain: enr.batch.program.domain,
    duration: enr.batch.program.duration,
    status: enr.status,
    employeeCardNumber: enr.student.employeeCards[0]?.cardNumber || null,
    idCard: idCardMap.get(enr.studentId) ? {
      id: idCardMap.get(enr.studentId)!.id,
      cardNumber: idCardMap.get(enr.studentId)!.cardNumber,
    } : null,
    offerLetter: enr.offerLetter ? {
      id: enr.offerLetter.id,
      letterNumber: enr.offerLetter.letterNumber,
      htmlContent: replaceSettingsInHtml(enr.offerLetter.htmlContent),
      issuedAt: enr.offerLetter.issuedAt,
    } : null,
    experienceLetter: enr.experienceLetter ? {
      id: enr.experienceLetter.id,
      letterNumber: enr.experienceLetter.letterNumber,
      htmlContent: replaceSettingsInHtml(enr.experienceLetter.htmlContent),
      category: enr.experienceLetter.category,
      issuedAt: enr.experienceLetter.issuedAt,
    } : null,
    internshipCertificate: enr.certificates[0] ? {
      id: enr.certificates[0].id,
      certNumber: enr.certificates[0].certNumber,
      issueDate: enr.certificates[0].issueDate,
    } : null,
  }));

  return NextResponse.json(results);
}
