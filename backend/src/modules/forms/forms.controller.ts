import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId, Public } from '../../common/decorators';
import { FormsService } from './forms.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('WhatsApp Forms')
@Controller('forms')
export class FormsController {
  constructor(private formsService: FormsService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Get()
  async getAll(@VendorId() vendorId: number) { return this.formsService.getForms(vendorId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Get(':id')
  async getOne(@VendorId() vendorId: number, @Param('id') id: string) { return this.formsService.getForm(vendorId, parseInt(id)); }

  @Public()
  @Get('public/:uid')
  async getPublic(@Param('uid') uid: string) { return this.formsService.getPublicForm(uid); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Post()
  async create(@VendorId() vendorId: number, @Body() body: { title: string; description?: string; fields: Record<string, unknown>[]; confirmationMessage?: string }) {
    return this.formsService.createForm(vendorId, body);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Put(':id')
  async update(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.formsService.updateForm(vendorId, parseInt(id), body);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Delete(':id')
  async delete(@VendorId() vendorId: number, @Param('id') id: string) { return this.formsService.deleteForm(vendorId, parseInt(id)); }

  @Public()
  @Post('public/:uid/submit')
  async submitResponse(@Param('uid') uid: string, @Body() body: Record<string, unknown>) {
    return this.formsService.submitFormResponse(uid, body);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, VendorGuard)
  @Get(':id/responses')
  async getResponses(@VendorId() vendorId: number, @Param('id') id: string, @Query('page') page?: string) {
    return this.formsService.getFormResponses(vendorId, parseInt(id), page ? parseInt(page) : 1);
  }
}
