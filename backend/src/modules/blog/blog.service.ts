import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async getArticles(page = 1, perPage = 20, search?: string) {
    const where = search ? { title: { contains: search } } : {};
    const [items, total] = await Promise.all([
      this.prisma.blog_articles.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.blog_articles.count({ where }),
    ]);
    return { items, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async getArticle(id: number) {
    return this.prisma.blog_articles.findUnique({ where: { id } });
  }

  async createArticle(data: { title: string; slug?: string; content?: string; category?: string }) {
    return this.prisma.blog_articles.create({
      data: { uid: uuidv4(), title: data.title, slug: data.slug || data.title.toLowerCase().replace(/\s+/g, '-'), content: data.content, category: data.category, status: 1 },
    });
  }

  async updateArticle(id: number, data: Record<string, unknown>) {
    const { title, slug, content, category, status } = data as { title?: string; slug?: string; content?: string; category?: string; status?: number };
    return this.prisma.blog_articles.update({ where: { id }, data: { title, slug, content, category, status } });
  }

  async deleteArticle(id: number) {
    return this.prisma.blog_articles.delete({ where: { id } });
  }
}
