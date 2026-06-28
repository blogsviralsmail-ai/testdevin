import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('campaign-queue') private campaignQueue: Queue,
  ) {}

  async getCampaigns(vendorId: number, page = 1, perPage = 20, status?: string) {
    const skip = (page - 1) * perPage;
    const whereClause: Record<string, unknown> = { vendors_id: vendorId };
    if (status) whereClause.status = status;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaigns.findMany({ where: whereClause, skip, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.campaigns.count({ where: whereClause }),
    ]);

    return { data: campaigns, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async getCampaign(vendorId: number, campaignId: number) {
    const campaign = await this.prisma.campaigns.findFirst({ where: { id: campaignId, vendors_id: vendorId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(vendorId: number, data: {
    name: string;
    templateId: number;
    groupIds?: number[];
    labelIds?: number[];
    scheduledAt?: string;
  }) {
    const campaign = await this.prisma.campaigns.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        name: data.name,
        whatsapp_templates_id: data.templateId,
        status: data.scheduledAt ? 'scheduled' : 'pending',
        scheduled_at: data.scheduledAt ? new Date(data.scheduledAt) : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    if (!data.scheduledAt) {
      await this.executeCampaign(vendorId, campaign.id, data.groupIds, data.labelIds);
    }

    return campaign;
  }

  async executeCampaign(vendorId: number, campaignId: number, groupIds?: number[], labelIds?: number[]) {
    await this.prisma.campaigns.update({
      where: { id: campaignId },
      data: { status: 'running', started_at: new Date() },
    });

    // Get contacts based on groups/labels
    let contactIds: number[] = [];

    if (groupIds && groupIds.length > 0) {
      const assigns = await this.prisma.group_contact_assigns.findMany({
        where: { contact_groups_id: { in: groupIds } },
      });
      contactIds = assigns.map(a => a.contacts_id).filter((id): id is number => id !== null);
    }

    if (labelIds && labelIds.length > 0) {
      const labelAssigns = await this.prisma.contact_labels.findMany({
        where: { labels_id: { in: labelIds } },
      });
      const labelContactIds = labelAssigns.map(a => a.contacts_id).filter((id): id is number => id !== null);
      contactIds = [...new Set([...contactIds, ...labelContactIds])];
    }

    if (contactIds.length === 0) {
      const allContacts = await this.prisma.contacts.findMany({
        where: { vendors_id: vendorId, status: 1 },
        select: { id: true },
      });
      contactIds = allContacts.map(c => c.id);
    }

    // Queue messages with rate limiting
    for (let i = 0; i < contactIds.length; i++) {
      await this.campaignQueue.add('send-campaign-message', {
        vendorId,
        campaignId,
        contactId: contactIds[i],
      }, { delay: i * 1000 }); // 1 message per second rate limit
    }

    await this.prisma.campaigns.update({
      where: { id: campaignId },
      data: { total_count: contactIds.length },
    });

    return { queued: contactIds.length };
  }

  async getCampaignLogs(vendorId: number, campaignId: number, page = 1, perPage = 50) {
    const skip = (page - 1) * perPage;
    const [logs, total] = await Promise.all([
      this.prisma.campaign_logs.findMany({
        where: { campaigns_id: campaignId },
        skip, take: perPage,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.campaign_logs.count({ where: { campaigns_id: campaignId } }),
    ]);
    return { data: logs, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async deleteCampaign(vendorId: number, campaignId: number) {
    const campaign = await this.prisma.campaigns.findFirst({ where: { id: campaignId, vendors_id: vendorId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.prisma.campaign_logs.deleteMany({ where: { campaigns_id: campaignId } });
    await this.prisma.campaigns.delete({ where: { id: campaignId } });
    return { success: true };
  }

  async getCampaignAnalytics(vendorId: number, campaignId: number) {
    const logs = await this.prisma.campaign_logs.groupBy({
      by: ['status'],
      where: { campaigns_id: campaignId },
      _count: true,
    });
    return logs;
  }
}
