import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    const settings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    for (const s of settings) sMap[s.key] = s.value;

    const smtpHost = sMap.smtp_host;
    const smtpPort = parseInt(sMap.smtp_port || "587");
    const smtpUser = sMap.smtp_user;
    const smtpPass = sMap.smtp_password;
    const smtpFrom = sMap.smtp_from || smtpUser;
    const smtpFromName = sMap.smtp_from_name || "InternPro";

    if (!smtpHost || !smtpUser || !smtpPass) return false;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `${smtpFromName} <${smtpFrom}>`,
      to,
      subject,
      html: wrapEmailTemplate(subject, html),
    });

    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// Specific email functions
export async function sendWelcomeEmail(name: string, email: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Welcome to KKHS Media Internship Program!",
    html: `<h2 style="color:#1f2937;margin:0 0 16px;">Welcome, ${name}!</h2>
<p style="color:#4b5563;line-height:1.6;">Thank you for registering on the KKHS Media Internship Platform.</p>
<p style="color:#4b5563;line-height:1.6;">Next steps:</p>
<ol style="color:#4b5563;line-height:1.8;">
<li>Upload your documents (Resume, ID proof, etc.)</li>
<li>Wait for application review</li>
<li>Attend interview if scheduled</li>
<li>Get selected and start your internship!</li>
</ol>
<p style="color:#4b5563;line-height:1.6;">Login to your dashboard: <a href="https://internship.kkhsmedia.com/dashboard" style="color:#4f46e5;">internship.kkhsmedia.com/dashboard</a></p>`,
  });
}

export async function sendLoginNotification(name: string, email: string): Promise<boolean> {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return sendEmail({
    to: email,
    subject: "Login Notification — InternPro",
    html: `<p style="color:#4b5563;">Hi ${name},</p>
<p style="color:#4b5563;">Your account was logged in at <strong>${now}</strong> (IST).</p>
<p style="color:#9ca3af;font-size:13px;">If this wasn't you, please change your password immediately.</p>`,
  });
}

export async function sendDocumentUploadNotification(studentName: string, adminEmail: string, docTitle: string): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `Document Uploaded — ${studentName}`,
    html: `<p style="color:#4b5563;">${studentName} has uploaded a new document: <strong>${docTitle}</strong></p>
<p style="color:#4b5563;">Please review it on the <a href="https://internship.kkhsmedia.com/dashboard/documents" style="color:#4f46e5;">Documents page</a>.</p>`,
  });
}

export async function sendLetterGeneratedNotification(studentName: string, studentEmail: string, letterType: string): Promise<boolean> {
  return sendEmail({
    to: studentEmail,
    subject: `Your ${letterType} is Ready — KKHS Media`,
    html: `<h2 style="color:#1f2937;margin:0 0 16px;">Congratulations, ${studentName}!</h2>
<p style="color:#4b5563;line-height:1.6;">Your <strong>${letterType}</strong> has been generated and is ready for download.</p>
<p style="color:#4b5563;">View and download it from your <a href="https://internship.kkhsmedia.com/dashboard/letters" style="color:#4f46e5;">Letters page</a>.</p>`,
  });
}

export async function sendLetterGeneratedEmail(studentName: string, studentEmail: string, letterType: string, _letterNumber?: string): Promise<boolean> {
  return sendLetterGeneratedNotification(studentName, studentEmail, letterType);
}

export async function sendPasswordResetEmail(name: string, email: string, token: string, baseUrl: string): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Password Reset — InternPro",
    html: `<h2 style="color:#1f2937;margin:0 0 16px;">Hi ${name},</h2>
<p style="color:#4b5563;line-height:1.6;">We received a request to reset your password.</p>
<p style="text-align:center;margin:24px 0;"><a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Reset Password</a></p>
<p style="color:#9ca3af;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  });
}

function wrapEmailTemplate(title: string, content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#0000AA,#4f46e5);padding:24px 30px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:22px;">KKHS Media Private Limited</h1>
<p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Internship Management Platform</p>
</td></tr>
<tr><td style="padding:30px;">${content}</td></tr>
<tr><td style="padding:20px 30px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;color:#9ca3af;">KKHS Media Private Limited | 190A Krishna Kunj, Kalwar Road, Jaipur</p>
<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">Ph: 9782005500 | hari@kkhsmedia.com</p>
</td></tr></table></body></html>`;
}
