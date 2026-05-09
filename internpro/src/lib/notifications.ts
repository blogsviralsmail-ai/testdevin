import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

async function getSmtpTransporter() {
  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const smtpHost = sMap.smtp_host;
  const smtpPort = parseInt(sMap.smtp_port || "587");
  const smtpUser = sMap.smtp_user;
  const smtpPass = sMap.smtp_password;
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

export async function notifyApplicationStatusChange(studentEmail: string, studentName: string, status: string, programTitle: string) {
  const statusMessages: Record<string, string> = {
    selected: `Congratulations ${studentName}! Your application for <b>${programTitle}</b> has been accepted. Welcome aboard!`,
    rejected: `Dear ${studentName}, we regret to inform you that your application for <b>${programTitle}</b> was not successful this time.`,
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
  ]);
}

export async function notifyNewTask(batchId: string, taskTitle: string, programTitle: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { batchId, status: "selected" },
    include: { student: { select: { id: true, email: true, name: true } } },
  });

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
  ]);
}

export { notifyAllChannels };

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
