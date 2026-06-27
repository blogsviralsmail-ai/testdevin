import { Controller, Post, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId, Public } from '../../common/decorators';
import { PaymentService } from './payment.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createPayment(@VendorId() vendorId: number, @Body() body: { planId: number; gateway: string }) {
    return this.paymentService.createPayment(vendorId, body.planId, body.gateway);
  }

  @Public()
  @Post('webhook/:gateway')
  @HttpCode(200)
  async handleWebhook(@Param('gateway') gateway: string, @Body() body: Record<string, unknown>) {
    return this.paymentService.verifyPayment(gateway, body);
  }
}
