import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WhatsappTemplateService {
  private readonly logger = new Logger(WhatsappTemplateService.name);
  private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async syncTemplates(vendorId: number) {
    const settings = await this.getVendorWhatsAppSettings(vendorId);
    if (!settings.businessAccountId || !settings.accessToken) {
      throw new BadRequestException('WhatsApp not configured');
    }

    try {
      const response = await axios.get(
        `${this.graphApiUrl}/${settings.businessAccountId}/message_templates`,
        {
          headers: { Authorization: `Bearer ${settings.accessToken}` },
          params: { limit: 100 },
        },
      );

      const templates = response.data.data || [];

      for (const template of templates) {
        await this.prisma.whatsapp_templates.upsert({
          where: {
            vendors__id_template_id: {
              vendors_id: vendorId,
              template_id: template.id,
            },
          },
          update: {
            template_name: template.name,
            language: template.language,
            category: template.category,
            status: template.status,
            components: JSON.stringify(template.components),
            updated_at: new Date(),
          },
          create: {
            uid: uuidv4(),
            vendors_id: vendorId,
            template_id: template.id,
            template_name: template.name,
            language: template.language,
            category: template.category,
            status: template.status,
            components: JSON.stringify(template.components),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      return { success: true, count: templates.length };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown }; message?: string };
      this.logger.error(`Template sync error: ${JSON.stringify(axiosError.response?.data || axiosError.message)}`);
      throw new BadRequestException('Failed to sync templates from Meta');
    }
  }

  async getTemplates(vendorId: number, status?: string, category?: string, search?: string) {
    const whereClause: Record<string, unknown> = { vendors_id: vendorId };
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (search) whereClause.template_name = { contains: search };

    const templates = await this.prisma.whatsapp_templates.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    return templates.map((t) => ({
      ...t,
      components: t.components ? JSON.parse(t.components as string) : [],
    }));
  }

  async getTemplateById(vendorId: number, templateId: number) {
    const template = await this.prisma.whatsapp_templates.findFirst({
      where: { id: templateId, vendors_id: vendorId },
    });
    if (!template) throw new BadRequestException('Template not found');

    return {
      ...template,
      components: template.components ? JSON.parse(template.components as string) : [],
    };
  }

  private async getVendorWhatsAppSettings(vendorId: number) {
    const settings = await this.prisma.vendor_settings.findMany({
      where: { vendors_id: vendorId },
    });
    const settingsMap = new Map(settings.map((s) => [s.name, s.value]));
    return {
      accessToken: settingsMap.get('whatsapp_access_token') || '',
      businessAccountId: settingsMap.get('whatsapp_business_account_id') || '',
      phoneNumberId: settingsMap.get('current_phone_number_id') || '',
    };
  }
}
