import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async getContacts(vendorId: number, page = 1, perPage = 25, search?: string, groupId?: number, labelId?: number) {
    const skip = (page - 1) * perPage;
    const whereClause: Record<string, unknown> = { vendors_id: vendorId };

    if (search) {
      whereClause.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { wa_id: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contacts.findMany({ where: whereClause, skip, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.contacts.count({ where: whereClause }),
    ]);

    return {
      data: contacts,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    };
  }

  async getContact(vendorId: number, contactId: number) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async createContact(vendorId: number, data: { firstName: string; lastName?: string; waId: string; email?: string; phone?: string; country?: string }) {
    const existing = await this.prisma.contacts.findFirst({
      where: { wa_id: data.waId, vendors_id: vendorId },
    });
    if (existing) throw new BadRequestException('Contact with this WhatsApp number already exists');

    return this.prisma.contacts.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        first_name: data.firstName,
        last_name: data.lastName || '',
        wa_id: data.waId,
        email: data.email || null,
        country: data.country || null,
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async updateContact(vendorId: number, contactId: number, data: Record<string, unknown>) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.firstName) updateData.first_name = data.firstName as string;
    if (data.lastName !== undefined) updateData.last_name = data.lastName as string;
    if (data.email !== undefined) updateData.email = data.email as string;
    if (data.country) updateData.country = data.country as string;

    return this.prisma.contacts.update({
      where: { id: contactId },
      data: updateData,
    });
  }

  async deleteContact(vendorId: number, contactId: number) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    await this.prisma.whatsapp_message_logs.deleteMany({ where: { contacts_id: contactId } });
    await this.prisma.contacts.delete({ where: { id: contactId } });
    return { success: true, message: 'Contact deleted' };
  }

  async bulkDelete(vendorId: number, contactIds: number[]) {
    await this.prisma.whatsapp_message_logs.deleteMany({
      where: { contacts_id: { in: contactIds }, vendors_id: vendorId },
    });
    await this.prisma.contacts.deleteMany({
      where: { id: { in: contactIds }, vendors_id: vendorId },
    });
    return { success: true, message: `${contactIds.length} contacts deleted` };
  }

  async importContacts(vendorId: number, contacts: { firstName: string; lastName?: string; waId: string; email?: string }[]) {
    let imported = 0;
    let skipped = 0;

    for (const c of contacts) {
      const existing = await this.prisma.contacts.findFirst({
        where: { wa_id: c.waId, vendors_id: vendorId },
      });
      if (existing) { skipped++; continue; }

      await this.prisma.contacts.create({
        data: {
          uid: uuidv4(),
          vendors_id: vendorId,
          first_name: c.firstName,
          last_name: c.lastName || '',
          wa_id: c.waId,
          email: c.email || null,
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      imported++;
    }

    return { imported, skipped, total: contacts.length };
  }

  async exportContacts(vendorId: number) {
    return this.prisma.contacts.findMany({
      where: { vendors_id: vendorId },
      select: { first_name: true, last_name: true, wa_id: true, email: true, country: true, created_at: true },
    });
  }

  async blockContact(vendorId: number, contactId: number) {
    return this.prisma.contacts.update({
      where: { id: contactId },
      data: { status: 0 },
    });
  }

  async unblockContact(vendorId: number, contactId: number) {
    return this.prisma.contacts.update({
      where: { id: contactId },
      data: { status: 1 },
    });
  }

  async assignLabel(vendorId: number, contactId: number, labelId: number) {
    await this.prisma.contact_labels.create({
      data: {
        uid: uuidv4(),
        contacts_id: contactId,
        labels_id: labelId,
        vendors_id: vendorId,
      },
    });
    return { success: true };
  }

  async removeLabel(vendorId: number, contactId: number, labelId: number) {
    await this.prisma.contact_labels.deleteMany({
      where: { contacts_id: contactId, labels_id: labelId },
    });
    return { success: true };
  }

  async getLabels(vendorId: number) {
    return this.prisma.labels.findMany({ where: { vendors_id: vendorId } });
  }

  async createLabel(vendorId: number, data: { title: string; color: string }) {
    return this.prisma.labels.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        title: data.title,
        text_color: data.color,
        status: 1,
        created_at: new Date(),
      },
    });
  }
}
