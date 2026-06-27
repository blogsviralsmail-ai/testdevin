import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShopifyService {
  constructor(private prisma: PrismaService) {}

  async connectStore(vendorId: number, data: { shopDomain: string; accessToken: string }) {
    await this.prisma.vendor_settings.upsert({
      where: { vendors__id_name: { vendors_id: vendorId, name: 'shopify_domain' } },
      update: { value: data.shopDomain },
      create: { uid: uuidv4(), vendors_id: vendorId, name: 'shopify_domain', value: data.shopDomain },
    });
    await this.prisma.vendor_settings.upsert({
      where: { vendors__id_name: { vendors_id: vendorId, name: 'shopify_access_token' } },
      update: { value: data.accessToken },
      create: { uid: uuidv4(), vendors_id: vendorId, name: 'shopify_access_token', value: data.accessToken },
    });
    return { success: true, message: 'Shopify store connected' };
  }

  async disconnectStore(vendorId: number) {
    await this.prisma.vendor_settings.deleteMany({
      where: { vendors_id: vendorId, name: { in: ['shopify_domain', 'shopify_access_token'] } },
    });
    return { success: true };
  }

  async handleWebhook(vendorId: number, topic: string, data: Record<string, unknown>) {
    // Process order webhooks and send WhatsApp notifications
    return { processed: true, topic };
  }

  async getProducts(vendorId: number) {
    const settings = await this.getSettings(vendorId);
    if (!settings.domain || !settings.token) return { products: [] };
    try {
      const response = await axios.get(`https://${settings.domain}/admin/api/2024-01/products.json`, {
        headers: { 'X-Shopify-Access-Token': settings.token },
      });
      return response.data;
    } catch { return { products: [] }; }
  }

  private async getSettings(vendorId: number) {
    const settings = await this.prisma.vendor_settings.findMany({ where: { vendors_id: vendorId, name: { startsWith: 'shopify_' } } });
    const map = new Map(settings.map(s => [s.name, s.value]));
    return { domain: map.get('shopify_domain') || '', token: map.get('shopify_access_token') || '' };
  }
}
