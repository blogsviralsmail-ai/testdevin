import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async getPages(page = 1, perPage = 20, search?: string) {
    const where = search ? { title: { contains: search } } : {};
    const [items, total] = await Promise.all([
      this.prisma.pages.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.pages.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async getPage(id: number) {
    return this.prisma.pages.findUnique({ where: { id } });
  }

  async createPage(data: { title: string; slug?: string; content?: string; meta_title?: string; meta_description?: string }) {
    return this.prisma.pages.create({
      data: { uid: uuidv4(), title: data.title, slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-'), content: data.content, meta_title: data.meta_title, meta_description: data.meta_description, status: 1 },
    });
  }

  async updatePage(id: number, data: Record<string, unknown>) {
    const { title, slug, content, meta_title, meta_description, status } = data as { title?: string; slug?: string; content?: string; meta_title?: string; meta_description?: string; status?: number };
    return this.prisma.pages.update({ where: { id }, data: { title, slug, content, meta_title, meta_description, status } });
  }

  async deletePage(id: number) {
    return this.prisma.pages.delete({ where: { id } });
  }
}
