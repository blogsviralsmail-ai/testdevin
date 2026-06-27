import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WoocommerceService {
  constructor(private prisma: PrismaService) {}

  async connectStore(vendorId: number, data: { storeUrl: string; consumerKey: string; consumerSecret: string }) {
    const settings = [
      { name: 'woocommerce_store_url', value: data.storeUrl },
      { name: 'woocommerce_consumer_key', value: data.consumerKey },
      { name: 'woocommerce_consumer_secret', value: data.consumerSecret },
    ];
    for (const s of settings) {
      await this.prisma.vendor_settings.upsert({
        where: { vendors__id_name: { vendors_id: vendorId, name: s.name } },
        update: { value: s.value },
        create: { uid: uuidv4(), vendors_id: vendorId, name: s.name, value: s.value },
      });
    }
    return { success: true, message: 'WooCommerce store connected' };
  }

  async disconnectStore(vendorId: number) {
    await this.prisma.vendor_settings.deleteMany({
      where: { vendors_id: vendorId, name: { startsWith: 'woocommerce_' } },
    });
    return { success: true };
  }

  async handleWebhook(vendorId: number, data: Record<string, unknown>) {
    return { processed: true };
  }
}
