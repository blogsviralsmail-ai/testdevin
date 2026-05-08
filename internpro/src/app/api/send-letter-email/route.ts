import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization", "teamleader"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, subject, htmlContent } = await request.json();
  if (!email || !subject || !htmlContent) {
    return NextResponse.json({ error: "Email, subject, and htmlContent are required" }, { status: 400 });
  }

  const emailHtml = `<!DOCTYPE html><html><head><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .letter-wrap { background: white; max-width: 210mm; margin: 0 auto; }
    table { border-collapse: collapse; }
    img { max-width: 100%; }
  </style></head><body>
  <div class="letter-wrap">${htmlContent}</div>
  </body></html>`;

  const sent = await sendEmail({ to: email, subject, html: emailHtml });
  if (sent) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Failed to send email. Check SMTP settings." }, { status: 500 });
}
