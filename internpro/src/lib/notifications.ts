import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

async function getSmtpTransporter() {
  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const smtpHost = sMap.smtp_host;
  const smtpPort = parseInt(sMap.smtp_port || "587");
  const smtpUser = sMap.smtp_user;
  const smtpPass = sMap.smtp_password || sMap.smtp_pass;
  const smtpFrom = sMap.smtp_from || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) return null;

  return {
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    }),
    from: smtpFrom,
  };
}

async function sendEmailSafe(to: string, subject: string, html: string) {
  try {
    const smtp = await getSmtpTransporter();
    if (!smtp) return;
    await smtp.transporter.sendMail({ from: smtp.from, to, subject, html });
  } catch {
    // Silent fail — don't break the main flow
  }
}

// Telegram Bot notification
async function sendTelegramMessage(message: string) {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["telegram_bot_token", "telegram_chat_id"] } },
    });
    const sMap: Record<string, string> = {};
    for (const s of settings) sMap[s.key] = s.value;

    const botToken = sMap.telegram_bot_token;
    const chatId = sMap.telegram_chat_id;
    if (!botToken || !chatId) return;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // Silent fail
  }
}

export { sendTelegramMessage };

export async function notifyApplicationStatusChange(studentEmail: string, studentName: string, status: string, programTitle: string) {
  const statusMessages: Record<string, string> = {
    selected: `Congratulations ${studentName}! Your application for <b>${programTitle}</b> has been accepted. Welcome aboard!`,
    rejected: `Dear ${studentName}, we regret to inform you that your application for <b>${programTitle}</b> was not successful this time. You can apply again for other programs.`,
    shortlisted: `Dear ${studentName}, great news! You have been <b>shortlisted</b> for <b>${programTitle}</b>. Please stay tuned — you may be selected soon or called for a follow-up interview.`,
    interview: `Dear ${studentName}, you have been shortlisted for an interview for <b>${programTitle}</b>. Check your dashboard for details.`,
  };

  const message = statusMessages[status];
  if (!message) return;

  // Find user by email for notification
  const user = await prisma.user.findUnique({ where: { email: studentEmail }, select: { id: true, phone: true } });

  await Promise.all([
    sendEmailSafe(studentEmail, `Application Update — ${programTitle}`, wrapEmailTemplate(message)),
    user?.phone ? sendWhatsAppMessage(user.phone, `Hi ${studentName}, your application for ${programTitle} has been ${status}. Check your InternPro dashboard for details.`) : Promise.resolve(),
    user ? prisma.notification.create({
      data: {
        userId: user.id,
        title: `Application ${status}`,
        message: `Your application for ${programTitle} has been ${status}.`,
        type: status === "selected" ? "success" : status === "rejected" ? "error" : "info",
        link: "/dashboard",
      },
    }).catch(() => {}) : Promise.resolve(),
    sendTelegramMessage(`📋 <b>Application ${status}</b>\nStudent: ${studentName}\nProgram: ${programTitle}`),
  ]);
}

export async function notifyNewTask(batchId: string, taskTitle: string, programTitle: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { batchId, status: "selected" },
    include: { student: { select: { id: true, email: true, name: true } } },
  });

  sendTelegramMessage(`📝 <b>New Task</b>: ${taskTitle} — ${programTitle}`).catch(() => {});
  for (const e of enrollments) {
    await Promise.all([
      sendEmailSafe(
        e.student.email,
        `New Task: ${taskTitle} — ${programTitle}`,
        wrapEmailTemplate(`Hi ${e.student.name}, a new task <b>"${taskTitle}"</b> has been assigned in your <b>${programTitle}</b> program. Log in to your dashboard to start working on it.`)
      ),
      prisma.notification.create({
        data: { userId: e.student.id, title: "New Task Assigned", message: `${taskTitle} — ${programTitle}`, type: "info", link: "/dashboard/tasks" },
      }).catch(() => {}),
    ]);
  }
}

export async function notifyQuizAvailable(programId: string, quizTitle: string) {
  const batches = await prisma.batch.findMany({
    where: { program: { id: programId } },
    include: { enrollments: { where: { status: "selected" }, include: { student: { select: { id: true, email: true, name: true } } } } },
  });

  for (const batch of batches) {
    for (const e of batch.enrollments) {
      await Promise.all([
        sendEmailSafe(
          e.student.email,
          `New Quiz Available: ${quizTitle}`,
          wrapEmailTemplate(`Hi ${e.student.name}, a new quiz <b>"${quizTitle}"</b> is now available. Test your knowledge and earn points!`)
        ),
        prisma.notification.create({
          data: { userId: e.student.id, title: "New Quiz Available", message: quizTitle, type: "info", link: "/dashboard/quizzes" },
        }).catch(() => {}),
      ]);
    }
  }
}

