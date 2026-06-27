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

  async createTemplate(vendorId: number, data: { name: string; language: string; category: string; headerText?: string; bodyText: string; footerText?: string; buttons?: { type: string; text: string; url?: string; phoneNumber?: string }[] }) {
    const settings = await this.getVendorWhatsAppSettings(vendorId);
    if (!settings.businessAccountId || !settings.accessToken) {
      throw new BadRequestException('WhatsApp not configured. Set your WhatsApp API credentials in Settings first.');
    }

    const components: Record<string, unknown>[] = [];
    if (data.headerText) {
      components.push({ type: 'HEADER', format: 'TEXT', text: data.headerText });
    }
    components.push({ type: 'BODY', text: data.bodyText });
    if (data.footerText) {
      components.push({ type: 'FOOTER', text: data.footerText });
    }
    if (data.buttons && data.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: data.buttons.map(b => {
          if (b.type === 'URL') return { type: 'URL', text: b.text, url: b.url };
          if (b.type === 'PHONE_NUMBER') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phoneNumber };
          return { type: 'QUICK_REPLY', text: b.text };
        }),
      });
    }

    try {
      const response = await axios.post(
        `${this.graphApiUrl}/${settings.businessAccountId}/message_templates`,
        { name: data.name, language: data.language, category: data.category, components },
        { headers: { Authorization: `Bearer ${settings.accessToken}`, 'Content-Type': 'application/json' } },
      );

      const templateId = response.data.id;
      await this.prisma.whatsapp_templates.create({
        data: {
          uid: uuidv4(),
          vendors_id: vendorId,
          template_id: templateId,
          template_name: data.name,
          language: data.language,
          category: data.category,
          status: 'PENDING',
          components: JSON.stringify(components),
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { id: templateId, status: 'PENDING', message: 'Template submitted to Meta for approval' };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const errorMsg = axiosError.response?.data?.error?.message || axiosError.message || 'Failed to create template';
      this.logger.error(`Template create error: ${errorMsg}`);
      throw new BadRequestException(errorMsg);
    }
  }

  async deleteTemplate(vendorId: number, templateId: number) {
    const template = await this.prisma.whatsapp_templates.findFirst({
      where: { id: templateId, vendors_id: vendorId },
    });
    if (!template) throw new BadRequestException('Template not found');

    const settings = await this.getVendorWhatsAppSettings(vendorId);
    if (settings.businessAccountId && settings.accessToken && template.template_name) {
      try {
        await axios.delete(
          `${this.graphApiUrl}/${settings.businessAccountId}/message_templates`,
          { headers: { Authorization: `Bearer ${settings.accessToken}` }, params: { name: template.template_name } },
        );
      } catch (error: unknown) {
        const axiosError = error as { response?: { data?: unknown }; message?: string };
        this.logger.warn(`Template delete from Meta failed: ${JSON.stringify(axiosError.response?.data || axiosError.message)}`);
      }
    }

    await this.prisma.whatsapp_templates.delete({ where: { id: templateId } });
    return { success: true };
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
