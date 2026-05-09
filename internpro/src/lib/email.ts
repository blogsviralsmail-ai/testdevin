import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

interface Attachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

export async function sendEmail({ to, subject, html, attachments }: EmailOptions): Promise<boolean> {
  try {
    const settings = await prisma.setting.findMany();
    const sMap: Record<string, string> = {};
    for (const s of settings) sMap[s.key] = s.value;

    const smtpHost = sMap.smtp_host;
    const smtpPort = parseInt(sMap.smtp_port || "587");
    const smtpUser = sMap.smtp_user;
    const smtpPass = sMap.smtp_password || sMap.smtp_pass;
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
      attachments: attachments?.map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType || "application/pdf" })),
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

export async function sendLetterGeneratedNotification(studentName: string, studentEmail: string, letterType: string, extraData?: Record<string, string>): Promise<boolean> {
  const templateKey = getTemplateKey(letterType);
  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const customSubject = sMap[`email_template_${templateKey}_subject`];
  const customBody = sMap[`email_template_${templateKey}_body`];

  let subject = customSubject || `Your ${letterType} is Ready — KKHS Media`;
  let body = customBody || `<h2 style="color:#1f2937;margin:0 0 16px;">Congratulations, {{student_name}}!</h2>
<p style="color:#4b5563;line-height:1.6;">Your <strong>{{letter_type}}</strong> has been generated and is ready for download.</p>
<p style="color:#4b5563;">View and download it from your <a href="https://internship.kkhsmedia.com/dashboard/letters" style="color:#4f46e5;">Letters page</a>.</p>`;

  const replacements: Record<string, string> = {
    "{{student_name}}": studentName,
    "{{letter_type}}": letterType,
    "{{company_name}}": sMap.company_name || sMap.letterhead_company_name || "KKHS Media Private Limited",
    "{{company_email}}": sMap.letterhead_email || sMap.smtp_from || "hari@kkhsmedia.com",
    "{{company_phone}}": sMap.letterhead_phone || "9782005500",
    "{{company_address}}": sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur",
    "{{dashboard_link}}": "https://internship.kkhsmedia.com/dashboard/letters",
    "{{date}}": new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    ...extraData,
  };

  for (const [key, value] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    body = body.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return sendEmail({ to: studentEmail, subject, html: body });
}

export async function sendLetterGeneratedEmail(studentName: string, studentEmail: string, letterType: string, letterNumber?: string, letterHtmlContent?: string): Promise<boolean> {
  const extra: Record<string, string> = {};
  if (letterNumber) extra["{{letter_number}}"] = letterNumber;

  let pdfAttachments: Attachment[] | undefined;
  if (letterHtmlContent) {
    try {
      const { htmlToPdfBuffer } = await import("@/lib/pdf");
      const pdfBuffer = await htmlToPdfBuffer(letterHtmlContent);
      const safeType = letterType.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      pdfAttachments = [{ filename: `${safeType}_${letterNumber || "document"}.pdf`, content: pdfBuffer }];
    } catch (err) {
      console.error("PDF generation failed for email attachment:", err);
    }
  }

  return sendLetterGeneratedNotificationWithAttachment(studentName, studentEmail, letterType, extra, pdfAttachments);
}

async function sendLetterGeneratedNotificationWithAttachment(studentName: string, studentEmail: string, letterType: string, extraData?: Record<string, string>, pdfAttachments?: Attachment[]): Promise<boolean> {
  const templateKey = getTemplateKey(letterType);
  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const customSubject = sMap[`email_template_${templateKey}_subject`];
  const customBody = sMap[`email_template_${templateKey}_body`];

  let subject = customSubject || `Your ${letterType} is Ready — KKHS Media`;
  let body = customBody || `<h2 style="color:#1f2937;margin:0 0 16px;">Congratulations, {{student_name}}!</h2>
<p style="color:#4b5563;line-height:1.6;">Your <strong>{{letter_type}}</strong> has been generated and is ready for download.</p>
<p style="color:#4b5563;">View and download it from your <a href="https://internship.kkhsmedia.com/dashboard/letters" style="color:#4f46e5;">Letters page</a>.</p>`;

  const replacements: Record<string, string> = {
    "{{student_name}}": studentName,
    "{{letter_type}}": letterType,
    "{{company_name}}": sMap.company_name || sMap.letterhead_company_name || "KKHS Media Private Limited",
    "{{company_email}}": sMap.letterhead_email || sMap.smtp_from || "hari@kkhsmedia.com",
    "{{company_phone}}": sMap.letterhead_phone || "9782005500",
    "{{company_address}}": sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur",
    "{{dashboard_link}}": "https://internship.kkhsmedia.com/dashboard/letters",
    "{{date}}": new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    ...extraData,
  };

  for (const [key, value] of Object.entries(replacements)) {
    subject = subject.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    body = body.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return sendEmail({ to: studentEmail, subject, html: body, attachments: pdfAttachments });
}

function getTemplateKey(letterType: string): string {
  const map: Record<string, string> = {
    "Offer Letter": "offer_letter",
    "Experience Letter": "experience_letter",
    "Internship Certificate": "internship_certificate",
    "ID Card": "id_card",
  };
  return map[letterType] || letterType.toLowerCase().replace(/\s+/g, "_");
}

// Generic templated email sender — reads custom template from settings, falls back to default
export async function sendTemplatedNotification(
  templateKey: string,
  toEmail: string,
  defaultSubject: string,
  defaultBody: string,
  variables: Record<string, string>,
): Promise<boolean> {
  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  let subject = sMap[`email_template_${templateKey}_subject`] || defaultSubject;
  let body = sMap[`email_template_${templateKey}_body`] || defaultBody;

  const allVars: Record<string, string> = {
    "{{company_name}}": sMap.company_name || sMap.letterhead_company_name || "KKHS Media Private Limited",
    "{{company_email}}": sMap.letterhead_email || sMap.smtp_from || "hari@kkhsmedia.com",
    "{{company_phone}}": sMap.letterhead_phone || "9782005500",
    "{{company_address}}": sMap.letterhead_address || "190A Krishna Kunj, Kalwar Road, Jaipur",
    "{{dashboard_link}}": "https://internship.kkhsmedia.com/dashboard",
    "{{date}}": new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    "{{time}}": new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
    ...variables,
  };

  for (const [key, value] of Object.entries(allVars)) {
    subject = subject.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
    body = body.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  return sendEmail({ to: toEmail, subject, html: body });
}

// ---- Attendance Email ----
export async function sendAttendanceEmail(studentName: string, studentEmail: string, status: string, date: string): Promise<boolean> {
  return sendTemplatedNotification("daily_attendance", studentEmail,
    "Attendance Marked — {{company_name}}",
    `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your attendance has been marked as <strong style="color:#059669;">{{attendance_status}}</strong> for <strong>{{attendance_date}}</strong>.</p>
<p style="color:#4b5563;line-height:1.6;">Keep up the great work! Check your progress on the dashboard.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/attendance" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Attendance</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    { "{{student_name}}": studentName, "{{attendance_status}}": status, "{{attendance_date}}": date },
  );
}

// ---- New Video/Resource Unlocked Email ----
export async function sendVideoUnlockedEmail(studentName: string, studentEmail: string, videoTitle: string, dayNumber: number): Promise<boolean> {
  return sendTemplatedNotification("video_unlock", studentEmail,
    "New Study Material Unlocked — Day {{day_number}} — {{company_name}}",
    `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">A new study material has been unlocked for you!</p>
<div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;color:#1e40af;font-weight:600;">Day {{day_number}}: {{video_title}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">Watch the video and complete today's task to stay on track.</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/resources" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Watch Now</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    { "{{student_name}}": studentName, "{{video_title}}": videoTitle, "{{day_number}}": String(dayNumber) },
  );
}

// ---- Quiz Attempt Email ----
export async function sendQuizAttemptEmail(studentName: string, studentEmail: string, quizTitle: string, score: number, passed: boolean): Promise<boolean> {
  return sendTemplatedNotification("quiz_attempt", studentEmail,
    passed ? "Quiz Passed — {{quiz_title}} — {{company_name}}" : "Quiz Result — {{quiz_title}} — {{company_name}}",
    `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your quiz result for <strong>{{quiz_title}}</strong> is here:</p>
<div style="background:${passed ? "#f0fdf4" : "#fef2f2"};border-left:4px solid ${passed ? "#22c55e" : "#ef4444"};padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;font-size:24px;font-weight:700;color:${passed ? "#15803d" : "#dc2626"};">{{quiz_score}}%</p>
  <p style="margin:4px 0 0;color:${passed ? "#166534" : "#991b1b"};font-weight:600;">{{quiz_result}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">${passed ? "Congratulations! Keep learning and improving." : "Don't worry — review the material and try again!"}</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/quizzes" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Quizzes</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    { "{{student_name}}": studentName, "{{quiz_title}}": quizTitle, "{{quiz_score}}": String(Math.round(score)), "{{quiz_result}}": passed ? "PASSED" : "NOT PASSED" },
  );
}

// ---- Discussion Post Email ----
export async function sendDiscussionEmail(studentName: string, studentEmail: string, discussionTitle: string, action: string): Promise<boolean> {
  return sendTemplatedNotification("discussion_post", studentEmail,
    "Discussion {{discussion_action}} — {{company_name}}",
    `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">A discussion has been {{discussion_action}}:</p>
<div style="background:#faf5ff;border-left:4px solid #8b5cf6;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;color:#6d28d9;font-weight:600;">{{discussion_title}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">Join the discussion and share your thoughts!</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/discussions" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Discussion</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    { "{{student_name}}": studentName, "{{discussion_title}}": discussionTitle, "{{discussion_action}}": action },
  );
}

// ---- Live Session Scheduled Email ----
export async function sendLiveSessionEmail(studentName: string, studentEmail: string, sessionTitle: string, scheduledAt: string, meetLink: string): Promise<boolean> {
  return sendTemplatedNotification("live_session", studentEmail,
    "Live Session Scheduled — {{session_title}} — {{company_name}}",
    `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">A new live session has been scheduled for you!</p>
<div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;color:#c2410c;font-weight:600;">{{session_title}}</p>
  <p style="margin:8px 0 0;color:#9a3412;">Scheduled: {{session_time}}</p>
</div>
<div style="margin:24px 0;text-align:center;">
  <a href="{{meet_link}}" style="background:#059669;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Join Session</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Make sure to join on time. You can also find the link on your dashboard.</p>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    { "{{student_name}}": studentName, "{{session_title}}": sessionTitle, "{{session_time}}": scheduledAt, "{{meet_link}}": meetLink || "{{dashboard_link}}/live-sessions" },
  );
}

// ---- Leaderboard Update Email ----
export async function sendLeaderboardEmail(studentName: string, studentEmail: string, points: number, rank: number, reason: string): Promise<boolean> {
  return sendTemplatedNotification("leaderboard_update", studentEmail,
    "Leaderboard Update — {{company_name}}",
    `<h2 style="color:#1f2937;margin:0 0 16px;">Hi {{student_name}},</h2>
<p style="color:#4b5563;line-height:1.6;">Your leaderboard has been updated!</p>
<div style="background:#fefce8;border-left:4px solid #eab308;padding:16px;border-radius:0 8px 8px 0;margin:16px 0;">
  <p style="margin:0;font-size:20px;font-weight:700;color:#a16207;">+{{points_earned}} Points</p>
  <p style="margin:4px 0 0;color:#854d0e;">Reason: {{points_reason}}</p>
  <p style="margin:8px 0 0;color:#92400e;font-weight:600;">Current Rank: #{{current_rank}}</p>
</div>
<p style="color:#4b5563;line-height:1.6;">Keep earning points to climb the leaderboard!</p>
<div style="margin:24px 0;text-align:center;">
  <a href="{{dashboard_link}}/leaderboard" style="background:#4f46e5;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Leaderboard</a>
</div>
<p style="color:#6b7280;font-size:13px;margin-top:24px;">{{company_name}} | {{company_phone}}</p>`,
    { "{{student_name}}": studentName, "{{points_earned}}": String(points), "{{current_rank}}": String(rank), "{{points_reason}}": reason },
  );
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
