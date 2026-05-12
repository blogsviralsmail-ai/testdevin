import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "organization")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to, subject, html } = await request.json();
  if (!to || !subject || !html) {
    return NextResponse.json({ error: "Missing fields: to, subject, html" }, { status: 400 });
  }

  // Get SMTP settings
  const settings = await prisma.setting.findMany();
  const sMap: Record<string, string> = {};
  for (const s of settings) sMap[s.key] = s.value;

  const smtpHost = sMap.smtp_host;
  const smtpPort = parseInt(sMap.smtp_port || "587");
  const smtpUser = sMap.smtp_user;
  const smtpPass = sMap.smtp_password;
  const smtpFrom = sMap.smtp_from || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ error: "SMTP not configured. Go to Settings to configure." }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
