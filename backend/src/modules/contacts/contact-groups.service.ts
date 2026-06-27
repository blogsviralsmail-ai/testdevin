import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContactGroupsService {
  constructor(private prisma: PrismaService) {}

  async getGroups(vendorId: number) {
    return this.prisma.contact_groups.findMany({
      where: { vendors_id: vendorId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createGroup(vendorId: number, data: { title: string; description?: string }) {
    return this.prisma.contact_groups.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        title: data.title,
        description: data.description || null,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async updateGroup(vendorId: number, groupId: number, data: { title?: string; description?: string }) {
    return this.prisma.contact_groups.update({
      where: { id: groupId },
      data: { ...data, updated_at: new Date() },
    });
  }

  async deleteGroup(vendorId: number, groupId: number) {
    await this.prisma.group_contact_assigns.deleteMany({ where: { contact_groups_id: groupId } });
    await this.prisma.contact_groups.delete({ where: { id: groupId } });
    return { success: true };
  }

  async addContactsToGroup(vendorId: number, groupId: number, contactIds: number[]) {
    for (const contactId of contactIds) {
      const existing = await this.prisma.group_contact_assigns.findFirst({
        where: { contact_groups_id: groupId, contacts_id: contactId },
      });
      if (!existing) {
        await this.prisma.group_contact_assigns.create({
          data: {
            uid: uuidv4(),
            contact_groups_id: groupId,
            contacts_id: contactId,
          },
        });
      }
    }
    return { success: true, added: contactIds.length };
  }

  async removeContactsFromGroup(groupId: number, contactIds: number[]) {
    await this.prisma.group_contact_assigns.deleteMany({
      where: { contact_groups_id: groupId, contacts_id: { in: contactIds } },
    });
    return { success: true };
  }

  async getGroupContacts(groupId: number) {
    const assigns = await this.prisma.group_contact_assigns.findMany({
      where: { contact_groups_id: groupId },
    });
    const contactIds = assigns.map(a => a.contacts_id).filter((id): id is number => id !== null);
    return this.prisma.contacts.findMany({ where: { id: { in: contactIds } } });
  }
}
