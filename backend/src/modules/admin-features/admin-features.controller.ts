import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { AdminFeaturesService } from './admin-features.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class AdminFeaturesController {
  constructor(private service: AdminFeaturesService) {}

  // ====== TRANSLATIONS ======
  @Get('translations')
  async getTranslations(@Query('locale') locale?: string, @Query('search') search?: string) {
    return this.service.getTranslations(locale, search);
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Post('translations')
  async createTranslation(@Body() body: Record<string, unknown>) {
    return this.service.createTranslation(body);
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Put('translations/:id')
  async updateTranslation(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateTranslation(parseInt(id), body);
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Delete('translations/:id')
  async deleteTranslation(@Param('id') id: string) {
    return this.service.deleteTranslation(parseInt(id));
  }

  // ====== CONTACT INQUIRIES ======
  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Get('contact-inquiries')
  async getContactInquiries(@Query('search') search?: string) {
    return this.service.getContactInquiries(search);
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Delete('contact-inquiries/:id')
  async deleteContactInquiry(@Param('id') id: string) {
    return this.service.deleteContactInquiry(parseInt(id));
  }

  // ====== ADDONS ======
  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Get('addons')
  async getAddons() {
    return this.service.getAddons();
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Put('addons/:id')
  async toggleAddon(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.toggleAddon(parseInt(id), body);
  }

  // ====== LICENCE ======
  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Get('licence')
  async getLicence() {
    return this.service.getLicence();
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Post('licence')
  async updateLicence(@Body() body: Record<string, string>) {
    return this.service.updateLicence(body);
  }
}
