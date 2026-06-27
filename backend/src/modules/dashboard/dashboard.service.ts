import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getVendorDashboard(vendorId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalContacts, messagesToday, activeCampaigns, templatesCount, subscription] = await Promise.all([
      this.prisma.contacts.count({ where: { vendors_id: vendorId } }),
      this.prisma.whatsapp_message_logs.count({
        where: { vendors_id: vendorId, messaged_at: { gte: today }, is_incoming_message: 0 },
      }),
      this.prisma.campaigns.count({ where: { vendors_id: vendorId, status: 'running' } }),
      this.prisma.whatsapp_templates.count({ where: { vendors_id: vendorId } }),
      this.prisma.subscriptions.findFirst({
        where: { vendors_id: vendorId },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    // Message analytics (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messageStats = await this.prisma.whatsapp_message_logs.groupBy({
      by: ['is_incoming_message'],
      where: { vendors_id: vendorId, messaged_at: { gte: sevenDaysAgo } },
      _count: true,
    });

    // Recent activity
    const recentMessages = await this.prisma.whatsapp_message_logs.findMany({
      where: { vendors_id: vendorId },
      orderBy: { messaged_at: 'desc' },
      take: 10,
    });

    return {
      stats: { totalContacts, messagesToday, activeCampaigns, templatesCount },
      subscription: subscription ? {
        plan: subscription.plan_name,
        expiresAt: subscription.expiry_at,
        status: subscription.status,
      } : null,
      messageStats,
      recentActivity: recentMessages,
    };
  }

  async getSuperAdminDashboard() {
    const [totalVendors, activeVendors, totalUsers, totalMessages] = await Promise.all([
      this.prisma.vendors.count(),
      this.prisma.vendors.count({ where: { status: 1 } }),
      this.prisma.users.count(),
      this.prisma.whatsapp_message_logs.count(),
    ]);

    const recentVendors = await this.prisma.vendors.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return {
      stats: { totalVendors, activeVendors, totalUsers, totalMessages },
      recentVendors,
    };
  }

  async getMessageChartData(vendorId: number, period: string) {
    const days = period === 'monthly' ? 30 : period === 'weekly' ? 7 : 1;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messages = await this.prisma.whatsapp_message_logs.findMany({
      where: { vendors_id: vendorId, messaged_at: { gte: startDate } },
      select: { messaged_at: true, is_incoming_message: true },
    });

    // Group by date
    const grouped: Record<string, { sent: number; received: number }> = {};
    messages.forEach((msg) => {
      const date = msg.messaged_at?.toISOString().split('T')[0] || '';
      if (!grouped[date]) grouped[date] = { sent: 0, received: 0 };
      if (msg.is_incoming_message === 1) grouped[date].received++;
      else grouped[date].sent++;
    });

    return Object.entries(grouped).map(([date, counts]) => ({ date, ...counts }));
  }
}
