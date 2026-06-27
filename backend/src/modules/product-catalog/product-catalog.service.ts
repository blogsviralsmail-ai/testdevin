import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductCatalogService {
  constructor(private prisma: PrismaService) {}

  async getAll(vendorId: number, page = 1, perPage = 20, search?: string) {
    const where: Record<string, unknown> = { vendors_id: vendorId };
    if (search) where.name = { contains: search };
    const [items, total] = await Promise.all([
      this.prisma.product_catalogs.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.product_catalogs.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async create(vendorId: number, data: { name: string; description?: string; price: number; category?: string; image_url?: string }) {
    return this.prisma.product_catalogs.create({
      data: { uid: uuidv4(), vendors_id: vendorId, name: data.name, description: data.description, price: data.price, category: data.category, image_url: data.image_url, status: 1 },
    });
  }

  async update(vendorId: number, id: number, data: Record<string, unknown>) {
    const { name, description, price, category, image_url, status } = data as { name?: string; description?: string; price?: number; category?: string; image_url?: string; status?: number };
    return this.prisma.product_catalogs.update({ where: { id, vendors_id: vendorId }, data: { name, description, price, category, image_url, status } });
  }

  async delete(vendorId: number, id: number) {
    return this.prisma.product_catalogs.delete({ where: { id, vendors_id: vendorId } });
  }
}
