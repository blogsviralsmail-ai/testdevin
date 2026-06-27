import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { CampaignsService } from './campaigns.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  async getCampaigns(@VendorId() vendorId: number, @Query('page') page?: string, @Query('status') status?: string) {
    return this.campaignsService.getCampaigns(vendorId, page ? parseInt(page) : 1, 20, status);
  }

  @Get(':id')
  async getCampaign(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.campaignsService.getCampaign(vendorId, parseInt(id));
  }

  @Post()
  async createCampaign(@VendorId() vendorId: number, @Body() body: { name: string; templateId: number; groupIds?: number[]; labelIds?: number[]; scheduledAt?: string }) {
    return this.campaignsService.createCampaign(vendorId, body);
  }

  @Get(':id/logs')
  async getCampaignLogs(@VendorId() vendorId: number, @Param('id') id: string, @Query('page') page?: string) {
    return this.campaignsService.getCampaignLogs(vendorId, parseInt(id), page ? parseInt(page) : 1);
  }

  @Get(':id/analytics')
  async getCampaignAnalytics(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.campaignsService.getCampaignAnalytics(vendorId, parseInt(id));
  }

  @Delete(':id')
  async deleteCampaign(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.campaignsService.deleteCampaign(vendorId, parseInt(id));
  }
}
