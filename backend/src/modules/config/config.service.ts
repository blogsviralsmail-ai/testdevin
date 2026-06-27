import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConfigurationService {
  constructor(private prisma: PrismaService) {}

  async getSiteSettings() {
    const settings = await this.prisma.site_settings.findMany();
    return settings.reduce((acc: Record<string, string>, s) => { acc[s.name || ''] = s.value || ''; return acc; }, {});
  }

  async updateSiteSettings(settings: { name: string; value: string }[]) {
    for (const s of settings) {
      await this.prisma.site_settings.upsert({
        where: { name: s.name },
        update: { value: s.value },
        create: { uid: uuidv4(), name: s.name, value: s.value },
      });
    }
    return { success: true };
  }

  async getEmailConfig() {
    const config = await this.prisma.site_settings.findMany({
      where: { name: { in: ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption', 'mail_from_address', 'mail_from_name'] } },
    });
    return config.reduce((acc: Record<string, string>, s) => { acc[s.name || ''] = s.value || ''; return acc; }, {});
  }

  async updateEmailConfig(data: Record<string, string>) {
    for (const [name, value] of Object.entries(data)) {
      await this.prisma.site_settings.upsert({
        where: { name },
        update: { value },
        create: { uid: uuidv4(), name, value },
      });
    }
    return { success: true };
  }
}
