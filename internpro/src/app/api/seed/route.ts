import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Seed endpoint is disabled in production" }, { status: 403 });
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@internpro.com" } });
    if (existingAdmin) {
      return NextResponse.json({ message: "Seed data already exists" });
    }

    const adminPassword = await hashPassword("admin123");
    const mentorPassword = await hashPassword("mentor123");
    const studentPassword = await hashPassword("student123");

    const admin = await prisma.user.create({
      data: { name: "Admin User", email: "admin@internpro.com", password: adminPassword, role: "admin", phone: "+91 9999999999" },
    });

    const orgAdmin = await prisma.user.create({
      data: { name: "Org Admin", email: "org@internpro.com", password: adminPassword, role: "organization", phone: "+91 8888888888" },
    });

    const mentor = await prisma.user.create({
      data: { name: "Rahul Sharma", email: "mentor@internpro.com", password: mentorPassword, role: "mentor", phone: "+91 7777777777" },
    });

    const student1 = await prisma.user.create({
      data: { name: "Priya Singh", email: "student@internpro.com", password: studentPassword, role: "student", phone: "+91 6666666666" },
    });

    const student2 = await prisma.user.create({
      data: { name: "Amit Kumar", email: "amit@internpro.com", password: studentPassword, role: "student", phone: "+91 5555555555" },
    });

    const student3 = await prisma.user.create({
      data: { name: "Neha Gupta", email: "neha@internpro.com", password: studentPassword, role: "student", phone: "+91 4444444444" },
    });

    const org = await prisma.organization.create({
      data: {
        name: "TechSkill Academy",
        type: "institute",
        description: "Leading technology training institute offering industry-ready internship programs",
        website: "https://techskillacademy.com",
        address: "123 Tech Park, Noida, UP",
        phone: "+91 8888888888",
        adminId: orgAdmin.id,
      },
    });

    const program1 = await prisma.program.create({
      data: {
        title: "Full Stack Web Development",
        slug: "full-stack-web-development",
        description: "Learn HTML, CSS, JavaScript, React, Node.js, and build real-world projects. Pre-recorded video lessons with hands-on tasks.",
        domain: "web-dev",
        mode: "online",
        duration: 90,
        feeType: "paid",
        feeAmount: 4999,
        stipendAmount: 0,
        maxSeats: 100,
        isPublished: true,
        orgId: org.id,
      },
    });

    const program2 = await prisma.program.create({
      data: {
        title: "Digital Marketing Mastery",
        slug: "digital-marketing-mastery",
        description: "Master SEO, Social Media Marketing, Google Ads, Content Marketing with practical campaigns.",
        domain: "marketing",
        mode: "online",
        duration: 60,
        feeType: "free",
        feeAmount: 0,
        stipendAmount: 0,
        maxSeats: 200,
        isPublished: true,
        orgId: org.id,
      },
    });

    const program3 = await prisma.program.create({
      data: {
        title: "Data Science & AI Internship",
        slug: "data-science-ai-internship",
        description: "Hands-on data science internship with Python, ML, Deep Learning. Includes stipend for top performers.",
        domain: "data-science",
        mode: "hybrid",
        duration: 120,
        feeType: "stipend",
        feeAmount: 0,
        stipendAmount: 5000,
        maxSeats: 50,
        isPublished: true,
        orgId: org.id,
      },
    });

    const batch1 = await prisma.batch.create({
      data: {
        name: "Batch 2025-A",
        programId: program1.id,
        mentorId: mentor.id,
        startDate: new Date("2025-05-01"),
        endDate: new Date("2025-07-30"),
      },
    });

    const batch2 = await prisma.batch.create({
      data: {
        name: "DM Batch 1",
        programId: program2.id,
        mentorId: mentor.id,
        startDate: new Date("2025-05-15"),
        endDate: new Date("2025-07-15"),
      },
    });

    const batch3 = await prisma.batch.create({
      data: {
        name: "DS Batch 2025",
        programId: program3.id,
        mentorId: mentor.id,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-09-30"),
      },
    });

    const enrollment1 = await prisma.enrollment.create({
      data: { studentId: student1.id, batchId: batch1.id, status: "active" },
    });

    const enrollment2 = await prisma.enrollment.create({
      data: { studentId: student2.id, batchId: batch1.id, status: "active" },
    });

    const enrollment3 = await prisma.enrollment.create({
      data: { studentId: student3.id, batchId: batch2.id, status: "active" },
    });

    await prisma.enrollment.create({
      data: { studentId: student1.id, batchId: batch3.id, status: "approved" },
    });

    const today = new Date();
    for (let i = 0; i < 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      await prisma.attendance.createMany({
        data: [
          { enrollmentId: enrollment1.id, userId: student1.id, date, status: i % 5 === 0 ? "absent" : "present", method: "online", checkIn: "09:00", checkOut: "17:00" },
          { enrollmentId: enrollment2.id, userId: student2.id, date, status: i % 7 === 0 ? "late" : "present", method: "online", checkIn: i % 7 === 0 ? "10:30" : "09:15", checkOut: "17:00" },
          { enrollmentId: enrollment3.id, userId: student3.id, date, status: "present", method: "qr", checkIn: "09:00", checkOut: "18:00" },
        ],
      });
    }

    await prisma.task.createMany({
      data: [
        { batchId: batch1.id, title: "Setup Development Environment", description: "Install VS Code, Node.js, Git. Watch the setup video and submit a screenshot.", type: "regular", points: 10, order: 1 },
        { batchId: batch1.id, title: "Build a Portfolio Website", description: "Create a personal portfolio using HTML & CSS. Must include About, Projects, and Contact sections.", type: "regular", points: 25, order: 2, dueDate: new Date("2025-05-20") },
        { batchId: batch1.id, title: "JavaScript Mini Project", description: "Build a Todo App or Calculator using vanilla JavaScript.", type: "regular", points: 30, order: 3, dueDate: new Date("2025-06-01") },
        { batchId: batch1.id, title: "URGENT: Client Logo Design Review", description: "Our client needs feedback on their new logo designs. Review the attached designs and submit your analysis report.", type: "urgent", points: 15, order: 4 },
        { batchId: batch1.id, title: "React Basics Assessment", description: "Complete the React fundamentals quiz and build a simple counter app.", type: "assessment", points: 50, order: 5, dueDate: new Date("2025-06-15") },
        { batchId: batch2.id, title: "SEO Audit Report", description: "Perform an SEO audit on any website and submit a detailed report.", type: "regular", points: 20, order: 1 },
        { batchId: batch2.id, title: "Social Media Campaign Plan", description: "Create a 30-day social media content calendar for a hypothetical brand.", type: "regular", points: 30, order: 2 },
      ],
    });

    await prisma.resource.createMany({
      data: [
        { batchId: batch1.id, title: "Week 1: HTML & CSS Fundamentals", type: "video", url: "https://www.youtube.com/watch?v=example1", order: 1 },
        { batchId: batch1.id, title: "Week 2: JavaScript Basics", type: "video", url: "https://www.youtube.com/watch?v=example2", order: 2 },
        { batchId: batch1.id, title: "Week 3: React Introduction", type: "video", url: "https://www.youtube.com/watch?v=example3", order: 3 },
        { batchId: batch1.id, title: "HTML Cheat Sheet", type: "pdf", url: "https://htmlcheatsheet.com", order: 4 },
        { batchId: batch1.id, title: "MDN Web Docs", type: "link", url: "https://developer.mozilla.org", order: 5 },
        { batchId: batch2.id, title: "SEO Fundamentals Course", type: "video", url: "https://www.youtube.com/watch?v=example4", order: 1 },
        { batchId: batch2.id, title: "Google Ads Guide", type: "pdf", url: "https://ads.google.com/guide", order: 2 },
      ],
    });

    const tasks = await prisma.task.findMany({ where: { batchId: batch1.id }, take: 2 });
    if (tasks.length >= 2) {
      await prisma.submission.createMany({
        data: [
          { taskId: tasks[0].id, studentId: student1.id, content: "Completed setup. Screenshot attached.", status: "approved", grade: "A" },
          { taskId: tasks[1].id, studentId: student1.id, content: "Portfolio link: https://priya-portfolio.netlify.app", status: "submitted" },
          { taskId: tasks[0].id, studentId: student2.id, content: "All tools installed successfully.", status: "approved", grade: "A" },
        ],
      });
    }

    await prisma.payment.createMany({
      data: [
        { enrollmentId: enrollment1.id, amount: 4999, type: "fee", status: "completed", method: "razorpay", description: "Full Stack Web Development - Course Fee" },
        { enrollmentId: enrollment2.id, amount: 4999, type: "fee", status: "completed", method: "upi", description: "Full Stack Web Development - Course Fee" },
      ],
    });

    await prisma.notification.createMany({
      data: [
        { userId: student1.id, title: "Welcome to InternPro!", message: "Your enrollment in Full Stack Web Development has been approved.", type: "success" },
        { userId: student1.id, title: "New Task Assigned", message: "Setup Development Environment - Complete before the deadline.", type: "info" },
        { userId: admin.id, title: "New Enrollment", message: "Priya Singh has enrolled in Full Stack Web Development.", type: "info" },
        { userId: mentor.id, title: "New Student", message: "You have a new student in Batch 2025-A.", type: "info" },
      ],
    });

    return NextResponse.json({
      message: "Seed data created successfully. Check Settings page for demo credentials.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
