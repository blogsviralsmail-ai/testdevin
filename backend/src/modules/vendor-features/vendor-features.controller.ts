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

  // ====== MARKETING SUB-PAGES ======
  @Get('marketing/ctwa')
  async getCtwaAds(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'ctwa_ads');
  }

  @Post('marketing/ctwa')
  async createCtwaAd(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'ctwa_ads', body);
  }

  @Get('marketing/lead-forms')
  async getLeadForms(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'lead_forms');
  }

  @Post('marketing/lead-forms')
  async createLeadForm(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'lead_forms', body);
  }

  @Get('marketing/catalogs')
  async getCatalogs(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'product_catalogs');
  }

  @Post('marketing/catalogs')
  async createCatalog(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'product_catalogs', body);
  }

  @Get('marketing/event-notifications')
  async getEventNotifications(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'event_notifications');
  }

  @Post('marketing/event-notifications')
  async createEventNotification(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'event_notifications', body);
  }

  @Get('marketing/api-settings')
  async getApiSettings(@VendorId() vendorId: number) {
    return this.service.getVendorSettings(vendorId, 'api');
  }

  @Post('marketing/api-settings')
  async updateApiSettings(@VendorId() vendorId: number, @Body() body: Record<string, string>) {
    return this.service.updateVendorSettings(vendorId, 'api', body);
  }

  // ====== INTEGRATIONS ======
  @Get('integrations/shopify')
  async getShopifyConfig(@VendorId() vendorId: number) {
    return this.service.getVendorSettings(vendorId, 'shopify');
  }

  @Post('integrations/shopify')
  async updateShopifyConfig(@VendorId() vendorId: number, @Body() body: Record<string, string>) {
    return this.service.updateVendorSettings(vendorId, 'shopify', body);
  }

  @Get('integrations/woocommerce')
  async getWooCommerceConfig(@VendorId() vendorId: number) {
    return this.service.getVendorSettings(vendorId, 'woocommerce');
  }

  @Post('integrations/woocommerce')
  async updateWooCommerceConfig(@VendorId() vendorId: number, @Body() body: Record<string, string>) {
    return this.service.updateVendorSettings(vendorId, 'woocommerce', body);
  }

  @Get('integrations/google-sheets')
  async getGoogleSheetsScripts(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'google_sheets_scripts');
  }

  @Post('integrations/google-sheets')
  async createGoogleSheetsScript(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'google_sheets_scripts', body);
  }

  // ====== CONTACT FIELDS / LABELS ======
  @Get('contact-custom-fields')
  async getContactCustomFields(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'contact_custom_fields');
  }

  @Post('contact-custom-fields')
  async createContactCustomField(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'contact_custom_fields', body);
  }

  @Delete('contact-custom-fields/:id')
  async deleteContactCustomField(@Param('id') id: string) {
    return this.service.deleteGenericItem('contact_custom_fields', parseInt(id));
  }

  @Get('labels')
  async getLabels(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'labels');
  }

  @Post('labels')
  async createLabel(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'labels', body);
  }

  @Delete('labels/:id')
  async deleteLabel(@Param('id') id: string) {
    return this.service.deleteGenericItem('labels', parseInt(id));
  }

  // ====== PRESET CAMPAIGNS ======
  @Get('preset-campaigns')
  async getPresetCampaigns(@VendorId() vendorId: number) {
    return this.service.getGenericList(vendorId, 'preset_campaigns');
  }

  @Post('preset-campaigns')
  async createPresetCampaign(@VendorId() vendorId: number, @Body() body: Record<string, unknown>) {
    return this.service.createGenericItem(vendorId, 'preset_campaigns', body);
  }

  // ====== WHATSAPP ORDERS ======
  @Get('whatsapp-orders')
  async getWhatsAppOrders(@VendorId() vendorId: number) {
    return this.service.getEcommerceOrders(vendorId);
  }
}
