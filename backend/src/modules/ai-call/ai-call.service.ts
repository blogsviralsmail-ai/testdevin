import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiCallService {
  constructor(private prisma: PrismaService) {}

  async initiateCall(vendorId: number, data: { contactId: number; aiConfig?: Record<string, unknown> }) {
    return { callId: uuidv4(), status: 'initiated', contactId: data.contactId };
  }

  async getCallLogs(vendorId: number, page = 1, perPage = 20) {
    return { data: [], meta: { total: 0, page, perPage, totalPages: 0 } };
  }

  async getCallRecording(vendorId: number, callId: string) {
    return { callId, recording: null };
  }
}
