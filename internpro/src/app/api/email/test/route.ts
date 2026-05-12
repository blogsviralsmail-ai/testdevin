import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST() {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const smtpHost = sMap.smtp_host;
  const smtpPort = parseInt(sMap.smtp_port || "587");
  const smtpUser = sMap.smtp_user;
  const smtpPass = sMap.smtp_password || sMap.smtp_pass;
  const smtpFrom = sMap.smtp_from || smtpUser;
  const smtpFromName = sMap.smtp_from_name || "InternPro";

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ error: "SMTP not configured. Please fill SMTP Host, User, and Password first." }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `${smtpFromName} <${smtpFrom}>`,
      to: session.email || smtpUser,
      subject: "SMTP Test — InternPro",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:#4f46e5;color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:24px;">InternPro</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
          <h2 style="color:#059669;margin:0 0 12px;">SMTP Test Successful!</h2>
          <p style="color:#374151;font-size:15px;">Your email configuration is working correctly.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:16px;">
            <strong>Host:</strong> ${smtpHost}<br/>
            <strong>Port:</strong> ${smtpPort}<br/>
            <strong>From:</strong> ${smtpFrom}<br/>
            <strong>Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
      </div>`,
    });

    return NextResponse.json({ success: true, message: `Test email sent to ${session.email || smtpUser}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP connection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
