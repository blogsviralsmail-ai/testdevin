import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, sendBulkWhatsApp } from "@/lib/whatsapp";

// POST - Send WhatsApp message (single or bulk)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !["admin", "organization"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone, message, targetRole, bulkMessage } = await request.json();

  // Single message
  if (phone && message) {
    const sent = await sendWhatsAppMessage({ phone, message });
    return NextResponse.json({ success: sent });
  }

  // Bulk message
  if (bulkMessage && targetRole) {
    const where = targetRole === "all" ? { phone: { not: null } } : { role: targetRole, phone: { not: null } };
    const users = await prisma.user.findMany({ where: where as Record<string, unknown>, select: { phone: true } });

    const messages = users.filter(u => u.phone).map(u => ({ phone: u.phone!, message: bulkMessage }));
    const result = await sendBulkWhatsApp(messages);

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "phone+message or targetRole+bulkMessage required" }, { status: 400 });
}
