import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(page = 1, perPage = 20, search?: string) {
    const skip = (page - 1) * perPage;
    const whereClause: Record<string, unknown> = {};
    if (search) whereClause.OR = [{ email: { contains: search } }, { first_name: { contains: search } }];
    const [users, total] = await Promise.all([
      this.prisma.users.findMany({ where: whereClause, skip, take: perPage, orderBy: { created_at: 'desc' }, select: { id: true, uid: true, email: true, first_name: true, last_name: true, user_roles_id: true, vendors_id: true, status: true, created_at: true } }),
      this.prisma.users.count({ where: whereClause }),
    ]);
    return { data: users, meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }

  async createUser(data: { email: string; password: string; firstName: string; lastName: string; roleId: number; vendorId?: number }) {
    const existing = await this.prisma.users.findFirst({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email already in use');
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.users.create({
      data: { uid: uuidv4(), email: data.email, password: hashedPassword, first_name: data.firstName, last_name: data.lastName, user_roles_id: data.roleId, vendors_id: data.vendorId || null, status: 1, created_at: new Date(), updated_at: new Date() },
    });
  }

  async updateUser(userId: number, data: Record<string, unknown>) {
    const allowed: Record<string, unknown> = { updated_at: new Date() };
    if (data.firstName) allowed.first_name = data.firstName as string;
    if (data.lastName !== undefined) allowed.last_name = data.lastName as string;
    if (data.email) allowed.email = data.email as string;
    if (data.password) allowed.password = await bcrypt.hash(data.password as string, 10);
    if (data.status !== undefined) allowed.status = data.status as number;
    if (data.roleId !== undefined) allowed.user_roles_id = data.roleId as number;
    if (data.role !== undefined) allowed.user_roles_id = data.role as number;
    return this.prisma.users.update({ where: { id: userId }, data: allowed });
  }

  async deleteUser(userId: number) {
    await this.prisma.users.delete({ where: { id: userId } });
    return { success: true };
  }

  async getLoginLogs(userId?: number, page = 1, perPage = 50) {
    const skip = (page - 1) * perPage;
    const where = userId ? { users_id: userId } : {};
    return this.prisma.login_logs.findMany({ where, skip, take: perPage, orderBy: { logged_in_at: 'desc' } });
  }
}
