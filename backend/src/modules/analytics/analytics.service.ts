import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(vendorId: number | null) {
    const vendorWhere = vendorId ? { vendors_id: vendorId } : {};
    const [totalContacts, totalMessages, totalCampaigns, totalTemplates] = await Promise.all([
      this.prisma.contacts.count({ where: vendorWhere }),
      this.prisma.whatsapp_message_logs.count({ where: vendorWhere }),
      this.prisma.campaigns.count({ where: vendorWhere }),
      this.prisma.whatsapp_templates.count({ where: vendorWhere }),
    ]);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const messagesToday = await this.prisma.whatsapp_message_logs.count({
      where: { ...vendorWhere, messaged_at: { gte: today } },
    });

    return { totalContacts, totalMessages, totalCampaigns, totalTemplates, messagesToday };
  }

  async getMessageStats(vendorId: number | null, days = 30) {
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);
    const vendorWhere = vendorId ? { vendors_id: vendorId } : {};
    const messages = await this.prisma.whatsapp_message_logs.findMany({
      where: { ...vendorWhere, messaged_at: { gte: startDate } },
      select: { messaged_at: true, is_incoming_message: true },
    });

    const grouped: Record<string, { sent: number; received: number }> = {};
    messages.forEach((msg) => {
      const date = msg.messaged_at?.toISOString().split('T')[0] || '';
      if (!grouped[date]) grouped[date] = { sent: 0, received: 0 };
      if (msg.is_incoming_message === 1) grouped[date].received++;
      else grouped[date].sent++;
    });

    return Object.entries(grouped).map(([date, counts]) => ({ date, ...counts })).sort((a, b) => a.date.localeCompare(b.date));
  }
}
