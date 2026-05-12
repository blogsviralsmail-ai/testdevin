import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function GET() {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const inquiries = await prisma.contactInquiry.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(inquiries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, phone, subject, message } = body;
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
  }
  const inquiry = await prisma.contactInquiry.create({
    data: { name, email, phone: phone || null, subject: subject || null, message },
  });

  // Send email notification to admin
  const admins = await prisma.user.findMany({ where: { role: "admin" } });
  for (const admin of admins) {
    await sendEmail({
      to: admin.email,
      subject: "New Contact Inquiry",
      html: `<h2>New Contact Inquiry</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || "N/A"}</p><p><strong>Subject:</strong> ${subject || "General"}</p><p><strong>Message:</strong></p><p>${message}</p>`,
    }).catch(() => {});
  }

  return NextResponse.json(inquiry);
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.contactInquiry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
