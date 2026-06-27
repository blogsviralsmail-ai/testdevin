import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FacebookService {
  constructor(private prisma: PrismaService) {}

  async getIntegrationStatus(vendorId: number) {
    const settings = await this.prisma.vendor_settings.findFirst({ where: { vendors_id: vendorId, name: 'facebook_page_id' } });
    return { connected: !!settings?.value, pageId: settings?.value || null };
  }

  async connect(vendorId: number, data: { pageId: string; accessToken: string }) {
    await this.prisma.vendor_settings.upsert({
      where: { vendors__id_name: { vendors_id: vendorId, name: 'facebook_page_id' } },
      update: { value: data.pageId },
      create: { vendors_id: vendorId, name: 'facebook_page_id', value: data.pageId },
    });
    await this.prisma.vendor_settings.upsert({
      where: { vendors__id_name: { vendors_id: vendorId, name: 'facebook_access_token' } },
      update: { value: data.accessToken },
      create: { vendors_id: vendorId, name: 'facebook_access_token', value: data.accessToken },
    });
    return { connected: true };
  }

  async disconnect(vendorId: number) {
    await this.prisma.vendor_settings.deleteMany({ where: { vendors_id: vendorId, name: { in: ['facebook_page_id', 'facebook_access_token'] } } });
    return { connected: false };
  }
}
