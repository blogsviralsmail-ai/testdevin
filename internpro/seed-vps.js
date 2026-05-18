const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seed() {
  const hash = await bcrypt.hash("admin123", 10);
  const leaderHash = await bcrypt.hash("leader123", 10);
  const studentHash = await bcrypt.hash("student123", 10);

  const admin = await prisma.user.create({ data: { name: "Admin User", email: "admin@internpro.com", password: hash, role: "admin", phone: "+91 9876543210" } });
  const org = await prisma.user.create({ data: { name: "Org Manager", email: "org@internpro.com", password: hash, role: "organization", phone: "+91 9876543211" } });
  const leader = await prisma.user.create({ data: { name: "Rahul Team Lead", email: "leader@internpro.com", password: leaderHash, role: "teamleader", phone: "+91 9876543212" } });
  const student = await prisma.user.create({ data: { name: "Priya Sharma", email: "student@internpro.com", password: studentHash, role: "student", phone: "+91 9876543213", collegeName: "IIT Delhi", degree: "B.Tech", year: "3rd" } });
  const amit = await prisma.user.create({ data: { name: "Amit Kumar", email: "amit@internpro.com", password: studentHash, role: "student", phone: "+91 9876543214", collegeName: "NIT Patna", degree: "BCA", year: "2nd" } });

  const orgRec = await prisma.organization.create({ data: { name: "KKH Media", type: "company", adminId: org.id, phone: "+91 98765 43210", website: "https://kkhsmedia.com" } });

  const p1 = await prisma.program.create({ data: { title: "Web Development Internship", slug: "web-dev-internship", domain: "web-dev", duration: 90, mode: "online", feeType: "stipend", stipendAmount: 5000, orgId: orgRec.id, description: "90 din ka web development course", maxSeats: 50, isPublished: true } });
  const p2 = await prisma.program.create({ data: { title: "Digital Marketing Internship", slug: "digital-marketing-internship", domain: "marketing", duration: 60, mode: "online", feeType: "free", orgId: orgRec.id, description: "60 din ka marketing course", maxSeats: 30, isPublished: true } });
  const p3 = await prisma.program.create({ data: { title: "Data Science Training", slug: "data-science-training", domain: "data-science", duration: 45, mode: "hybrid", feeType: "paid", feeAmount: 4999, orgId: orgRec.id, description: "45 din ka data science course", maxSeats: 20, isPublished: true } });

  const b1 = await prisma.batch.create({ data: { name: "Batch 2025-A", programId: p1.id, leaderId: leader.id, startDate: new Date("2025-01-15"), endDate: new Date("2025-04-15") } });
  const b2 = await prisma.batch.create({ data: { name: "Batch 2025-B", programId: p2.id, leaderId: leader.id, startDate: new Date("2025-02-01"), endDate: new Date("2025-04-01") } });

  const e1 = await prisma.enrollment.create({ data: { studentId: student.id, batchId: b1.id, status: "active", salary: 5000, weekoffs: 2, paidLeaves: 2, workTiming: "10:00 AM - 6:00 PM", joiningDate: new Date("2025-01-15"), feeType: "stipend", stipendAmount: 5000, currentWorkDay: 5 } });
  const e2 = await prisma.enrollment.create({ data: { studentId: amit.id, batchId: b2.id, status: "selected", salary: 0, weekoffs: 2, paidLeaves: 1, workTiming: "10:00 AM - 5:00 PM", joiningDate: new Date("2025-02-01"), feeType: "free", currentWorkDay: 1 } });

  // Tasks
  for (let day = 1; day <= 5; day++) {
    await prisma.task.create({ data: { batchId: b1.id, title: `Day ${day}: Web Dev Task`, description: `Complete the Day ${day} assignment`, dayNumber: day, type: "daily", maxPoints: 100 } });
  }
  await prisma.task.create({ data: { batchId: b1.id, title: "Urgent: Fix Landing Page Bug", description: "Client reported bug, fix ASAP", dayNumber: 0, type: "urgent", maxPoints: 100, isUrgent: true } });

  // Resources
  for (let day = 1; day <= 5; day++) {
    await prisma.resource.create({ data: { batchId: b1.id, title: `Day ${day}: HTML/CSS Video`, type: "video", url: "https://www.youtube.com/watch?v=example", dayNumber: day } });
    await prisma.resource.create({ data: { batchId: b1.id, title: `Day ${day}: Study Notes PDF`, type: "pdf", url: "https://example.com/notes.pdf", dayNumber: day } });
  }

  // Attendance
  for (let i = 0; i < 5; i++) {
    const d = new Date("2025-01-15");
    d.setDate(d.getDate() + i);
    await prisma.attendance.create({ data: { enrollmentId: e1.id, userId: student.id, date: d, status: i === 2 ? "late" : "present", checkIn: "10:00", method: i === 0 ? "auto" : "manual" } });
  }

  // Submissions
  const tasks = await prisma.task.findMany({ where: { batchId: b1.id, type: "daily" }, take: 3 });
  for (const task of tasks) {
    await prisma.submission.create({ data: { taskId: task.id, studentId: student.id, content: `Day ${task.dayNumber} work completed - built responsive layout`, status: "reviewed", percentage: 75 + Math.floor(Math.random() * 25), feedback: "Good work, keep it up!" } });
  }

  // Interview for Amit
  await prisma.interview.create({ data: { enrollmentId: e2.id, interviewerId: admin.id, scheduledAt: new Date("2025-02-10T11:00:00Z"), duration: 30, mode: "online", meetLink: "https://meet.google.com/abc-defg-hij", status: "scheduled" } });

  console.log("Seed completed successfully!");
  console.log("Admin:", admin.email, "/ admin123");
  console.log("Student:", student.email, "/ student123");
  console.log("Leader:", leader.email, "/ leader123");
}

seed().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
