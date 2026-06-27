import { Controller, Get, Post, Body, Param, Query, HttpCode } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('WhatsApp Webhook')
@Controller('webhook/whatsapp')
export class WhatsappWebhookController {
  constructor(
    private whatsappService: WhatsappService,
    private prisma: PrismaService,
  ) {}

  // Webhook verification (GET request from Meta)
  @Public()
  @Get(':vendorUid')
  async verifyWebhook(
    @Param('vendorUid') vendorUid: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    // Find vendor and check verify token
    const vendor = await this.prisma.vendors.findFirst({ where: { uid: vendorUid } });
    if (!vendor) return 'Vendor not found';

    const settings = await this.prisma.vendor_settings.findFirst({
      where: { vendors_id: vendor.id, name: 'webhook_verify_token' },
    });

    if (mode === 'subscribe' && verifyToken === settings?.value) {
      return challenge;
    }

    return 'Verification failed';
  }

  // Webhook events (POST request from Meta)
  @Public()
  @Post(':vendorUid')
  @HttpCode(200)
  async handleWebhook(
    @Param('vendorUid') vendorUid: string,
    @Body() body: Record<string, unknown>,
  ) {
    // Acknowledge immediately, process async
    this.whatsappService.processWebhook(vendorUid, body).catch((err) => {
      console.error('Webhook processing error:', err);
    });
    return 'EVENT_RECEIVED';
  }
}
