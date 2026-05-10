import { prisma } from "@/lib/prisma";

export async function createNotification(userId: string, title: string, message: string, type: string = "info", link?: string) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type, link },
    });
  } catch (err) {
    console.error("[createNotification] Error:", err);
  }
}

export async function notifyStudent(studentId: string, title: string, message: string, link?: string) {
  return createNotification(studentId, title, message, "info", link);
}

export async function notifyAdmins(title: string, message: string, link?: string) {
  try {
    const admins = await prisma.user.findMany({ where: { role: { in: ["admin", "organization"] } }, select: { id: true } });
    for (const admin of admins) {
      await createNotification(admin.id, title, message, "info", link);
    }
  } catch (err) {
    console.error("[notifyAdmins] Error:", err);
  }
}
