import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentLinksService {
  constructor(private prisma: PrismaService) {}

  async getAll(vendorId: number, page = 1, perPage = 20) {
    const where = { vendors_id: vendorId };
    const [items, total] = await Promise.all([
      this.prisma.payment_links.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.payment_links.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async create(vendorId: number, data: { title: string; amount: number; currency?: string; gateway?: string }) {
    return this.prisma.payment_links.create({
      data: { uid: uuidv4(), vendors_id: vendorId, title: data.title, amount: data.amount, currency: data.currency || 'INR', gateway: data.gateway || 'razorpay', status: 'active' },
    });
  }

  async delete(vendorId: number, id: number) {
    return this.prisma.payment_links.delete({ where: { id, vendors_id: vendorId } });
  }
}
