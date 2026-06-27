import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { FacebookService } from './facebook.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('facebook')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('facebook')
export class FacebookController {
  constructor(private service: FacebookService) {}

  @Get('status')
  async getStatus(@VendorId() vendorId: number) {
    return this.service.getIntegrationStatus(vendorId);
  }

  @Post('connect')
  async connect(@VendorId() vendorId: number, @Body() body: { pageId: string; accessToken: string }) {
    return this.service.connect(vendorId, body);
  }

  @Post('disconnect')
  async disconnect(@VendorId() vendorId: number) {
    return this.service.disconnect(vendorId);
  }
}
