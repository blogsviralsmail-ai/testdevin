import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { MarketingService } from './marketing.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private service: MarketingService) {}

  @Get('drip-campaigns')
  async getDripCampaigns(@VendorId() vendorId: number, @Query('page') page?: string) {
    return this.service.getDripCampaigns(vendorId, page ? parseInt(page) : 1);
  }

  @Post('drip-campaigns')
  async createDripCampaign(@VendorId() vendorId: number, @Body() body: { name: string; steps?: string }) {
    return this.service.createDripCampaign(vendorId, body);
  }

  @Delete('drip-campaigns/:id')
  async deleteDripCampaign(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.service.deleteDripCampaign(vendorId, parseInt(id));
  }

  @Get('auto-followups')
  async getAutoFollowups(@VendorId() vendorId: number) {
    return this.service.getAutoFollowups(vendorId);
  }

  @Post('auto-followups')
  async createAutoFollowup(@VendorId() vendorId: number, @Body() body: { name: string; trigger_after_hours: number; message: string }) {
    return this.service.createAutoFollowup(vendorId, body);
  }
}
