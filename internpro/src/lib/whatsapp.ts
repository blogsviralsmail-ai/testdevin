import { prisma } from "./prisma";

interface WhatsAppMessage {
  phone: string;
  message: string;
}

// Get WhatsApp API settings from DB
async function getWhatsAppConfig() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["whatsapp_api_url", "whatsapp_api_token", "whatsapp_enabled"] } },
  });
  const config: Record<string, string> = {};
  settings.forEach(s => { config[s.key] = s.value; });
  return config;
}

// Send WhatsApp message via API
export async function sendWhatsAppMessage({ phone, message }: WhatsAppMessage): Promise<boolean> {
  try {
    const config = await getWhatsAppConfig();
    if (config.whatsapp_enabled !== "true") return false;

    const apiUrl = config.whatsapp_api_url;
    const token = config.whatsapp_api_token;

    if (!apiUrl || !token) return false;

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ phone: fullPhone, message }),
    });

    // Log delivery status
    const status = res.ok ? "sent" : "failed";
    const responseText = await res.text().catch(() => "");
    try {
      await prisma.activityLog.create({
        data: {
          action: "whatsapp_message",
          entity: "whatsapp",
          entityId: fullPhone,
          details: `WhatsApp ${status}: ${message.slice(0, 100)}${responseText ? ` [API: ${responseText.slice(0, 50)}]` : ""}`,
          userId: "system",
          userName: "System",
        },
      });
    } catch { /* logging failed, don't block */ }

    return res.ok;
  } catch (err) {
    try {
      await prisma.activityLog.create({
        data: {
          action: "whatsapp_message",
          entity: "whatsapp",
          entityId: phone,
          details: `WhatsApp failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          userId: "system",
          userName: "System",
        },
      });
    } catch { /* logging failed */ }
    return false;
  }
}

// Bulk send WhatsApp messages
export async function sendBulkWhatsApp(messages: WhatsAppMessage[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const msg of messages) {
    const success = await sendWhatsAppMessage(msg);
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}

// Create notification + optional WhatsApp
export async function createNotification(userId: string, title: string, message: string, type: string = "info", link?: string) {
  await prisma.notification.create({
    data: { userId, title, message, type, link },
  });

  // Try to send WhatsApp too
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
  if (user?.phone) {
    await sendWhatsAppMessage({ phone: user.phone, message: `${title}\n${message}` });
  }
}
