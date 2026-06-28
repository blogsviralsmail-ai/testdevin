import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PresetMessagesService {
  constructor(private prisma: PrismaService) {}

  async getAll(vendorId: number, page = 1, perPage = 20) {
    const where = { vendors_id: vendorId };
    const [items, total] = await Promise.all([
      this.prisma.preset_messages.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.preset_messages.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async create(vendorId: number, data: { title: string; message: string; type?: string }) {
    return this.prisma.preset_messages.create({
      data: { uid: uuidv4(), vendors_id: vendorId, title: data.title, message: data.message, type: data.type || 'text', status: 1 },
    });
  }

  async update(vendorId: number, id: number, data: Record<string, unknown>) {
    const { title, message, type, status } = data as { title?: string; message?: string; type?: string; status?: number };
    return this.prisma.preset_messages.update({ where: { id, vendors_id: vendorId }, data: { title, message, type, status } });
  }

  async delete(vendorId: number, id: number) {
    return this.prisma.preset_messages.delete({ where: { id, vendors_id: vendorId } });
  }
}
