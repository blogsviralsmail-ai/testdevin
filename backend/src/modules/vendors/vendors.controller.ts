import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles, VendorId } from '../../common/decorators';
import { VendorsService } from './vendors.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  async getAll(@Query('page') page?: string, @Query('search') search?: string) {
    return this.vendorsService.getVendors(page ? parseInt(page) : 1, 20, search);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get(':id')
  async getOne(@Param('id') id: string) { return this.vendorsService.getVendor(parseInt(id)); }

  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  async create(@Body() body: { title: string; email: string; password: string; phone?: string }) {
    return this.vendorsService.createVendor(body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.vendorsService.updateVendor(parseInt(id), body);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) { return this.vendorsService.deleteVendor(parseInt(id)); }

  @Roles(UserRole.SUPER_ADMIN)
  @Post(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) { return this.vendorsService.toggleStatus(parseInt(id)); }

  @Get('settings/my')
  async getMySettings(@VendorId() vendorId: number) { return this.vendorsService.getVendorSettings(vendorId); }

  @Post('settings/my')
  async updateMySettings(@VendorId() vendorId: number, @Body() body: { settings: { name: string; value: string }[] }) {
    return this.vendorsService.updateVendorSettings(vendorId, body.settings);
  }

  @Get(':id/users')
  async getVendorUsers(@Param('id') id: string) { return this.vendorsService.getVendorUsers(parseInt(id)); }
}
