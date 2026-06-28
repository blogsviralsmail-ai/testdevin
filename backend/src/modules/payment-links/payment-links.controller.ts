import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { PaymentLinksService } from './payment-links.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('payment-links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('payment-links')
export class PaymentLinksController {
  constructor(private service: PaymentLinksService) {}

  @Get()
  async getAll(@VendorId() vendorId: number, @Query('page') page?: string) {
    return this.service.getAll(vendorId, page ? parseInt(page) : 1);
  }

  @Post()
  async create(@VendorId() vendorId: number, @Body() body: { title: string; amount: number; currency?: string; gateway?: string }) {
    return this.service.create(vendorId, body);
  }

  @Delete(':id')
  async delete(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.service.delete(vendorId, parseInt(id));
  }
}
