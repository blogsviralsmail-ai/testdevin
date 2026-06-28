import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { ProductCatalogService } from './product-catalog.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('product-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('product-catalog')
export class ProductCatalogController {
  constructor(private service: ProductCatalogService) {}

  @Get()
  async getAll(@VendorId() vendorId: number, @Query('page') page?: string, @Query('search') search?: string) {
    return this.service.getAll(vendorId, page ? parseInt(page) : 1, 20, search);
  }

  @Post()
  async create(@VendorId() vendorId: number, @Body() body: { name: string; description?: string; price: number; category?: string; image_url?: string }) {
    return this.service.create(vendorId, body);
  }

  @Put(':id')
  async update(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(vendorId, parseInt(id), body);
  }

  @Delete(':id')
  async delete(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.service.delete(vendorId, parseInt(id));
  }
}