export async function notifyTaskReviewed(studentId: string, studentEmail: string, studentName: string, taskTitle: string, percentage: number | null, feedback: string | null) {
  const body = `Hi ${studentName}, your task <b>"${taskTitle}"</b> has been reviewed.${percentage !== null ? ` You scored <b>${percentage}%</b>.` : ""}${feedback ? ` Feedback: ${feedback}` : ""}`;
  await Promise.all([
    sendEmailSafe(studentEmail, `Task Reviewed: ${taskTitle}`, wrapEmailTemplate(body)),
    prisma.notification.create({
      data: { userId: studentId, title: "Task Reviewed", message: `${taskTitle}${percentage !== null ? ` — ${percentage}%` : ""}`, type: "info", link: "/dashboard/tasks" },
    }).catch(() => {}),
    sendTelegramMessage(`✅ <b>Task Reviewed</b>: ${taskTitle}\nStudent: ${studentName}${percentage !== null ? `\nScore: ${percentage}%` : ""}`),
  ]);
}

// WhatsApp Business API integration
export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    const settings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    for (const s of settings) sMap[s.key] = s.value;

    const waToken = sMap.whatsapp_token;
    const waPhoneId = sMap.whatsapp_phone_id;
    if (!waToken || !waPhoneId) return;

    // Clean phone number
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "91" + cleanPhone.substring(1);
    if (!cleanPhone.startsWith("91") && cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${waToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: message },
      }),
    });
  } catch {
    // Silent fail
  }
}

async function notifyAllChannels(email: string, phone: string | null, emailSubject: string, emailBody: string, waMessage: string, userId: string, notifTitle: string, notifMessage: string, notifLink: string) {
  await Promise.all([
    sendEmailSafe(email, emailSubject, wrapEmailTemplate(emailBody)),
    phone ? sendWhatsAppMessage(phone, waMessage) : Promise.resolve(),
    prisma.notification.create({
      data: { userId, title: notifTitle, message: notifMessage, type: "info", link: notifLink },
    }).catch(() => {}),
    sendTelegramMessage(`🔔 <b>${notifTitle}</b>\n${notifMessage}`),
  ]);
}

export { notifyAllChannels };

// --- Leave Notifications ---

export async function notifyLeaveApplied(studentName: string, studentEmail: string, leaveType: string, startDate: string, endDate: string, totalDays: number, reason: string) {
  // Notify all admins
  const admins = await prisma.user.findMany({ where: { role: { in: ["admin", "organization"] }, isActive: true }, select: { id: true, email: true, name: true } });
  for (const admin of admins) {
    await Promise.all([
      sendEmailSafe(admin.email, `Leave Request from ${studentName}`,
        wrapEmailTemplate(`<b>${studentName}</b> (${studentEmail}) has applied for <b>${leaveType} leave</b>.<br><br>
          <b>Duration:</b> ${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()} (${totalDays} day${totalDays > 1 ? "s" : ""})<br>
          <b>Reason:</b> ${reason}<br><br>
          Please review and approve/reject from your dashboard.`)),
      prisma.notification.create({
        data: { userId: admin.id, title: "New Leave Request", message: `${studentName} applied for ${totalDays} day${totalDays > 1 ? "s" : ""} ${leaveType} leave`, type: "info", link: "/dashboard/leaves" },
      }).catch(() => {}),
    ]);
  }
  sendTelegramMessage(`🏖 <b>Leave Request</b>\n${studentName} applied for ${totalDays} day(s) ${leaveType} leave\n${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}`).catch(() => {});
}

export async function notifyLeaveAction(studentId: string, studentEmail: string, studentName: string, action: "approved" | "rejected", leaveType: string, startDate: string, endDate: string, adminRemarks: string | null) {
  const statusEmoji = action === "approved" ? "approved" : "rejected";
  const body = `Hi ${studentName}, your <b>${leaveType} leave</b> request (${new Date(startDate).toLocaleDateString()} — ${new Date(endDate).toLocaleDateString()}) has been <b>${statusEmoji}</b>.${adminRemarks ? `<br><br><b>Remarks:</b> ${adminRemarks}` : ""}`;
  await Promise.all([
    sendEmailSafe(studentEmail, `Leave ${action === "approved" ? "Approved" : "Rejected"}`, wrapEmailTemplate(body)),
    prisma.notification.create({
      data: { userId: studentId, title: `Leave ${action === "approved" ? "Approved" : "Rejected"}`, message: `Your ${leaveType} leave has been ${statusEmoji}`, type: action === "approved" ? "success" : "error", link: "/dashboard/my-leaves" },
    }).catch(() => {}),
    sendTelegramMessage(`🏖 <b>Leave ${action === "approved" ? "Approved" : "Rejected"}</b>\n${studentName} — ${leaveType} leave`),
  ]);
}

// --- Salary Notifications ---

