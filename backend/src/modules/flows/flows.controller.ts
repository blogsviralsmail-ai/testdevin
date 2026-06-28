import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { FlowsService } from './flows.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('WhatsApp Flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('whatsapp-flows')
export class FlowsController {
  constructor(private flowsService: FlowsService) {}

  @Get()
  async getAll(@VendorId() vendorId: number) { return this.flowsService.getFlows(vendorId); }

  @Post()
  async create(@VendorId() vendorId: number, @Body() body: { name: string; categories: string[] }) {
    return this.flowsService.createFlow(vendorId, body);
  }

  @Post(':id/publish')
  async publish(@VendorId() vendorId: number, @Param('id') id: string) { return this.flowsService.publishFlow(vendorId, parseInt(id)); }

  @Delete(':id')
  async delete(@VendorId() vendorId: number, @Param('id') id: string) { return this.flowsService.deleteFlow(vendorId, parseInt(id)); }
}
