import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';

@Processor('message-queue')
export class MessageQueueProcessor {
  private readonly logger = new Logger(MessageQueueProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process('process-bot-reply')
  async handleBotReply(job: Job<{ vendorId: number; contactId: number; messageText: string; messageType: string }>) {
    const { vendorId, contactId, messageText, messageType } = job.data;
    this.logger.debug(`Processing bot reply for vendor ${vendorId}, contact ${contactId}`);

    try {
      // Find matching bot replies
      const botReplies = await this.prisma.bot_replies.findMany({
        where: { vendors_id: vendorId, status: 1 },
        orderBy: { priority: 'asc' },
      });

      for (const bot of botReplies) {
        const isMatch = this.checkBotMatch(bot, messageText);
        if (isMatch) {
          // Update trigger count
          await this.prisma.bot_replies.update({
            where: { id: bot.id },
            data: { trigger_count: { increment: 1 } },
          });

          // TODO: Execute bot reply action (send message, trigger flow, etc.)
          this.logger.log(`Bot reply triggered: ${bot.name} for contact ${contactId}`);
          break; // Only first match
        }
      }
    } catch (error) {
      this.logger.error(`Bot reply processing error: ${error}`);
    }
  }

  @Process('send-campaign-message')
  async handleCampaignMessage(job: Job<{ vendorId: number; contactId: number; templateId: number; campaignId: number }>) {
    const { vendorId, contactId, templateId, campaignId } = job.data;
    this.logger.debug(`Sending campaign message: campaign ${campaignId}, contact ${contactId}`);
    // Campaign message sending logic handled by campaign service
  }

  private checkBotMatch(bot: { match_type?: string | null; keyword?: string | null }, messageText: string): boolean {
    const keyword = bot.keyword || '';
    const matchType = bot.match_type || 'exact';

    switch (matchType) {
      case 'exact':
        return messageText.toLowerCase() === keyword.toLowerCase();
      case 'contains':
        return messageText.toLowerCase().includes(keyword.toLowerCase());
      case 'starts_with':
        return messageText.toLowerCase().startsWith(keyword.toLowerCase());
      case 'regex':
        try {
          const regex = new RegExp(keyword, 'i');
          return regex.test(messageText);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }
}
