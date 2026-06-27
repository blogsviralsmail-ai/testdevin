import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscription_plans.findMany({ where: { status: 1 }, orderBy: { price: 'asc' } });
  }

  async createPlan(data: { name: string; price: number; duration: number; features: Record<string, unknown> }) {
    return this.prisma.subscription_plans.create({
      data: { uid: uuidv4(), name: data.name, price: data.price, duration_days: data.duration,
        features: JSON.stringify(data.features), status: 1, created_at: new Date(), updated_at: new Date() },
    });
  }

  async updatePlan(planId: number, data: Record<string, unknown>) {
    const allowed: Record<string, unknown> = { updated_at: new Date() };
    if (data.name) allowed.name = data.name as string;
    if (data.price !== undefined) allowed.price = data.price as number;
    if (data.duration !== undefined) allowed.duration_days = data.duration as number;
    if (data.features) allowed.features = JSON.stringify(data.features);
    if (data.status !== undefined) allowed.status = data.status as number;
    return this.prisma.subscription_plans.update({ where: { id: planId }, data: allowed });
  }

  async deletePlan(planId: number) {
    await this.prisma.subscription_plans.delete({ where: { id: planId } });
    return { success: true };
  }

  async getVendorSubscription(vendorId: number) {
    return this.prisma.subscriptions.findFirst({ where: { vendors_id: vendorId }, orderBy: { created_at: 'desc' } });
  }

  async assignSubscription(vendorId: number, planId: number, paymentMethod?: string) {
    const plan = await this.prisma.subscription_plans.findFirst({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (plan.duration_days || 30));

    return this.prisma.subscriptions.create({
      data: {
        uid: uuidv4(), vendors_id: vendorId, subscription_plans_id: planId, plan_name: plan.name,
        price: plan.price, status: 'active', payment_method: paymentMethod || 'manual',
        expiry_at: expiryDate, created_at: new Date(), updated_at: new Date(),
      },
    });
  }

  async cancelSubscription(vendorId: number) {
    const sub = await this.prisma.subscriptions.findFirst({ where: { vendors_id: vendorId, status: 'active' } });
    if (!sub) throw new NotFoundException('No active subscription');
    return this.prisma.subscriptions.update({ where: { id: sub.id }, data: { status: 'cancelled' } });
  }

  async getPaymentHistory(vendorId: number) {
    return this.prisma.subscriptions.findMany({ where: { vendors_id: vendorId }, orderBy: { created_at: 'desc' } });
  }
}
