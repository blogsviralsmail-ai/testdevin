import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId, CurrentUser } from '../../common/decorators';
import { InvoicesService } from './invoices.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private service: InvoicesService) {}

  @Get()
  async getAll(@CurrentUser() user: { role: number; vendorId: number | null }, @Query('page') page?: string) {
    const vendorId = user.role === 1 ? null : user.vendorId;
    return this.service.getAll(vendorId, page ? parseInt(page) : 1);
  }
}
