import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async getVendors(page = 1, perPage = 20, search?: string) {
    const skip = (page - 1) * perPage;
    const whereClause: Record<string, unknown> = {};
    if (search) { whereClause.OR = [{ title: { contains: search } }, { slug: { contains: search } }]; }
    const [vendors, total] = await Promise.all([
      this.prisma.vendors.findMany({ where: whereClause, skip, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.vendors.count({ where: whereClause }),
    ]);
    return { data: vendors, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async getVendor(vendorId: number) {
    const vendor = await this.prisma.vendors.findFirst({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async createVendor(data: { title: string; email: string; password: string; phone?: string }) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const vendor = await this.prisma.vendors.create({
      data: { uid: uuidv4(), title: data.title, slug, status: 1, created_at: new Date(), updated_at: new Date() },
    });
    // Create vendor admin user
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await this.prisma.users.create({
      data: {
        uid: uuidv4(), email: data.email, password: hashedPassword, first_name: data.title,
        last_name: 'Admin', user_roles_id: 2, vendors_id: vendor.id, status: 1,
        created_at: new Date(), updated_at: new Date(),
      },
    });
    return vendor;
  }

  async updateVendor(vendorId: number, data: Record<string, unknown>) {
    const allowed: Record<string, unknown> = { updated_at: new Date() };
    if (data.title) allowed.title = data.title as string;
    if (data.slug) allowed.slug = data.slug as string;
    if (data.status !== undefined) allowed.status = data.status as number;
    if (data.phone) allowed.phone = data.phone as string;
    return this.prisma.vendors.update({ where: { id: vendorId }, data: allowed });
  }

  async deleteVendor(vendorId: number) {
    await this.prisma.users.deleteMany({ where: { vendors_id: vendorId } });
    await this.prisma.vendors.delete({ where: { id: vendorId } });
    return { success: true };
  }

  async toggleStatus(vendorId: number) {
    const vendor = await this.prisma.vendors.findFirst({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.prisma.vendors.update({ where: { id: vendorId }, data: { status: vendor.status === 1 ? 0 : 1 } });
  }

  async getVendorSettings(vendorId: number) {
    return this.prisma.vendor_settings.findMany({ where: { vendors_id: vendorId } });
  }

  async updateVendorSettings(vendorId: number, settings: { name: string; value: string }[]) {
    for (const s of settings) {
      await this.prisma.vendor_settings.upsert({
        where: { vendors__id_name: { vendors_id: vendorId, name: s.name } },
        update: { value: s.value },
        create: { uid: uuidv4(), vendors_id: vendorId, name: s.name, value: s.value },
      });
    }
    return { success: true };
  }

  async getVendorUsers(vendorId: number) {
    return this.prisma.users.findMany({ where: { vendors_id: vendorId }, select: { id: true, email: true, first_name: true, last_name: true, user_roles_id: true, status: true, created_at: true } });
  }
}
