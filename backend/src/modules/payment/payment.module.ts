import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { PaystackService } from './paystack.service';
import { PhonepeService } from './phonepe.service';
import { YoomoneyService } from './yoomoney.service';
@Module({
  controllers: [PaymentController],
  providers: [PaymentService, RazorpayService, StripeService, PaypalService, PaystackService, PhonepeService, YoomoneyService],
  exports: [PaymentService],
})
export class PaymentModule {}
