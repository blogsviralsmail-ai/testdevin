import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstagramService {
  constructor(private prisma: PrismaService) {}

  async getIntegrationStatus(vendorId: number) {
    const settings = await this.prisma.vendor_settings.findFirst({ where: { vendors_id: vendorId, name: 'instagram_account_id' } });
    return { connected: !!settings?.value, accountId: settings?.value || null };
  }

  async connect(vendorId: number, data: { accountId: string; accessToken: string }) {
    await this.prisma.vendor_settings.upsert({
      where: { vendors__id_name: { vendors_id: vendorId, name: 'instagram_account_id' } },
      update: { value: data.accountId },
      create: { vendors_id: vendorId, name: 'instagram_account_id', value: data.accountId },
    });
    await this.prisma.vendor_settings.upsert({
      where: { vendors__id_name: { vendors_id: vendorId, name: 'instagram_access_token' } },
      update: { value: data.accessToken },
      create: { vendors_id: vendorId, name: 'instagram_access_token', value: data.accessToken },
    });
    return { connected: true };
  }

  async disconnect(vendorId: number) {
    await this.prisma.vendor_settings.deleteMany({ where: { vendors_id: vendorId, name: { in: ['instagram_account_id', 'instagram_access_token'] } } });
    return { connected: false };
  }
}
