import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { ContactsService } from './contacts.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  async getContacts(
    @VendorId() vendorId: number,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
    @Query('labelId') labelId?: string,
  ) {
    return this.contactsService.getContacts(
      vendorId,
      page ? parseInt(page) : 1,
      perPage ? parseInt(perPage) : 25,
      search,
      groupId ? parseInt(groupId) : undefined,
      labelId ? parseInt(labelId) : undefined,
    );
  }

  @Get(':id')
  async getContact(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.contactsService.getContact(vendorId, parseInt(id));
  }

  @Post()
  async createContact(@VendorId() vendorId: number, @Body() body: { firstName: string; lastName?: string; waId: string; email?: string; phone?: string; country?: string }) {
    return this.contactsService.createContact(vendorId, body);
  }

  @Put(':id')
  async updateContact(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.contactsService.updateContact(vendorId, parseInt(id), body);
  }

  @Delete(':id')
  async deleteContact(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.contactsService.deleteContact(vendorId, parseInt(id));
  }

  @Post('bulk-delete')
  async bulkDelete(@VendorId() vendorId: number, @Body() body: { ids: number[] }) {
    return this.contactsService.bulkDelete(vendorId, body.ids);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importContacts(@VendorId() vendorId: number, @UploadedFile() file: Express.Multer.File) {
    // Parse CSV/Excel file - simplified
    const contacts: { firstName: string; waId: string }[] = [];
    return this.contactsService.importContacts(vendorId, contacts);
  }

  @Get('export/csv')
  async exportContacts(@VendorId() vendorId: number) {
    return this.contactsService.exportContacts(vendorId);
  }

  @Post(':id/block')
  async blockContact(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.contactsService.blockContact(vendorId, parseInt(id));
  }

  @Post(':id/unblock')
  async unblockContact(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.contactsService.unblockContact(vendorId, parseInt(id));
  }

  @Post(':id/labels/:labelId')
  async assignLabel(@VendorId() vendorId: number, @Param('id') id: string, @Param('labelId') labelId: string) {
    return this.contactsService.assignLabel(vendorId, parseInt(id), parseInt(labelId));
  }

  @Delete(':id/labels/:labelId')
  async removeLabel(@VendorId() vendorId: number, @Param('id') id: string, @Param('labelId') labelId: string) {
    return this.contactsService.removeLabel(vendorId, parseInt(id), parseInt(labelId));
  }

  @Get('labels/all')
  async getLabels(@VendorId() vendorId: number) {
    return this.contactsService.getLabels(vendorId);
  }

  @Post('labels')
  async createLabel(@VendorId() vendorId: number, @Body() body: { title: string; color: string }) {
    return this.contactsService.createLabel(vendorId, body);
  }
}
