import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  async getForms(vendorId: number) {
    return this.prisma.whatsapp_forms.findMany({ where: { vendors_id: vendorId }, orderBy: { created_at: 'desc' } });
  }

  async getForm(vendorId: number, formId: number) {
    const form = await this.prisma.whatsapp_forms.findFirst({ where: { id: formId, vendors_id: vendorId } });
    if (!form) throw new NotFoundException('Form not found');
    return { ...form, fields: form.fields ? JSON.parse(form.fields as string) : [] };
  }

  async getPublicForm(formUid: string) {
    const form = await this.prisma.whatsapp_forms.findFirst({ where: { uid: formUid, status: 1 } });
    if (!form) throw new NotFoundException('Form not found');
    return { ...form, fields: form.fields ? JSON.parse(form.fields as string) : [] };
  }

  async createForm(vendorId: number, data: { title: string; description?: string; fields: Record<string, unknown>[]; confirmationMessage?: string }) {
    return this.prisma.whatsapp_forms.create({
      data: {
        uid: uuidv4(), vendors_id: vendorId, title: data.title, description: data.description || '',
        fields: JSON.stringify(data.fields), confirmation_message: data.confirmationMessage || 'Thank you!',
        status: 1, created_at: new Date(), updated_at: new Date(),
      },
    });
  }

  async updateForm(vendorId: number, formId: number, data: Record<string, unknown>) {
    const form = await this.prisma.whatsapp_forms.findFirst({ where: { id: formId, vendors_id: vendorId } });
    if (!form) throw new NotFoundException('Form not found');
    const allowed: Record<string, unknown> = { updated_at: new Date() };
    if (data.title) allowed.title = data.title as string;
    if (data.description !== undefined) allowed.description = data.description as string;
    if (data.fields) allowed.fields = JSON.stringify(data.fields);
    if (data.confirmationMessage) allowed.confirmation_message = data.confirmationMessage as string;
    if (data.status !== undefined) allowed.status = data.status as number;
    return this.prisma.whatsapp_forms.update({ where: { id: formId }, data: allowed });
  }

  async deleteForm(vendorId: number, formId: number) {
    await this.prisma.whatsapp_form_responses.deleteMany({ where: { whatsapp_forms_id: formId } });
    await this.prisma.whatsapp_forms.delete({ where: { id: formId } });
    return { success: true };
  }

  async submitFormResponse(formUid: string, responseData: Record<string, unknown>) {
    const form = await this.prisma.whatsapp_forms.findFirst({ where: { uid: formUid } });
    if (!form) throw new NotFoundException('Form not found');
    return this.prisma.whatsapp_form_responses.create({
      data: { uid: uuidv4(), whatsapp_forms_id: form.id, vendors_id: form.vendors_id, response_data: JSON.stringify(responseData), created_at: new Date() },
    });
  }

  async getFormResponses(vendorId: number, formId: number, page = 1, perPage = 25) {
    const skip = (page - 1) * perPage;
    const [responses, total] = await Promise.all([
      this.prisma.whatsapp_form_responses.findMany({ where: { whatsapp_forms_id: formId }, skip, take: perPage, orderBy: { created_at: 'desc' } }),
      this.prisma.whatsapp_form_responses.count({ where: { whatsapp_forms_id: formId } }),
    ]);
    return { data: responses.map(r => ({ ...r, response_data: r.response_data ? JSON.parse(r.response_data as string) : {} })), meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) } };
  }
}
