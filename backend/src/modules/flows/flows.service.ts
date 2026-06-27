import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FlowsService {
  constructor(private prisma: PrismaService) {}
  private graphApiUrl = 'https://graph.facebook.com/v18.0';

  async getFlows(vendorId: number) {
    return this.prisma.whatsapp_flows.findMany({ where: { vendors_id: vendorId }, orderBy: { created_at: 'desc' } });
  }

  async createFlow(vendorId: number, data: { name: string; categories: string[] }) {
    const settings = await this.getSettings(vendorId);
    try {
      const response = await axios.post(`${this.graphApiUrl}/${settings.wabaId}/flows`, { name: data.name, categories: data.categories }, { headers: { Authorization: `Bearer ${settings.accessToken}` } });
      return this.prisma.whatsapp_flows.create({
        data: { uid: uuidv4(), vendors_id: vendorId, flow_id: response.data.id, name: data.name, status: 'draft', created_at: new Date(), updated_at: new Date() },
      });
    } catch { return { error: 'Failed to create flow' }; }
  }

  async publishFlow(vendorId: number, flowId: number) {
    const flow = await this.prisma.whatsapp_flows.findFirst({ where: { id: flowId, vendors_id: vendorId } });
    if (!flow) throw new NotFoundException('Flow not found');
    const settings = await this.getSettings(vendorId);
    try {
      await axios.post(`${this.graphApiUrl}/${flow.flow_id}/publish`, {}, { headers: { Authorization: `Bearer ${settings.accessToken}` } });
      return this.prisma.whatsapp_flows.update({ where: { id: flowId }, data: { status: 'published' } });
    } catch { return { error: 'Failed to publish flow' }; }
  }

  async deleteFlow(vendorId: number, flowId: number) {
    await this.prisma.whatsapp_flows.delete({ where: { id: flowId } });
    return { success: true };
  }

  private async getSettings(vendorId: number) {
    const settings = await this.prisma.vendor_settings.findMany({ where: { vendors_id: vendorId } });
    const map = new Map(settings.map(s => [s.name, s.value]));
    return { accessToken: map.get('whatsapp_access_token') || '', wabaId: map.get('whatsapp_business_account_id') || '' };
  }
}
