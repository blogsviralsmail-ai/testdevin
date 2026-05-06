const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seed() {
  const studentHash = await bcrypt.hash("student123", 10);
  const leaderHash = await bcrypt.hash("leader123", 10);

  // Get existing data
  const admin = await prisma.user.findUnique({ where: { email: "admin@internpro.com" } });
  const org = await prisma.organization.findFirst();
  const leader = await prisma.user.findUnique({ where: { email: "leader@internpro.com" } });
  const programs = await prisma.program.findMany();
  const batches = await prisma.batch.findMany();

  if (!admin || !org || !leader) {
    console.error("Base seed data not found. Run seed-vps.js first.");
    process.exit(1);
  }

  // Create 2 more team leaders
  const leader2 = await prisma.user.create({ data: { name: "Sunita Verma", email: "sunita@internpro.com", password: leaderHash, role: "teamleader", phone: "+91 9988776611" } });
  const leader3 = await prisma.user.create({ data: { name: "Vikram Singh", email: "vikram@internpro.com", password: leaderHash, role: "teamleader", phone: "+91 9988776622" } });
  console.log("Created 2 more team leaders");

  // Create 12 more students
  const studentData = [
    { name: "Neha Gupta", email: "neha@internpro.com", phone: "+91 9876543301", collegeName: "Delhi University", degree: "BCA", year: "3rd" },
    { name: "Rohit Jain", email: "rohit@internpro.com", phone: "+91 9876543302", collegeName: "BITS Pilani", degree: "B.Tech", year: "2nd" },
    { name: "Sneha Patel", email: "sneha@internpro.com", phone: "+91 9876543303", collegeName: "Gujarat University", degree: "MCA", year: "1st" },
    { name: "Arjun Reddy", email: "arjun@internpro.com", phone: "+91 9876543304", collegeName: "JNTU Hyderabad", degree: "B.Tech", year: "4th" },
    { name: "Kavita Sharma", email: "kavita@internpro.com", phone: "+91 9876543305", collegeName: "Pune University", degree: "MBA", year: "2nd" },
    { name: "Deepak Yadav", email: "deepak@internpro.com", phone: "+91 9876543306", collegeName: "BHU Varanasi", degree: "B.Com", year: "3rd" },
    { name: "Pooja Mishra", email: "pooja@internpro.com", phone: "+91 9876543307", collegeName: "Lucknow University", degree: "BA", year: "2nd" },
    { name: "Raj Malhotra", email: "raj@internpro.com", phone: "+91 9876543308", collegeName: "Amity University", degree: "B.Tech", year: "3rd" },
    { name: "Anita Kumari", email: "anita@internpro.com", phone: "+91 9876543309", collegeName: "Patna University", degree: "BCA", year: "2nd" },
    { name: "Manish Tiwari", email: "manish@internpro.com", phone: "+91 9876543310", collegeName: "RGPV Bhopal", degree: "B.Tech", year: "3rd" },
    { name: "Sakshi Agarwal", email: "sakshi@internpro.com", phone: "+91 9876543311", collegeName: "Chandigarh University", degree: "MCA", year: "1st" },
    { name: "Vivek Chauhan", email: "vivek@internpro.com", phone: "+91 9876543312", collegeName: "IIT Bombay", degree: "M.Tech", year: "2nd" },
  ];

  const students = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: { ...s, password: studentHash, role: "student" },
    });
    students.push(user);
  }
  console.log(`Created ${students.length} students`);

  // Create 2 more programs
  const p4 = await prisma.program.create({ data: { title: "Mobile App Development", slug: "mobile-app-dev", domain: "app-dev", duration: 60, mode: "online", feeType: "paid", feeAmount: 2999, orgId: org.id, description: "React Native se mobile apps banana seekho", maxSeats: 25, isPublished: true } });
  const p5 = await prisma.program.create({ data: { title: "Graphic Design Training", slug: "graphic-design", domain: "design", duration: 30, mode: "hybrid", feeType: "free", orgId: org.id, description: "Canva, Figma, Photoshop se design seekho", maxSeats: 40, isPublished: true } });
  console.log("Created 2 more programs");

  // Create 3 more batches
  const b3 = await prisma.batch.create({ data: { name: "Batch 2025-C", programId: p4.id, leaderId: leader2.id, startDate: new Date("2025-03-01"), endDate: new Date("2025-05-01") } });
  const b4 = await prisma.batch.create({ data: { name: "Batch 2025-D", programId: p5.id, leaderId: leader3.id, startDate: new Date("2025-03-15"), endDate: new Date("2025-04-15") } });
  const b5 = await prisma.batch.create({ data: { name: "Batch 2025-E", programId: programs[0].id, leaderId: leader2.id, startDate: new Date("2025-04-01"), endDate: new Date("2025-07-01") } });
  console.log("Created 3 more batches");

  const allBatches = [...batches, b3, b4, b5];

  // Create enrollments - various statuses
  const statuses = ["pending", "interview_scheduled", "selected", "active", "completed", "rejected", "dropped"];
  const enrollments = [];

  // Student 0-2: active in batch b1 (Web Dev)
  for (let i = 0; i < 3; i++) {
    const e = await prisma.enrollment.create({ data: {
      studentId: students[i].id, batchId: batches[0].id, status: "active",
      salary: 5000, weekoffs: 2, paidLeaves: 2, workTiming: "10:00 AM - 6:00 PM",
      joiningDate: new Date("2025-01-20"), feeType: "stipend", stipendAmount: 5000,
      currentWorkDay: 3 + i,
    }});
    enrollments.push(e);
  }

  // Student 3-4: selected for Mobile App Dev
  for (let i = 3; i < 5; i++) {
    const e = await prisma.enrollment.create({ data: {
      studentId: students[i].id, batchId: b3.id, status: "selected",
      salary: 3000, weekoffs: 1, paidLeaves: 1, workTiming: "9:00 AM - 5:00 PM",
      joiningDate: new Date("2025-03-01"), feeType: "paid", feeAmount: 2999,
      currentWorkDay: 1,
    }});
    enrollments.push(e);
  }

  // Student 5-6: interview scheduled
  for (let i = 5; i < 7; i++) {
    const e = await prisma.enrollment.create({ data: {
      studentId: students[i].id, batchId: b4.id, status: "interview_scheduled",
      currentWorkDay: 0,
    }});
    enrollments.push(e);
    await prisma.interview.create({ data: {
      enrollmentId: e.id, interviewerId: admin.id,
      scheduledAt: new Date(`2025-03-${10 + i}T10:00:00Z`),
      duration: 30, mode: "online", meetLink: "https://meet.google.com/xyz-abcd-efg",
      status: "scheduled",
    }});
  }

  // Student 7-8: pending (just applied)
  for (let i = 7; i < 9; i++) {
    const e = await prisma.enrollment.create({ data: {
      studentId: students[i].id, batchId: b5.id, status: "pending",
      currentWorkDay: 0,
    }});
    enrollments.push(e);
  }

  // Student 9: completed
  const eCompleted = await prisma.enrollment.create({ data: {
    studentId: students[9].id, batchId: batches[0].id, status: "completed",
    salary: 5000, weekoffs: 2, paidLeaves: 2, workTiming: "10:00 AM - 6:00 PM",
    joiningDate: new Date("2024-10-01"), feeType: "stipend", stipendAmount: 5000,
    currentWorkDay: 90, teamLeaderCategory: "excellent", teamLeaderRemarks: "Outstanding performance",
    adminApproved: true, adminRemarks: "Well done", completedAt: new Date("2025-01-01"),
  }});
  enrollments.push(eCompleted);

  // Student 10: rejected
  await prisma.enrollment.create({ data: {
    studentId: students[10].id, batchId: b4.id, status: "rejected", currentWorkDay: 0,
  }});

  // Student 11: dropped
  await prisma.enrollment.create({ data: {
    studentId: students[11].id, batchId: batches[0].id, status: "dropped",
    salary: 5000, weekoffs: 2, paidLeaves: 2, workTiming: "10:00 AM - 6:00 PM",
    joiningDate: new Date("2025-01-15"), feeType: "stipend", stipendAmount: 5000,
    currentWorkDay: 15,
  }});

  console.log("Created enrollments with various statuses");

  // Create tasks for Mobile App Dev batch
  for (let day = 1; day <= 10; day++) {
    await prisma.task.create({ data: {
      batchId: b3.id, title: `Day ${day}: React Native - ${["Setup", "Components", "Navigation", "State Management", "API Integration", "Animations", "Push Notifications", "Local Storage", "Testing", "Deployment"][day-1]}`,
      description: `Complete the Day ${day} module and submit your work`, dayNumber: day, type: "daily", maxPoints: 100,
    }});
  }

  // Create tasks for Design batch
  for (let day = 1; day <= 5; day++) {
    await prisma.task.create({ data: {
      batchId: b4.id, title: `Day ${day}: Design - ${["Canva Basics", "Figma Layout", "Color Theory", "Typography", "Portfolio"][day-1]}`,
      description: `Complete the Day ${day} design assignment`, dayNumber: day, type: "daily", maxPoints: 100,
    }});
  }

  // Add urgent tasks
  await prisma.task.create({ data: { batchId: b3.id, title: "URGENT: Client App Bug Fix", description: "Critical bug in login screen - fix immediately", dayNumber: 0, type: "urgent", maxPoints: 100, isUrgent: true } });
  await prisma.task.create({ data: { batchId: batches[0].id, title: "URGENT: Website Redesign Feedback", description: "Client wants feedback on new design by EOD", dayNumber: 0, type: "urgent", maxPoints: 100, isUrgent: true } });
  console.log("Created tasks for all batches");

  // Create resources for Mobile App Dev
  for (let day = 1; day <= 5; day++) {
    await prisma.resource.create({ data: { batchId: b3.id, title: `Day ${day}: React Native Video Tutorial`, type: "video", url: "https://youtube.com/watch?v=example", dayNumber: day } });
    await prisma.resource.create({ data: { batchId: b3.id, title: `Day ${day}: Documentation PDF`, type: "pdf", url: "https://example.com/docs.pdf", dayNumber: day } });
  }

  // Resources for Design
  for (let day = 1; day <= 3; day++) {
    await prisma.resource.create({ data: { batchId: b4.id, title: `Day ${day}: Design Tutorial`, type: "video", url: "https://youtube.com/watch?v=design", dayNumber: day } });
    await prisma.resource.create({ data: { batchId: b4.id, title: `Day ${day}: Design Assets`, type: "link", url: "https://figma.com/community", dayNumber: day } });
  }
  console.log("Created resources");

  // Create attendance for active students
  const existingEnrollments = await prisma.enrollment.findMany({ where: { status: "active" }, include: { student: true } });
  for (const enr of existingEnrollments) {
    for (let i = 0; i < Math.min(enr.currentWorkDay, 10); i++) {
      const d = new Date(enr.joiningDate || "2025-01-15");
      d.setDate(d.getDate() + i);
      const statArr = ["present", "present", "present", "late", "present"];
      await prisma.attendance.create({ data: {
        enrollmentId: enr.id, userId: enr.studentId, date: d,
        status: statArr[i % 5], checkIn: i % 5 === 3 ? "10:45" : "10:00",
        method: i === 0 ? "auto" : "manual",
      }}).catch(() => {}); // ignore duplicates
    }
  }
  console.log("Created attendance records");

  // Create submissions for active students
  const webDevTasks = await prisma.task.findMany({ where: { batchId: batches[0].id, type: "daily" }, take: 5 });
  for (const enr of existingEnrollments.filter(e => e.batchId === batches[0].id)) {
    for (let t = 0; t < Math.min(webDevTasks.length, enr.currentWorkDay); t++) {
      await prisma.submission.create({ data: {
        taskId: webDevTasks[t].id, studentId: enr.studentId,
        content: `Completed Day ${t+1} assignment - implemented the required features`,
        status: t < 2 ? "reviewed" : "submitted",
        percentage: t < 2 ? 60 + Math.floor(Math.random() * 40) : null,
        feedback: t < 2 ? "Good effort, keep improving!" : null,
      }}).catch(() => {});
    }
  }
  console.log("Created submissions");

  // Create support tickets
  const ticketData = [
    { subject: "Cannot access study materials", message: "Day 3 videos are not loading for me", priority: "high" },
    { subject: "Task submission error", message: "Getting error when trying to submit Day 2 task", priority: "urgent" },
    { subject: "Need certificate early", message: "My college needs the certificate before deadline, can you process it faster?", priority: "normal" },
    { subject: "Attendance not marked", message: "My attendance was not marked yesterday even though I was present", priority: "high" },
    { subject: "Stipend query", message: "When will this month's stipend be credited?", priority: "normal" },
  ];
  for (let i = 0; i < ticketData.length; i++) {
    const userId = i < 3 ? students[i].id : students[i + 3].id;
    await prisma.supportTicket.create({ data: {
      userId, ...ticketData[i],
      status: i === 0 ? "resolved" : i === 1 ? "in-progress" : "open",
      reply: i === 0 ? "Issue has been fixed. Please try again and let us know." : i === 1 ? "We are looking into this. Will update you soon." : null,
    }});
  }
  console.log("Created 5 support tickets");

  // Create offer letter for completed student
  await prisma.offerLetter.create({ data: {
    enrollmentId: eCompleted.id,
    letterNumber: `OL-2024-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    htmlContent: `<div style="font-family:sans-serif;padding:40px;max-width:700px;margin:auto"><h1 style="color:#4F46E5">KKH Media</h1><h2>Offer Letter</h2><p>Dear Manish Tiwari,</p><p>We are pleased to offer you the position of Web Development Intern.</p><p><strong>Program:</strong> Web Development Internship<br><strong>Duration:</strong> 90 days<br><strong>Stipend:</strong> ₹5,000/month<br><strong>Mode:</strong> Online</p><p>Welcome aboard!</p><p><br>HR Department<br>KKH Media</p></div>`,
  }});

  // Create experience letter for completed student
  await prisma.experienceLetter.create({ data: {
    enrollmentId: eCompleted.id,
    letterNumber: `EXP-2025-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    category: "excellent",
    htmlContent: `<div style="font-family:sans-serif;padding:40px;max-width:700px;margin:auto"><h1 style="color:#4F46E5">KKH Media</h1><h2>Experience Letter</h2><p>This is to certify that <strong>Manish Tiwari</strong> has successfully completed the Web Development Internship program.</p><p><strong>Duration:</strong> 90 days<br><strong>Category:</strong> Excellent<br><strong>Performance:</strong> Outstanding</p><p>We wish them all the best for their future endeavors.</p><p><br>Admin<br>KKH Media</p></div>`,
  }});
  console.log("Created offer letter and experience letter");

  // Create payments
  await prisma.payment.create({ data: { enrollmentId: enrollments[3].id, amount: 2999, type: "fee", status: "completed", method: "razorpay", description: "Course fee payment" } });
  await prisma.payment.create({ data: { enrollmentId: enrollments[4].id, amount: 2999, type: "fee", status: "pending", description: "Course fee - pending" } });
  console.log("Created payment records");

  // Create salary records
  await prisma.salary.create({ data: { enrollmentId: eCompleted.id, month: "2024-12", amount: 4500, attendanceDays: 27, totalDays: 30, status: "paid" } });
  await prisma.salary.create({ data: { enrollmentId: eCompleted.id, month: "2024-11", amount: 5000, attendanceDays: 30, totalDays: 30, status: "paid" } });
  await prisma.salary.create({ data: { enrollmentId: enrollments[0].id, month: "2025-01", amount: 3500, attendanceDays: 21, totalDays: 30, status: "pending" } });
  console.log("Created salary records");

  // Settings
  const settings = [
    { key: "company_name", value: "KKH Media" },
    { key: "support_email", value: "support@kkhsmedia.com" },
    { key: "support_phone", value: "+91 98765 43210" },
    { key: "website_url", value: "https://kkhsmedia.com" },
    { key: "tagline", value: "India's Leading Internship Platform" },
    { key: "email_notifications", value: "true" },
    { key: "auto_attendance", value: "true" },
  ];
  for (const s of settings) {
    await prisma.setting.create({ data: s });
  }
  console.log("Created settings");

  // Letter templates
  await prisma.offerLetterTemplate.create({ data: {
    name: "Default Offer Letter",
    htmlContent: `<div style="font-family:Georgia,serif;padding:40px;max-width:700px;margin:auto;border:2px solid #4F46E5"><div style="text-align:center;border-bottom:2px solid #4F46E5;padding-bottom:20px"><h1 style="color:#4F46E5;margin:0">{{company_name}}</h1><p style="color:#666">Internship Offer Letter</p></div><p style="text-align:right">Letter No: {{letter_number}}<br>Date: {{date}}</p><p>Dear <strong>{{student_name}}</strong>,</p><p>We are pleased to offer you an internship position in our <strong>{{program_name}}</strong> program.</p><table style="width:100%;border-collapse:collapse;margin:20px 0"><tr><td style="padding:8px;border:1px solid #ddd"><strong>Duration</strong></td><td style="padding:8px;border:1px solid #ddd">{{duration}} days</td></tr><tr><td style="padding:8px;border:1px solid #ddd"><strong>Mode</strong></td><td style="padding:8px;border:1px solid #ddd">{{mode}}</td></tr><tr><td style="padding:8px;border:1px solid #ddd"><strong>Joining Date</strong></td><td style="padding:8px;border:1px solid #ddd">{{joining_date}}</td></tr><tr><td style="padding:8px;border:1px solid #ddd"><strong>Stipend</strong></td><td style="padding:8px;border:1px solid #ddd">₹{{salary}}/month</td></tr><tr><td style="padding:8px;border:1px solid #ddd"><strong>Work Timing</strong></td><td style="padding:8px;border:1px solid #ddd">{{work_timing}}</td></tr><tr><td style="padding:8px;border:1px solid #ddd"><strong>Week Offs</strong></td><td style="padding:8px;border:1px solid #ddd">{{weekoffs}} days/week</td></tr></table><p>We look forward to having you on our team!</p><p style="margin-top:40px">Regards,<br><strong>{{company_name}}</strong></p></div>`,
    isDefault: true,
  }});
  await prisma.offerLetterTemplate.create({ data: {
    name: "Simple Offer Letter",
    htmlContent: `<div style="font-family:sans-serif;padding:30px"><h2>{{company_name}} - Offer Letter</h2><p>Dear {{student_name}},</p><p>Congratulations! You have been selected for {{program_name}}.</p><p>Start Date: {{joining_date}} | Duration: {{duration}} days | Stipend: ₹{{salary}}</p><p>Best wishes,<br>{{company_name}} Team</p></div>`,
    isDefault: false,
  }});
  console.log("Created letter templates");

  console.log("\n=== SEED COMPLETE ===");
  console.log("Total new students: 12");
  console.log("Total new team leaders: 2");
  console.log("Total new programs: 2");
  console.log("Total new batches: 3");
  console.log("Enrollments: active(3), selected(2), interview(2), pending(2), completed(1), rejected(1), dropped(1)");
  console.log("Support tickets: 5");
  console.log("Letter templates: 2");
  console.log("Settings: 7");
}

seed().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
