import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { ContactGroupsService } from './contact-groups.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Contact Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('contact-groups')
export class ContactGroupsController {
  constructor(private groupsService: ContactGroupsService) {}

  @Get()
  async getGroups(@VendorId() vendorId: number) {
    return this.groupsService.getGroups(vendorId);
  }

  @Post()
  async createGroup(@VendorId() vendorId: number, @Body() body: { title: string; description?: string }) {
    return this.groupsService.createGroup(vendorId, body);
  }

  @Put(':id')
  async updateGroup(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: { title?: string; description?: string }) {
    return this.groupsService.updateGroup(vendorId, parseInt(id), body);
  }

  @Delete(':id')
  async deleteGroup(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.groupsService.deleteGroup(vendorId, parseInt(id));
  }

  @Post(':id/contacts')
  async addContacts(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: { contactIds: number[] }) {
    return this.groupsService.addContactsToGroup(vendorId, parseInt(id), body.contactIds);
  }

  @Delete(':id/contacts')
  async removeContacts(@VendorId() vendorId: number, @Param('id') id: string, @Body() body: { contactIds: number[] }) {
    return this.groupsService.removeContactsFromGroup(parseInt(id), body.contactIds);
  }

  @Get(':id/contacts')
  async getGroupContacts(@VendorId() vendorId: number, @Param('id') id: string) {
    return this.groupsService.getGroupContacts(parseInt(id));
  }
}
