import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { ConfigurationService } from './config.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller()
export class ConfigurationController {
  constructor(private configService: ConfigurationService) {}

  @Get('configuration/site')
  async getSiteSettings() { return this.configService.getSiteSettings(); }

  @Post('configuration/site')
  async updateSiteSettings(@Body() body: { settings: { name: string; value: string }[] }) {
    return this.configService.updateSiteSettings(body.settings);
  }

  @Get('configuration/email')
  async getEmailConfig() { return this.configService.getEmailConfig(); }

  @Post('configuration/email')
  async updateEmailConfig(@Body() body: Record<string, string>) { return this.configService.updateEmailConfig(body); }

  @Get('configuration/:pageType')
  async getConfigByType(@Param('pageType') pageType: string) {
    return this.configService.getConfigByType(pageType);
  }

  @Post('configuration/:pageType')
  async updateConfigByType(@Param('pageType') pageType: string, @Body() body: Record<string, string>) {
    return this.configService.updateConfigByType(pageType, body);
  }

  @Get('config/whatsapp-onboarding')
  async getWhatsAppOnboarding() { return this.configService.getConfigByType('whatsapp-onboarding'); }

  @Post('config/whatsapp-onboarding')
  async updateWhatsAppOnboarding(@Body() body: Record<string, string>) {
    return this.configService.updateConfigByType('whatsapp-onboarding', body);
  }

  @Post('config/manual-whatsapp-onboarding')
  async updateManualWhatsAppOnboarding(@Body() body: Record<string, string>) {
    return this.configService.updateConfigByType('manual-whatsapp-onboarding', body);
  }

  @Get('site-settings')
  async getSiteSettingsPublic() { return this.configService.getSiteSettings(); }

  @Put('site-settings')
  async updateSiteSettingsPublic(@Body() body: Record<string, string>) {
    const settings = Object.entries(body).map(([name, value]) => ({ name, value: String(value) }));
    return this.configService.updateSiteSettings(settings);
  }

  @Get('mobile-app-configuration')
  async getMobileAppConfig() { return this.configService.getConfigByType('mobile-app'); }

  @Post('mobile-app-configuration')
  async updateMobileAppConfig(@Body() body: Record<string, string>) {
    return this.configService.updateConfigByType('mobile-app', body);
  }

  @Get('update-panel')
  async getUpdatePanel() {
    return { current_version: '2.0.0', latest_version: '2.0.0', update_available: false, last_checked: new Date().toISOString(), changelog: [] };
  }

  @Post('update-panel/check')
  async checkForUpdates() {
    return { current_version: '2.0.0', latest_version: '2.0.0', update_available: false, last_checked: new Date().toISOString(), changelog: [] };
  }
}
