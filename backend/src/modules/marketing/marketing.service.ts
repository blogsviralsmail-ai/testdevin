import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MarketingService {
  constructor(private prisma: PrismaService) {}

  async getDripCampaigns(vendorId: number, page = 1, perPage = 20) {
    const where = { vendors_id: vendorId };
    const [items, total] = await Promise.all([
      this.prisma.drip_campaigns.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.drip_campaigns.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async createDripCampaign(vendorId: number, data: { name: string; steps?: string }) {
    return this.prisma.drip_campaigns.create({
      data: { uid: uuidv4(), vendors_id: vendorId, name: data.name, steps: data.steps, status: 1 },
    });
  }

  async deleteDripCampaign(vendorId: number, id: number) {
    return this.prisma.drip_campaigns.delete({ where: { id, vendors_id: vendorId } });
  }

  async getAutoFollowups(vendorId: number) {
    return this.prisma.auto_followups.findMany({ where: { vendors_id: vendorId }, orderBy: { created_at: 'desc' } });
  }

  async createAutoFollowup(vendorId: number, data: { name: string; trigger_after_hours: number; message: string }) {
    return this.prisma.auto_followups.create({
      data: { uid: uuidv4(), vendors_id: vendorId, name: data.name, trigger_after_hours: data.trigger_after_hours, message: data.message, status: 1 },
    });
  }
}