export async function notifySalaryGenerated(studentId: string, studentEmail: string, studentName: string, month: string, amount: number) {
  const body = `Hi ${studentName}, your salary for <b>${month}</b> has been generated. Amount: <b>₹${amount.toLocaleString()}</b>. Check your payslips for details.`;
  await Promise.all([
    sendEmailSafe(studentEmail, `Salary Generated — ${month}`, wrapEmailTemplate(body)),
    prisma.notification.create({
      data: { userId: studentId, title: "Salary Generated", message: `₹${amount.toLocaleString()} for ${month}`, type: "info", link: "/dashboard/my-payslips" },
    }).catch(() => {}),
    sendTelegramMessage(`💰 <b>Salary Generated</b>\n${studentName} — ₹${amount.toLocaleString()} for ${month}`),
  ]);
}

export async function notifySalaryPaid(studentId: string, studentEmail: string, studentName: string, month: string, amount: number, paymentMethod: string) {
  const body = `Hi ${studentName}, your salary of <b>₹${amount.toLocaleString()}</b> for <b>${month}</b> has been paid via <b>${paymentMethod}</b>. Check your payslips for the receipt.`;
  await Promise.all([
    sendEmailSafe(studentEmail, `Salary Paid — ₹${amount.toLocaleString()}`, wrapEmailTemplate(body)),
    prisma.notification.create({
      data: { userId: studentId, title: "Salary Paid", message: `₹${amount.toLocaleString()} for ${month} — paid via ${paymentMethod}`, type: "success", link: "/dashboard/my-payslips" },
    }).catch(() => {}),
    sendTelegramMessage(`💸 <b>Salary Paid</b>\n${studentName} — ₹${amount.toLocaleString()} for ${month} via ${paymentMethod}`),
  ]);
}

// --- Holiday Notifications ---

export async function notifyHolidayAdded(title: string, date: string, type: string) {
  // Notify all active students
  const students = await prisma.user.findMany({
    where: { role: "student", isActive: true },
    select: { id: true, email: true, name: true },
  });
  for (const s of students) {
    await Promise.all([
      prisma.notification.create({
        data: { userId: s.id, title: "Holiday Announced", message: `${title} on ${new Date(date).toLocaleDateString()} (${type})`, type: "info", link: "/dashboard/my-leaves" },
      }).catch(() => {}),
    ]);
  }
  // Email to all students (batched)
  if (students.length > 0) {
    for (const s of students) {
      sendEmailSafe(s.email, `Holiday Announced: ${title}`,
        wrapEmailTemplate(`Hi ${s.name}, a holiday has been announced: <b>${title}</b> on <b>${new Date(date).toLocaleDateString()}</b> (${type}). Enjoy your day off!`)
      ).catch(() => {});
    }
  }
  sendTelegramMessage(`🎉 <b>Holiday Announced</b>\n${title} on ${new Date(date).toLocaleDateString()} (${type})`).catch(() => {});
}

// --- Payment Notifications ---

export async function notifyPaymentReceived(studentName: string, studentEmail: string, amount: number, programTitle: string, method: string) {
  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: { in: ["admin", "organization"] }, isActive: true }, select: { id: true, email: true } });
  for (const admin of admins) {
    await Promise.all([
      sendEmailSafe(admin.email, `Payment Received — ₹${amount.toLocaleString()}`,
        wrapEmailTemplate(`Payment of <b>₹${amount.toLocaleString()}</b> received from <b>${studentName}</b> (${studentEmail}) for <b>${programTitle}</b> via ${method}.`)),
      prisma.notification.create({
        data: { userId: admin.id, title: "Payment Received", message: `₹${amount.toLocaleString()} from ${studentName} for ${programTitle}`, type: "success", link: "/dashboard/payments" },
      }).catch(() => {}),
    ]);
  }
  sendTelegramMessage(`💳 <b>Payment Received</b>\n₹${amount.toLocaleString()} from ${studentName} for ${programTitle} via ${method}`).catch(() => {});
}

// --- Task Submission Notification ---

export async function notifyTaskSubmitted(studentName: string, taskTitle: string, programTitle: string) {
  const admins = await prisma.user.findMany({ where: { role: { in: ["admin", "organization"] }, isActive: true }, select: { id: true } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: { userId: admin.id, title: "Task Submitted", message: `${studentName} submitted: ${taskTitle} (${programTitle})`, type: "info", link: "/dashboard/reviews" },
    }).catch(() => {});
  }
  sendTelegramMessage(`📤 <b>Task Submitted</b>\n${studentName}: ${taskTitle} (${programTitle})`).catch(() => {});
}

function wrapEmailTemplate(body: string): string {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">InternPro</h1>
    </div>
    <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
      <p style="font-size: 15px; line-height: 1.6; color: #374151;">${body}</p>
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://internship.kkhsmedia.com/dashboard" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Go to Dashboard</a>
      </div>
    </div>
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">KKHS Media Private Limited</p>
  </div>`;
}
