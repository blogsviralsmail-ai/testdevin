import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { VendorFeaturesService } from './vendor-features.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Vendor Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller()
export class VendorFeaturesController {
  constructor(private service: VendorFeaturesService) {}

  // ====== AUTO FOLLOW-UP ======
  @Get('auto-followup')
  async getAutoFollowups(@VendorId() vendorId: number) {
    return this.service.getAutoFollowups(vendorId);
  }

  @Post('auto-followup')
  async createAutoFollowup(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createAutoFollowup(vendorId, body);
  }

  @Put('auto-followup/:id')
  async toggleAutoFollowup(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.toggleAutoFollowup(parseInt(id), body);
  }

  @Delete('auto-followup/:id')
  async deleteAutoFollowup(@Param('id') id: string) {
    return this.service.deleteAutoFollowup(parseInt(id));
  }

  // ====== DRIP CAMPAIGNS ======
  @Get('drip-campaigns')
  async getDripCampaigns(@VendorId() vendorId: number) {
    return this.service.getDripCampaigns(vendorId);
  }

  @Post('drip-campaigns')
  async createDripCampaign(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createDripCampaign(vendorId, body);
  }

  @Delete('drip-campaigns/:id')
  async deleteDripCampaign(@Param('id') id: string) {
    return this.service.deleteDripCampaign(parseInt(id));
  }

  // ====== E-COMMERCE ORDERS ======
  @Get('ecommerce/orders')
  async getEcommerceOrders(@VendorId() vendorId: number, @Query('search') search?: string) {
    return this.service.getEcommerceOrders(vendorId, search);
  }

  // ====== FEEDBACK / SURVEY ======
  @Get('feedback')
  async getFeedbackSurveys(@VendorId() vendorId: number) {
    return this.service.getFeedbackSurveys(vendorId);
  }

  @Post('feedback')
  async createFeedbackSurvey(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createFeedbackSurvey(vendorId, body);
  }

  @Delete('feedback/:id')
  async deleteFeedbackSurvey(@Param('id') id: string) {
    return this.service.deleteFeedbackSurvey(parseInt(id));
  }

  // ====== BIRTHDAY WISHES ======
  @Get('birthday-wishes/config')
  async getBirthdayConfig(@VendorId() vendorId: number) {
    return this.service.getBirthdayConfig(vendorId);
  }

  @Put('birthday-wishes/config')
  async updateBirthdayConfig(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.updateBirthdayConfig(vendorId, body);
  }

  // ====== TEAM MANAGEMENT ======
  @Get('team')
  async getTeamMembers(@VendorId() vendorId: number) {
    return this.service.getTeamMembers(vendorId);
  }

  @Post('team')
  async addTeamMember(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.addTeamMember(vendorId, body);
  }

  @Delete('team/:id')
  async removeTeamMember(@Param('id') id: string) {
    return this.service.removeTeamMember(parseInt(id));
  }

  // ====== MESSAGE LOGS ======
  @Get('whatsapp/message-logs')
  async getMessageLogs(
    @VendorId() vendorId: number,
    @Query('page') page?: string,
    @Query('search') search?: string,
    @Query('direction') direction?: string,
  ) {
    return this.service.getMessageLogs(vendorId, parseInt(page || '1'), search, direction);
  }

  // ====== QR CODE ======
  @Get('whatsapp/qr-code')
  async getQrCode(@VendorId() vendorId: number) {
    return this.service.getQrCode(vendorId);
  }

  @Post('whatsapp/qr-code')
  async generateQrCode(@VendorId() vendorId: number, @Body() body: { message?: string }) {
    return this.service.generateQrCode(vendorId, body.message);
  }

  // ====== VENDOR SETTINGS ======
  @Get('vendor-settings/:pageType')
  async getVendorSettings(@VendorId() vendorId: number, @Param('pageType') pageType: string) {
    return this.service.getVendorSettings(vendorId, pageType);
  }

  @Post('vendor-settings/:pageType')
  async updateVendorSettings(
    @VendorId() vendorId: number,
    @Param('pageType') pageType: string,
    @Body() body: Record<string, string>,
  ) {
    return this.service.updateVendorSettings(vendorId, pageType, body);
  }
}
