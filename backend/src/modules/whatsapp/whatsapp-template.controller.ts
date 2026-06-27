import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { WhatsappTemplateService } from './whatsapp-template.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('WhatsApp Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('whatsapp/templates')
export class WhatsappTemplateController {
  constructor(private templateService: WhatsappTemplateService) {}

  @Post('sync')
  async syncTemplates(@VendorId() vendorId: number) {
    return this.templateService.syncTemplates(vendorId);
  }

  @Get()
  async getTemplates(
    @VendorId() vendorId: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.templateService.getTemplates(vendorId, status, category, search);
  }

  @Get(':templateId')
  async getTemplate(
    @VendorId() vendorId: number,
    @Param('templateId') templateId: string,
  ) {
    return this.templateService.getTemplateById(vendorId, parseInt(templateId));
  }

  @Post()
  async createTemplate(
    @VendorId() vendorId: number,
    @Body() body: { name: string; language: string; category: string; headerText?: string; bodyText: string; footerText?: string; buttons?: { type: string; text: string; url?: string; phoneNumber?: string }[] },
  ) {
    return this.templateService.createTemplate(vendorId, body);
  }

  @Delete(':templateId')
  async deleteTemplate(
    @VendorId() vendorId: number,
    @Param('templateId') templateId: string,
  ) {
    return this.templateService.deleteTemplate(vendorId, parseInt(templateId));
  }
}
