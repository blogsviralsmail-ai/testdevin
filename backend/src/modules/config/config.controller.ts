import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { ConfigurationService } from './config.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('configuration')
export class ConfigurationController {
  constructor(private configService: ConfigurationService) {}

  @Get('site')
  async getSiteSettings() { return this.configService.getSiteSettings(); }

  @Post('site')
  async updateSiteSettings(@Body() body: { settings: { name: string; value: string }[] }) {
    return this.configService.updateSiteSettings(body.settings);
  }

  @Get('email')
  async getEmailConfig() { return this.configService.getEmailConfig(); }

  @Post('email')
  async updateEmailConfig(@Body() body: Record<string, string>) { return this.configService.updateEmailConfig(body); }
}
