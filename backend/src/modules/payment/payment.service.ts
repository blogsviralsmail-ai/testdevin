import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { PaystackService } from './paystack.service';
import { PhonepeService } from './phonepe.service';
import { YoomoneyService } from './yoomoney.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private razorpay: RazorpayService,
    private stripe: StripeService,
    private paypal: PaypalService,
    private paystack: PaystackService,
    private phonepe: PhonepeService,
    private yoomoney: YoomoneyService,
  ) {}

  async createPayment(vendorId: number, planId: number, gateway: string) {
    const plan = await this.prisma.subscription_plans.findFirst({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    switch (gateway) {
      case 'razorpay': return this.razorpay.createOrder(Number(plan.price) || 0, plan.name || '');
      case 'stripe': return this.stripe.createSession(Number(plan.price) || 0, plan.name || '', vendorId, planId);
      case 'paypal': return this.paypal.createOrder(Number(plan.price) || 0, plan.name || '');
      case 'paystack': return this.paystack.initializeTransaction(Number(plan.price) || 0, vendorId);
      case 'phonepe': return this.phonepe.createPayment(Number(plan.price) || 0, vendorId, planId);
      case 'yoomoney': return this.yoomoney.createPayment(Number(plan.price) || 0, vendorId, planId);
      default: throw new BadRequestException('Invalid payment gateway');
    }
  }

  async verifyPayment(gateway: string, data: Record<string, unknown>) {
    switch (gateway) {
      case 'razorpay': return this.razorpay.verifyPayment(data);
      case 'stripe': return this.stripe.verifyPayment(data);
      case 'paypal': return this.paypal.verifyPayment(data);
      case 'paystack': return this.paystack.verifyPayment(data);
      case 'phonepe': return this.phonepe.verifyPayment(data);
      case 'yoomoney': return this.yoomoney.verifyPayment(data);
      default: throw new BadRequestException('Invalid payment gateway');
    }
  }
}
