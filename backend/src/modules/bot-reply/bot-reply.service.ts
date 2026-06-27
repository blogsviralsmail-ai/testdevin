import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BotReplyService {
  constructor(private prisma: PrismaService) {}

  async getBotReplies(vendorId: number) {
    return this.prisma.bot_replies.findMany({ where: { vendors_id: vendorId }, orderBy: { priority: 'asc' } });
  }

  async createBotReply(vendorId: number, data: { name: string; keyword: string; matchType: string; replyMessage: string; replyType?: string; priority?: number }) {
    return this.prisma.bot_replies.create({
      data: {
        uid: uuidv4(), vendors_id: vendorId, name: data.name, keyword: data.keyword,
        match_type: data.matchType, reply_message: data.replyMessage, reply_type: data.replyType || 'text',
        priority: data.priority || 0, status: 1, trigger_count: 0, created_at: new Date(), updated_at: new Date(),
      },
    });
  }

  async updateBotReply(vendorId: number, id: number, data: Record<string, unknown>) {
    const bot = await this.prisma.bot_replies.findFirst({ where: { id: id, vendors_id: vendorId } });
    if (!bot) throw new NotFoundException('Bot reply not found');
    return this.prisma.bot_replies.update({ where: { id: id }, data: { ...data, updated_at: new Date() } });
  }

  async deleteBotReply(vendorId: number, id: number) {
    await this.prisma.bot_replies.delete({ where: { id: id } });
    return { success: true };
  }

  async toggleStatus(vendorId: number, id: number) {
    const bot = await this.prisma.bot_replies.findFirst({ where: { id: id, vendors_id: vendorId } });
    if (!bot) throw new NotFoundException('Bot reply not found');
    return this.prisma.bot_replies.update({ where: { id: id }, data: { status: bot.status === 1 ? 0 : 1 } });
  }
}
