import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, studentName, reportHtml } = await request.json();
  if (!email || !reportHtml) return NextResponse.json({ error: "Email and report content required" }, { status: 400 });

  const success = await sendEmail({
    to: email,
    subject: `Daily Task Report — ${studentName || "Student"} — KKHS Media Private Limited`,
    html: reportHtml,
  });

  if (success) {
    return NextResponse.json({ success: true, message: "Report emailed successfully" });
  }
  return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
}
