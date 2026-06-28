import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class RazorpayService {
  constructor(private configService: ConfigService) {}

  async createOrder(amount: number, description: string) { return { gateway: 'razorpay', amount, description, orderId: 'order_' + Date.now() }; }
  async createSession(amount: number, description: string, vendorId: number, planId: number) { return { gateway: 'razorpay', amount, sessionId: 'session_' + Date.now() }; }
  async createPayment(amount: number, vendorId: number, planId: number) { return { gateway: 'razorpay', amount, paymentId: 'pay_' + Date.now() }; }
  async initializeTransaction(amount: number, vendorId: number) { return { gateway: 'razorpay', amount, reference: 'ref_' + Date.now() }; }
  async verifyPayment(data: Record<string, unknown>) { return { verified: true, gateway: 'razorpay' }; }
}
