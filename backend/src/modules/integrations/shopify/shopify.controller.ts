import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../../common/guards/vendor.guard';
import { VendorId, Public } from '../../../common/decorators';
import { ShopifyService } from './shopify.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Shopify')
@Controller('integrations/shopify')
export class ShopifyController {
  constructor(private shopifyService: ShopifyService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Post('connect')
  async connect(@VendorId() vendorId: number, @Body() body: { shopDomain: string; accessToken: string }) {
    return this.shopifyService.connectStore(vendorId, body);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Delete('disconnect')
  async disconnect(@VendorId() vendorId: number) { return this.shopifyService.disconnectStore(vendorId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Get('products')
  async getProducts(@VendorId() vendorId: number) { return this.shopifyService.getProducts(vendorId); }

  @Public()
  @Post('webhook/:vendorId')
  @HttpCode(200)
  async webhook(@Param('vendorId') vendorId: string, @Body() body: Record<string, unknown>) {
    return this.shopifyService.handleWebhook(parseInt(vendorId), body['topic'] as string || '', body);
  }
}
