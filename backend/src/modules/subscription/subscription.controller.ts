import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles, VendorId } from '../../common/decorators';
import { SubscriptionService } from './subscription.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('plans')
  async getPlans() { return this.subscriptionService.getPlans(); }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Post('plans')
  async createPlan(@Body() body: { name: string; price: number; duration: number; features: Record<string, unknown> }) {
    return this.subscriptionService.createPlan(body);
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.subscriptionService.updatePlan(parseInt(id), body);
  }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Delete('plans/:id')
  async deletePlan(@Param('id') id: string) { return this.subscriptionService.deletePlan(parseInt(id)); }

  @Get('current')
  async getCurrent(@VendorId() vendorId: number) { return this.subscriptionService.getVendorSubscription(vendorId); }

  @UseGuards(RolesGuard) @Roles(UserRole.SUPER_ADMIN)
  @Post('assign')
  async assign(@Body() body: { vendorId: number; planId: number; paymentMethod?: string }) {
    return this.subscriptionService.assignSubscription(body.vendorId, body.planId, body.paymentMethod);
  }

  @Post('cancel')
  async cancel(@VendorId() vendorId: number) { return this.subscriptionService.cancelSubscription(vendorId); }

  @Get('history')
  async getHistory(@VendorId() vendorId: number) { return this.subscriptionService.getPaymentHistory(vendorId); }
}
