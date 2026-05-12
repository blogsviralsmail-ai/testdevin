// One-time script: Auto-generate Internship Certificates for students with experience letters but no certificate
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient({
  datasources: { db: { url: "file:/var/www/internpro/prisma/dev.db" } },
});

function generateCertNumber() {
  const year = new Date().getFullYear();
  const bytes = crypto.randomBytes(8);
  const random = Array.from(bytes)
    .map((b) => b.toString(36))
    .join("")
    .substring(0, 12)
    .toUpperCase();
  return `IP-${year}-${random}`;
}

async function main() {
  // Find all enrollments with experience letters but no certificate
  const enrollments = await prisma.enrollment.findMany({
    where: {
      experienceLetter: { isNot: null },
    },
    include: {
      student: { select: { name: true } },
      batch: { include: { program: { include: { organization: true } } } },
      certificates: { where: { type: "completion" } },
      experienceLetter: true,
    },
  });

  let created = 0;
  for (const enr of enrollments) {
    if (enr.certificates.length > 0) {
      console.log(`Skip: ${enr.student.name} — already has certificate`);
      continue;
    }
    const certNumber = generateCertNumber();
    await prisma.certificate.create({
      data: {
        enrollmentId: enr.id,
        certNumber,
        type: "completion",
        studentName: enr.student.name,
        programName: enr.batch.program.title,
        orgName: enr.batch.program.organization.name,
      },
    });
    created++;
    console.log(`Created: ${enr.student.name} — ${certNumber}`);
  }
  console.log(`\nDone! Created ${created} certificates.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
