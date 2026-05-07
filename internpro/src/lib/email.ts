import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function getSmtpConfig() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_from_name", "letterhead_company"] } },
  });
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  if (!sMap.smtp_host || !sMap.smtp_user || !sMap.smtp_pass) return null;

  return {
    host: sMap.smtp_host,
    port: parseInt(sMap.smtp_port || "587"),
    user: sMap.smtp_user,
    pass: sMap.smtp_pass,
    from: sMap.smtp_from || sMap.smtp_user,
    fromName: sMap.smtp_from_name || sMap.letterhead_company || "InternPro",
  };
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const config = await getSmtpConfig();
    if (!config) {
      console.log("[Email] SMTP not configured, skipping email to:", options.to);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log("[Email] Sent to:", options.to, "Subject:", options.subject);
    return true;
  } catch (error) {
    console.error("[Email] Failed:", error);
    return false;
  }
}

function emailTemplate(title: string, body: string, companyName = "KKHS Media Private Limited") {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Calibri','Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<div style="background:#0000AA;padding:20px 30px;text-align:center;">
<h1 style="margin:0;color:white;font-size:22px;letter-spacing:1px;">${companyName}</h1>
</div>
<div style="padding:30px;">
<h2 style="margin:0 0 16px;color:#0000AA;font-size:20px;">${title}</h2>
${body}
</div>
<div style="background:#f8f9fa;padding:16px 30px;text-align:center;border-top:1px solid #eee;">
<p style="margin:0;font-size:12px;color:#888;">This is an automated email from ${companyName}. Please do not reply.</p>
</div>
</div></body></html>`;
}

export async function sendWelcomeEmail(name: string, email: string) {
  const body = `<p style="font-size:15px;color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
<p style="font-size:15px;color:#333;line-height:1.6;">Welcome to our Internship Management Platform! Your account has been successfully created.</p>
<p style="font-size:15px;color:#333;line-height:1.6;">You can now log in and explore available internship programs, apply for positions, and manage your documents.</p>
<p style="font-size:15px;color:#333;line-height:1.6;">Best regards,<br/>HR Department</p>`;
  return sendEmail({ to: email, subject: "Welcome to InternPro!", html: emailTemplate("Welcome!", body) });
}

export async function sendPasswordResetEmail(name: string, email: string, resetToken: string, baseUrl: string) {
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const body = `<p style="font-size:15px;color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
<p style="font-size:15px;color:#333;line-height:1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
<div style="text-align:center;margin:24px 0;">
<a href="${resetLink}" style="display:inline-block;padding:12px 32px;background:#0000AA;color:white;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Reset Password</a>
</div>
<p style="font-size:13px;color:#888;">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>`;
  return sendEmail({ to: email, subject: "Reset Your Password", html: emailTemplate("Password Reset", body) });
}

export async function sendLetterGeneratedEmail(name: string, email: string, letterType: string, letterNumber: string) {
  const body = `<p style="font-size:15px;color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
<p style="font-size:15px;color:#333;line-height:1.6;">Your <strong>${letterType}</strong> has been generated successfully!</p>
<p style="font-size:15px;color:#333;line-height:1.6;"><strong>Letter Number:</strong> ${letterNumber}</p>
<p style="font-size:15px;color:#333;line-height:1.6;">You can view and download this letter from your dashboard under "My Letters".</p>
<p style="font-size:15px;color:#333;line-height:1.6;">Best regards,<br/>HR Department</p>`;
  return sendEmail({ to: email, subject: `Your ${letterType} is Ready — ${letterNumber}`, html: emailTemplate(`${letterType} Generated`, body) });
}

export async function sendLoginNotificationEmail(name: string, email: string) {
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const body = `<p style="font-size:15px;color:#333;line-height:1.6;">Dear <strong>${name}</strong>,</p>
<p style="font-size:15px;color:#333;line-height:1.6;">A successful login was detected on your account at <strong>${now}</strong>.</p>
<p style="font-size:13px;color:#888;">If this wasn't you, please change your password immediately.</p>`;
  return sendEmail({ to: email, subject: "Login Notification", html: emailTemplate("Login Detected", body) });
}
