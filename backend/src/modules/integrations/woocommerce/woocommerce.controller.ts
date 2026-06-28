import { Controller, Post, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../../common/guards/vendor.guard';
import { VendorId, Public } from '../../../common/decorators';
import { WoocommerceService } from './woocommerce.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('WooCommerce')
@Controller('integrations/woocommerce')
export class WoocommerceController {
  constructor(private wooService: WoocommerceService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Post('connect')
  async connect(@VendorId() vendorId: number, @Body() body: { storeUrl: string; consumerKey: string; consumerSecret: string }) {
    return this.wooService.connectStore(vendorId, body);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Delete('disconnect')
  async disconnect(@VendorId() vendorId: number) { return this.wooService.disconnectStore(vendorId); }

  @Public()
  @Post('webhook/:vendorId')
  @HttpCode(200)
  async webhook(@Param('vendorId') vendorId: string, @Body() body: Record<string, unknown>) {
    return this.wooService.handleWebhook(parseInt(vendorId), body);
  }
}
