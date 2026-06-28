import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async getAll(vendorId: number | null, page = 1, perPage = 20) {
    const where = vendorId ? { vendors_id: vendorId } : {};
    const [items, total] = await Promise.all([
      this.prisma.subscriptions.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.subscriptions.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }
}
