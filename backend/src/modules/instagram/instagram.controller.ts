import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { InstagramService } from './instagram.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('instagram')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('instagram')
export class InstagramController {
  constructor(private service: InstagramService) {}

  @Get('status')
  async getStatus(@VendorId() vendorId: number) {
    return this.service.getIntegrationStatus(vendorId);
  }

  @Post('connect')
  async connect(@VendorId() vendorId: number, @Body() body: { accountId: string; accessToken: string }) {
    return this.service.connect(vendorId, body);
  }

  @Post('disconnect')
  async disconnect(@VendorId() vendorId: number) {
    return this.service.disconnect(vendorId);
  }
}
