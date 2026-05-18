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
    const leaderPassword = await hashPassword("leader123");
    const studentPassword = await hashPassword("student123");

    const admin = await prisma.user.create({
      data: { name: "Admin User", email: "admin@internpro.com", password: adminPassword, role: "admin", phone: "+91 9999999999" },
    });

    const orgAdmin = await prisma.user.create({
      data: { name: "Org Admin", email: "org@internpro.com", password: adminPassword, role: "organization", phone: "+91 8888888888" },
    });

    const leader = await prisma.user.create({
      data: { name: "Rahul Sharma", email: "leader@internpro.com", password: leaderPassword, role: "teamleader", phone: "+91 7777777777" },
    });

    const student1 = await prisma.user.create({
      data: {
        name: "Priya Singh", email: "student@internpro.com", password: studentPassword, role: "student",
        phone: "+91 6666666666", collegeName: "IIT Delhi", degree: "B.Tech", year: "3rd",
      },
    });

    const student2 = await prisma.user.create({
      data: {
        name: "Amit Kumar", email: "amit@internpro.com", password: studentPassword, role: "student",
        phone: "+91 5555555555", collegeName: "NIT Warangal", degree: "B.Tech", year: "4th",
      },
    });

    const student3 = await prisma.user.create({
      data: {
        name: "Neha Gupta", email: "neha@internpro.com", password: studentPassword, role: "student",
        phone: "+91 4444444444", collegeName: "BITS Pilani", degree: "M.Tech", year: "2nd",
      },
    });

    // Documents for students
    await prisma.document.createMany({
      data: [
        { userId: student1.id, type: "resume", title: "Resume - Priya Singh", fileUrl: "/uploads/resume_priya.pdf", status: "approved" },
        { userId: student1.id, type: "marksheet", title: "10th Marksheet", fileUrl: "/uploads/marksheet_priya.pdf", status: "approved" },
        { userId: student2.id, type: "resume", title: "Resume - Amit Kumar", fileUrl: "/uploads/resume_amit.pdf", status: "pending" },
        { userId: student3.id, type: "resume", title: "Resume - Neha Gupta", fileUrl: "/uploads/resume_neha.pdf", status: "pending" },
        { userId: student3.id, type: "id_card", title: "College ID Card", fileUrl: "/uploads/id_neha.pdf", status: "pending" },
      ],
    });

    const org = await prisma.organization.create({
      data: {
        name: "TechSkill Solutions",
        type: "company",
        description: "Leading technology company offering industry-ready internship programs",
        website: "https://techskillsolutions.com",
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
        feeType: "stipend",
        feeAmount: 0,
        stipendAmount: 5000,
        maxSeats: 100,
        isPublished: true,
        totalDays: 60,
        weekoffs: "saturday,sunday",
        workingHours: "10:00 AM - 6:00 PM",
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
        totalDays: 40,
        weekoffs: "sunday",
        workingHours: "10:00 AM - 5:00 PM",
        orgId: org.id,
      },
    });

    const program3 = await prisma.program.create({
      data: {
        title: "Data Science & AI Internship",
        slug: "data-science-ai-internship",
        description: "Hands-on data science internship with Python, ML, Deep Learning.",
        domain: "data-science",
        mode: "hybrid",
        duration: 120,
        feeType: "paid",
        feeAmount: 4999,
        stipendAmount: 0,
        maxSeats: 50,
        isPublished: true,
        totalDays: 80,
        weekoffs: "saturday,sunday",
        workingHours: "9:00 AM - 5:00 PM",
        orgId: org.id,
      },
    });

    const batch1 = await prisma.batch.create({
      data: {
        name: "Batch 2025-A",
        programId: program1.id,
        leaderId: leader.id,
        startDate: new Date("2025-05-01"),
        endDate: new Date("2025-07-30"),
      },
    });

    const batch2 = await prisma.batch.create({
      data: {
        name: "DM Batch 1",
        programId: program2.id,
        leaderId: leader.id,
        startDate: new Date("2025-05-15"),
        endDate: new Date("2025-07-15"),
      },
    });

    await prisma.batch.create({
      data: {
        name: "DS Batch 2025",
        programId: program3.id,
        leaderId: leader.id,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-09-30"),
      },
    });

    // Student 1: selected (full flow done)
    const enrollment1 = await prisma.enrollment.create({
      data: {
        studentId: student1.id, batchId: batch1.id, status: "selected",
        salary: 5000, weekoffs: 2, paidLeaves: 2, workTiming: "10:00 AM - 6:00 PM",
        joiningDate: new Date("2025-05-05"), feeType: "stipend", stipendAmount: 5000,
        currentWorkDay: 5,
      },
    });

    // Student 2: interview scheduled
    const enrollment2 = await prisma.enrollment.create({
      data: { studentId: student2.id, batchId: batch1.id, status: "interview_scheduled" },
    });

    // Student 3: just applied
    await prisma.enrollment.create({
      data: { studentId: student3.id, batchId: batch2.id, status: "applied" },
    });

    // Offer letter for selected student
    await prisma.offerLetter.create({
      data: {
        enrollmentId: enrollment1.id,
        letterNumber: "OL-2025-001",
        htmlContent: "<h1>Offer Letter</h1><p>Dear Priya Singh, we are pleased to offer you...</p>",
      },
    });

    // Interview for student 2
    await prisma.interview.create({
      data: {
        enrollmentId: enrollment2.id,
        scheduledAt: new Date("2025-05-10T10:00:00Z"),
        duration: 30,
        mode: "online",
        meetLink: "https://meet.google.com/abc-defg-hij",
        interviewerId: admin.id,
        status: "scheduled",
      },
    });

    // Employee card for student 1
    await prisma.employeeCard.create({
      data: {
        userId: student1.id,
        cardNumber: "EMP-2025-001",
        designation: "Web Development Intern",
        department: "Engineering",
        validFrom: new Date("2025-05-05"),
        validUntil: new Date("2025-07-30"),
      },
    });

    // Day-based tasks for batch 1
    const tasks = [];
    for (let day = 1; day <= 10; day++) {
      tasks.push({
        batchId: batch1.id,
        title: `Day ${day}: ${["HTML Basics", "CSS Fundamentals", "JavaScript Intro", "JS Functions", "DOM Manipulation", "React Setup", "Components & Props", "State Management", "API Integration", "Mini Project"][day - 1]}`,
        description: `Complete Day ${day} learning materials and submit the task`,
        type: "regular",
        dayNumber: day,
        maxPoints: 100,
        order: day,
        scope: "all",
      });
    }
    await prisma.task.createMany({ data: tasks });

    // An urgent task
    await prisma.task.create({
      data: {
        batchId: batch1.id,
        title: "URGENT: Fix Client Website Bug",
        description: "A client reported a CSS bug on the homepage. Fix it and submit your solution.",
        type: "urgent",
        maxPoints: 100,
        order: 100,
        scope: "all",
        isUrgent: true,
      },
    });

    // Individual task for student 1
    await prisma.task.create({
      data: {
        batchId: batch1.id,
        title: "Extra: Advanced React Patterns",
        description: "Research and implement advanced React patterns like HOC, Render Props",
        type: "individual",
        maxPoints: 100,
        order: 101,
        scope: "individual",
        assignedTo: student1.id,
      },
    });

    // Day-based resources for batch 1
    const resources = [];
    for (let day = 1; day <= 10; day++) {
      resources.push({
        batchId: batch1.id,
        title: `Day ${day} - Video Lesson`,
        type: "video",
        url: `https://example.com/videos/day${day}.mp4`,
        dayNumber: day,
        order: day * 2 - 1,
      });
      resources.push({
        batchId: batch1.id,
        title: `Day ${day} - Study Material (PDF)`,
        type: "pdf",
        url: `https://example.com/materials/day${day}.pdf`,
        dayNumber: day,
        order: day * 2,
      });
    }
    await prisma.resource.createMany({ data: resources });

    // Attendance for student 1 (5 working days)
    for (let i = 0; i < 5; i++) {
      const date = new Date("2025-05-05");
      date.setDate(date.getDate() + i);
      await prisma.attendance.create({
        data: {
          enrollmentId: enrollment1.id,
          userId: student1.id,
          date,
          status: i === 2 ? "leave" : "present",
          workDay: i === 2 ? null : i + 1 - (i > 2 ? 1 : 0),
          checkIn: "10:00",
          checkOut: "18:00",
        },
      });
    }

    // Submissions for student 1
    const allTasks = await prisma.task.findMany({ where: { batchId: batch1.id, dayNumber: { not: null } }, orderBy: { dayNumber: "asc" }, take: 4 });
    for (const task of allTasks) {
      await prisma.submission.create({
        data: {
          taskId: task.id,
          studentId: student1.id,
          content: `Completed ${task.title} - all exercises done`,
          status: task.dayNumber && task.dayNumber <= 2 ? "reviewed" : "submitted",
          percentage: task.dayNumber && task.dayNumber <= 2 ? (task.dayNumber === 1 ? 90 : 75) : null,
          feedback: task.dayNumber && task.dayNumber <= 2 ? "Good work!" : null,
          reviewedBy: task.dayNumber && task.dayNumber <= 2 ? leader.id : null,
        },
      });
    }

    // Offer letter template
    await prisma.offerLetterTemplate.create({
      data: {
        name: "Default Template",
        htmlContent: `<div style="font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto;">
<div style="text-align: center; margin-bottom: 30px;">
<h1 style="color: #1e1b4b;">{{company_name}}</h1>
<h2>OFFER LETTER</h2>
<p>Ref: {{letter_number}} | Date: {{date}}</p>
</div>
<p>Dear <strong>{{student_name}}</strong>,</p>
<p>We are pleased to offer you the position of <strong>Intern - {{program_name}}</strong> at {{company_name}}.</p>
<h3>Terms & Conditions:</h3>
<ul>
<li><strong>Joining Date:</strong> {{joining_date}}</li>
<li><strong>Duration:</strong> {{duration}} days</li>
<li><strong>Stipend/Salary:</strong> ₹{{salary}}/month</li>
<li><strong>Weekly Offs:</strong> {{weekoffs}} days</li>
<li><strong>Paid Leaves:</strong> {{paid_leaves}} per month</li>
<li><strong>Working Hours:</strong> {{work_timing}}</li>
<li><strong>Mode:</strong> {{mode}}</li>
</ul>
<p>Please confirm your acceptance by joining on the mentioned date.</p>
<br/>
<p>Best Regards,<br/><strong>{{company_name}}</strong></p>
</div>`,
        isDefault: true,
      },
    });

    return NextResponse.json({
      message: "Demo data loaded successfully",
      credentials: {
        admin: "admin@internpro.com / admin123",
        organization: "org@internpro.com / admin123",
        teamleader: "leader@internpro.com / leader123",
        student: "student@internpro.com / student123",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to seed data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
