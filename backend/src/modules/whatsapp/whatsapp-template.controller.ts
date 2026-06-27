import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
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
}
