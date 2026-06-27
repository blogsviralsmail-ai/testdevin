import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BotFlowService {
  constructor(private prisma: PrismaService) {}

  async getFlows(vendorId: number) {
    return this.prisma.bot_flows.findMany({ where: { vendors_id: vendorId }, orderBy: { created_at: 'desc' } });
  }

  async getFlow(vendorId: number, flowId: number) {
    const flow = await this.prisma.bot_flows.findFirst({ where: { id: flowId, vendors_id: vendorId } });
    if (!flow) throw new NotFoundException('Bot flow not found');
    return { ...flow, nodes: flow.flow_data ? JSON.parse(flow.flow_data as string) : { nodes: [], edges: [] } };
  }

  async createFlow(vendorId: number, data: { name: string; trigger: string; triggerValue?: string }) {
    return this.prisma.bot_flows.create({
      data: {
        uid: uuidv4(), vendors_id: vendorId, name: data.name, trigger_type: data.trigger,
        trigger_value: data.triggerValue || '', flow_data: JSON.stringify({ nodes: [], edges: [] }),
        status: 1, created_at: new Date(), updated_at: new Date(),
      },
    });
  }

  async updateFlow(vendorId: number, flowId: number, data: { name?: string; flowData?: Record<string, unknown>; status?: number }) {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.name) updateData.name = data.name;
    if (data.flowData) updateData.flow_data = JSON.stringify(data.flowData);
    if (data.status !== undefined) updateData.status = data.status;
    return this.prisma.bot_flows.update({ where: { id: flowId }, data: updateData });
  }

  async deleteFlow(vendorId: number, flowId: number) {
    await this.prisma.bot_flows.delete({ where: { id: flowId } });
    return { success: true };
  }
}
