import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { BotFlowService } from './bot-flow.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Bot Flow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('bot-flows')
export class BotFlowController {
  constructor(private botFlowService: BotFlowService) {}

  @Get()
  async getAll(@VendorId() vendorId: number) { return this.botFlowService.getFlows(vendorId); }

  @Get(':id')
  async getOne(@VendorId() vendorId: number, @Param('id') id: string) { return this.botFlowService.getFlow(vendorId, parseInt(id)); }

  @Post()
  async create(@VendorId() vendorId: number, @Body() body: { name: string; trigger: string; triggerValue?: string }) {
    return this.botFlowService.createFlow(vendorId, body);
  }

  @Put(':id')
  async update(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: { name?: string; flowData?: Record<string, unknown>; status?: number }) {
    return this.botFlowService.updateFlow(vendorId, parseInt(id), body);
  }

  @Delete(':id')
  async delete(@VendorId() vendorId: number, @Param('id') id: string) { return this.botFlowService.deleteFlow(vendorId, parseInt(id)); }
}
