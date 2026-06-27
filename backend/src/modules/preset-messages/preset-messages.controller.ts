import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { PresetMessagesService } from './preset-messages.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('preset-messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('preset-messages')
export class PresetMessagesController {
  constructor(private service: PresetMessagesService) {}

  @Get()
  async getAll(@VendorId() vendorId: number, @Query('page') page?: string) {
    return this.service.getAll(vendorId, page ? parseInt(page) : 1);
  }

  @Post()
  async create(@VendorId() vendorId: number, @Body() body: { title: string; message: string; type?: string }) {
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
