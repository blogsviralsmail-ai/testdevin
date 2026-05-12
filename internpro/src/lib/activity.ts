import { prisma } from "@/lib/prisma";

export async function logActivity(action: string, entity: string, entityId?: string, details?: string, userId?: string, userName?: string) {
  try {
    await prisma.activityLog.create({
      data: { action, entity, entityId, details, userId, userName },
    });
  } catch (err) {
    console.error("[logActivity] Error:", err);
  }
}
