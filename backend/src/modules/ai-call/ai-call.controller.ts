import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { AiCallService } from './ai-call.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('AI Call')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('ai-call')
export class AiCallController {
  constructor(private aiCallService: AiCallService) {}

  @Post('initiate')
  async initiateCall(@VendorId() vendorId: number, @Body() body: { contactId: number; aiConfig?: Record<string, unknown> }) {
    return this.aiCallService.initiateCall(vendorId, body);
  }

  @Get('logs')
  async getCallLogs(@VendorId() vendorId: number, @Query('page') page?: string) {
    return this.aiCallService.getCallLogs(vendorId, page ? parseInt(page) : 1);
  }

  @Get('recording/:callId')
  async getRecording(@VendorId() vendorId: number, @Param('callId') callId: string) {
    return this.aiCallService.getCallRecording(vendorId, callId);
  }
}
