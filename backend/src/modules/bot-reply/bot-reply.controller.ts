import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { BotReplyService } from './bot-reply.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Bot Reply')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('bot-replies')
export class BotReplyController {
  constructor(private botReplyService: BotReplyService) {}

  @Get()
  async getAll(@VendorId() vendorId: number) { return this.botReplyService.getBotReplies(vendorId); }

  @Post()
  async create(@VendorId() vendorId: number, @Body() body: { name: string; keyword: string; matchType: string; replyMessage: string; replyType?: string; priority?: number }) {
    return this.botReplyService.createBotReply(vendorId, body);
  }

  @Put(':id')
  async update(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.botReplyService.updateBotReply(vendorId, parseInt(id), body);
  }

  @Delete(':id')
  async delete(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.botReplyService.deleteBotReply(vendorId, parseInt(id));
  }

  @Post(':id/toggle')
  async toggle(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.botReplyService.toggleStatus(vendorId, parseInt(id));
  }
}
