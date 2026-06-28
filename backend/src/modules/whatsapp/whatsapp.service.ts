import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WebsocketGateway } from '../../gateway/websocket.gateway';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as FormData from 'form-data';
import * as fs from 'fs';

interface SendMessagePayload {
  to: string;
  type: string;
  text?: { body: string };
  image?: { id?: string; link?: string; caption?: string };
  video?: { id?: string; link?: string; caption?: string };
  document?: { id?: string; link?: string; caption?: string; filename?: string };
  audio?: { id?: string; link?: string };
  sticker?: { id?: string; link?: string };
  template?: Record<string, unknown>;
  interactive?: Record<string, unknown>;
  context?: { message_id: string };
}

interface VendorSettings {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly graphApiUrl = 'https://graph.facebook.com/v18.0';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private wsGateway: WebsocketGateway,
    @InjectQueue('message-queue') private messageQueue: Queue,
  ) {}

  async getVendorSettings(vendorId: number): Promise<VendorSettings> {
    const settings = await this.prisma.vendor_settings.findMany({
      where: { vendors_id: vendorId },
    });

    const settingsMap = new Map(settings.map((s) => [s.name, s.value]));

    return {
      phoneNumberId: settingsMap.get('current_phone_number_id') || '',
      accessToken: settingsMap.get('whatsapp_access_token') || '',
      businessAccountId: settingsMap.get('whatsapp_business_account_id') || '',
      webhookVerifyToken: settingsMap.get('webhook_verify_token') || '',
    };
  }

  // Chat data for chat page
  async getChatData(vendorId: number, contactUid?: string, assigned?: string) {
    const whereClause: Record<string, unknown> = { vendors_id: vendorId };
    if (assigned === 'me') {
      // Filter by assigned to current user
    }

    const contacts = await this.prisma.contacts.findMany({
      where: whereClause,
      orderBy: { last_message_at: 'desc' },
      take: 50,
    });

    let activeContact = null;
    let messages: unknown[] = [];

    if (contactUid) {
      activeContact = await this.prisma.contacts.findFirst({
        where: { uid: contactUid, vendors_id: vendorId },
      });
      if (activeContact) {
        messages = await this.getContactMessages(activeContact.id);
      }
    }

    return { contacts, activeContact, messages };
  }

  async getContactMessages(contactId: number, limit = 50, before?: number) {
    const whereClause: Record<string, unknown> = { contacts_id: contactId };
    if (before) {
      whereClause.id = { lt: before };
    }

    const messages = await this.prisma.whatsapp_message_logs.findMany({
      where: whereClause,
      orderBy: { messaged_at: 'desc' },
      take: limit,
    });

    return messages.reverse();
  }

  async getContactsForChat(vendorId: number, search?: string, labelId?: number) {
    const whereClause: Record<string, unknown> = { vendors_id: vendorId };
    if (search) {
      whereClause.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { wa_id: { contains: search } },
      ];
    }

    const contacts = await this.prisma.contacts.findMany({
      where: whereClause,
      orderBy: { last_message_at: 'desc' },
      take: 100,
    });

    return contacts;
  }

  // Send text message
  async sendTextMessage(vendorId: number, contactId: number, text: string, replyToMessageId?: string) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const settings = await this.getVendorSettings(vendorId);
    if (!settings.phoneNumberId || !settings.accessToken) {
      throw new BadRequestException('WhatsApp not configured for this vendor');
    }

    const payload: SendMessagePayload = {
      to: contact.wa_id || '',
      type: 'text',
      text: { body: text },
    };

    if (replyToMessageId) {
      payload.context = { message_id: replyToMessageId };
    }

    const result = await this.sendWhatsAppMessage(settings.phoneNumberId, settings.accessToken, payload);

    // Save message log
    const messageLog = await this.prisma.whatsapp_message_logs.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        contacts_id: contactId,
        message: text,
        message_type: 'text',
        is_incoming_message: 0,
        whatsapp_message_id: result.messages?.[0]?.id || '',
        status: 'sent',
        messaged_at: new Date(),
        phone_number_id: settings.phoneNumberId,
      },
    });

    // Update contact last message
    await this.prisma.contacts.update({
      where: { id: contactId },
      data: { last_message_at: new Date() },
    });

    // Emit socket event
    this.wsGateway.emitNewMessage(vendorId, contactId, {
      id: messageLog.id,
      uid: messageLog.uid,
      message: text,
      type: 'text',
      isIncoming: false,
      status: 'sent',
      timestamp: new Date(),
    });

    return messageLog;
  }

  // Send media message
  async sendMediaMessage(
    vendorId: number,
    contactId: number,
    type: 'image' | 'video' | 'document' | 'audio' | 'sticker',
    mediaPath: string,
    caption?: string,
    filename?: string,
  ) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const settings = await this.getVendorSettings(vendorId);

    // Upload media first
    const mediaId = await this.uploadMedia(settings.phoneNumberId, settings.accessToken, mediaPath);

    const payload: SendMessagePayload = {
      to: contact.wa_id || '',
      type,
    };

    switch (type) {
      case 'image':
        payload.image = { id: mediaId, caption };
        break;
      case 'video':
        payload.video = { id: mediaId, caption };
        break;
      case 'document':
        payload.document = { id: mediaId, caption, filename };
        break;
      case 'audio':
        payload.audio = { id: mediaId };
        break;
      case 'sticker':
        payload.sticker = { id: mediaId };
        break;
    }

    const result = await this.sendWhatsAppMessage(settings.phoneNumberId, settings.accessToken, payload);

    const messageLog = await this.prisma.whatsapp_message_logs.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        contacts_id: contactId,
        message: caption || filename || type,
        message_type: type,
        is_incoming_message: 0,
        whatsapp_message_id: result.messages?.[0]?.id || '',
        status: 'sent',
        messaged_at: new Date(),
        phone_number_id: settings.phoneNumberId,
        media_url: mediaPath,
      },
    });

    await this.prisma.contacts.update({
      where: { id: contactId },
      data: { last_message_at: new Date() },
    });

    this.wsGateway.emitNewMessage(vendorId, contactId, {
      id: messageLog.id,
      uid: messageLog.uid,
      message: caption || filename || type,
      type,
      isIncoming: false,
      status: 'sent',
      mediaUrl: mediaPath,
      timestamp: new Date(),
    });

    return messageLog;
  }

  // Send template message
  async sendTemplateMessage(
    vendorId: number,
    contactId: number,
    templateName: string,
    languageCode: string,
    components: Record<string, unknown>[],
  ) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const settings = await this.getVendorSettings(vendorId);

    const payload: SendMessagePayload = {
      to: contact.wa_id || '',
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    const result = await this.sendWhatsAppMessage(settings.phoneNumberId, settings.accessToken, payload);

    const messageLog = await this.prisma.whatsapp_message_logs.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        contacts_id: contactId,
        message: `Template: ${templateName}`,
        message_type: 'template',
        is_incoming_message: 0,
        whatsapp_message_id: result.messages?.[0]?.id || '',
        status: 'sent',
        messaged_at: new Date(),
        phone_number_id: settings.phoneNumberId,
      },
    });

    await this.prisma.contacts.update({
      where: { id: contactId },
      data: { last_message_at: new Date() },
    });

    this.wsGateway.emitNewMessage(vendorId, contactId, {
      id: messageLog.id,
      uid: messageLog.uid,
      message: `Template: ${templateName}`,
      type: 'template',
      isIncoming: false,
      status: 'sent',
      timestamp: new Date(),
    });

    return messageLog;
  }

  // Send interactive message (buttons/lists)
  async sendInteractiveMessage(
    vendorId: number,
    contactId: number,
    interactivePayload: Record<string, unknown>,
  ) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const settings = await this.getVendorSettings(vendorId);

    const payload: SendMessagePayload = {
      to: contact.wa_id || '',
      type: 'interactive',
      interactive: interactivePayload,
    };

    const result = await this.sendWhatsAppMessage(settings.phoneNumberId, settings.accessToken, payload);

    const messageLog = await this.prisma.whatsapp_message_logs.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        contacts_id: contactId,
        message: JSON.stringify(interactivePayload),
        message_type: 'interactive',
        is_incoming_message: 0,
        whatsapp_message_id: result.messages?.[0]?.id || '',
        status: 'sent',
        messaged_at: new Date(),
        phone_number_id: settings.phoneNumberId,
      },
    });

    return messageLog;
  }

  // Mark messages as read
  async markAsRead(vendorId: number, contactId: number) {
    const contact = await this.prisma.contacts.findFirst({
      where: { id: contactId, vendors_id: vendorId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const settings = await this.getVendorSettings(vendorId);

    // Get unread messages
    const unreadMessages = await this.prisma.whatsapp_message_logs.findMany({
      where: {
        contacts_id: contactId,
        is_incoming_message: 1,
        status: { not: 'read' },
      },
    });

    for (const msg of unreadMessages) {
      if (msg.whatsapp_message_id) {
        try {
          await axios.post(
            `${this.graphApiUrl}/${settings.phoneNumberId}/messages`,
            {
              messaging_product: 'whatsapp',
              status: 'read',
              message_id: msg.whatsapp_message_id,
            },
            {
              headers: { Authorization: `Bearer ${settings.accessToken}` },
            },
          );
        } catch (error) {
          this.logger.warn(`Failed to mark message as read: ${msg.whatsapp_message_id}`);
        }
      }
    }

    await this.prisma.whatsapp_message_logs.updateMany({
      where: {
        contacts_id: contactId,
        is_incoming_message: 1,
        status: { not: 'read' },
      },
      data: { status: 'read' },
    });

    // Update contact unread count
    await this.prisma.contacts.update({
      where: { id: contactId },
      data: { unread_count: 0 },
    });

    return { success: true };
  }

  // Clear chat history
  async clearChatHistory(vendorId: number, contactId: number) {
    await this.prisma.whatsapp_message_logs.deleteMany({
      where: { contacts_id: contactId, vendors_id: vendorId },
    });
    return { success: true, message: 'Chat history cleared' };
  }

  // Delete a message
  async deleteMessage(vendorId: number, messageId: number) {
    const message = await this.prisma.whatsapp_message_logs.findFirst({
      where: { id: messageId, vendors_id: vendorId },
    });
    if (!message) throw new NotFoundException('Message not found');

    await this.prisma.whatsapp_message_logs.delete({ where: { id: messageId } });
    return { success: true };
  }

  // Forward message
  async forwardMessage(vendorId: number, messageId: number, targetContactId: number) {
    const message = await this.prisma.whatsapp_message_logs.findFirst({
      where: { id: messageId, vendors_id: vendorId },
    });
    if (!message) throw new NotFoundException('Message not found');

    // Send as new message to target contact
    return this.sendTextMessage(vendorId, targetContactId, message.message || '');
  }

  // Search messages
  async searchMessages(vendorId: number, query: string, contactId?: number) {
    const whereClause: Record<string, unknown> = {
      vendors_id: vendorId,
      message: { contains: query },
    };
    if (contactId) {
      whereClause.contacts_id = contactId;
    }

    return this.prisma.whatsapp_message_logs.findMany({
      where: whereClause,
      orderBy: { messaged_at: 'desc' },
      take: 50,
    });
  }

  // Process incoming webhook
  async processWebhook(vendorUid: string, body: Record<string, unknown>) {
    const vendor = await this.prisma.vendors.findFirst({ where: { uid: vendorUid } });
    if (!vendor) {
      this.logger.warn(`Webhook received for unknown vendor: ${vendorUid}`);
      return;
    }

    const entry = (body.entry as Record<string, unknown>[])?.[0];
    if (!entry) return;

    const changes = (entry.changes as Record<string, unknown>[])?.[0];
    if (!changes) return;

    const value = changes.value as Record<string, unknown>;
    if (!value) return;

    // Process messages
    const messages = value.messages as Record<string, unknown>[];
    if (messages && messages.length > 0) {
      for (const message of messages) {
        await this.processIncomingMessage(vendor.id, value, message);
      }
    }

    // Process status updates
    const statuses = value.statuses as Record<string, unknown>[];
    if (statuses && statuses.length > 0) {
      for (const status of statuses) {
        await this.processStatusUpdate(vendor.id, status);
      }
    }

    // Emit webhook event for debugging
    this.wsGateway.emitWebhookEvent(vendor.id, { type: 'webhook', data: body });
  }

  private async processIncomingMessage(
    vendorId: number,
    value: Record<string, unknown>,
    message: Record<string, unknown>,
  ) {
    const contacts = value.contacts as Record<string, unknown>[];
    const contactInfo = contacts?.[0];
    const waId = (contactInfo?.wa_id as string) || (message.from as string);
    const profileName = (contactInfo?.profile as Record<string, unknown>)?.name as string;

    // Find or create contact
    let contact = await this.prisma.contacts.findFirst({
      where: { wa_id: waId, vendors_id: vendorId },
    });

    if (!contact) {
      contact = await this.prisma.contacts.create({
        data: {
          uid: uuidv4(),
          vendors_id: vendorId,
          wa_id: waId,
          first_name: profileName || waId,
          last_name: '',
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      this.wsGateway.emitNewContact(vendorId, { id: contact.id, waId, name: profileName });
    }

    // Extract message content
    const messageType = message.type as string;
    let messageText = '';
    let mediaUrl = '';

    switch (messageType) {
      case 'text':
        messageText = (message.text as Record<string, unknown>)?.body as string || '';
        break;
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
      case 'sticker':
        messageText = (message[messageType] as Record<string, unknown>)?.caption as string || `[${messageType}]`;
        mediaUrl = (message[messageType] as Record<string, unknown>)?.id as string || '';
        break;
      case 'interactive':
        const interactive = message.interactive as Record<string, unknown>;
        const interactiveType = interactive?.type as string;
        if (interactiveType === 'button_reply') {
          messageText = (interactive.button_reply as Record<string, unknown>)?.title as string || '';
        } else if (interactiveType === 'list_reply') {
          messageText = (interactive.list_reply as Record<string, unknown>)?.title as string || '';
        }
        break;
      case 'reaction':
        messageText = `[Reaction: ${(message.reaction as Record<string, unknown>)?.emoji}]`;
        break;
      default:
        messageText = `[${messageType}]`;
    }

    // Save message
    const messageLog = await this.prisma.whatsapp_message_logs.create({
      data: {
        uid: uuidv4(),
        vendors_id: vendorId,
        contacts_id: contact.id,
        message: messageText,
        message_type: messageType,
        is_incoming_message: 1,
        whatsapp_message_id: message.id as string || '',
        status: 'received',
        messaged_at: new Date(parseInt(message.timestamp as string || '0') * 1000),
        media_url: mediaUrl || null,
      },
    });

    // Update contact
    await this.prisma.contacts.update({
      where: { id: contact.id },
      data: {
        last_message_at: new Date(),
        unread_count: { increment: 1 },
      },
    });

    // Emit real-time event
    this.wsGateway.emitNewMessage(vendorId, contact.id, {
      id: messageLog.id,
      uid: messageLog.uid,
      contactId: contact.id,
      message: messageText,
      type: messageType,
      isIncoming: true,
      status: 'received',
      mediaUrl,
      timestamp: messageLog.messaged_at,
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        waId: contact.wa_id,
      },
    });

    // Trigger bot reply
    await this.messageQueue.add('process-bot-reply', {
      vendorId,
      contactId: contact.id,
      messageText,
      messageType,
    });

    return messageLog;
  }

  private async processStatusUpdate(vendorId: number, status: Record<string, unknown>) {
    const messageId = status.id as string;
    const statusValue = status.status as string;

    if (!messageId) return;

    const message = await this.prisma.whatsapp_message_logs.findFirst({
      where: { whatsapp_message_id: messageId, vendors_id: vendorId },
    });

    if (message) {
      await this.prisma.whatsapp_message_logs.update({
        where: { id: message.id },
        data: { status: statusValue },
      });

      this.wsGateway.emitMessageStatus(vendorId, message.contacts_id || 0, {
        messageId: message.id,
        whatsappMessageId: messageId,
        status: statusValue,
        contactId: message.contacts_id,
      });
    }
  }

  // Upload media to WhatsApp
  private async uploadMedia(phoneNumberId: string, accessToken: string, filePath: string): Promise<string> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('messaging_product', 'whatsapp');

    const response = await axios.post(
      `${this.graphApiUrl}/${phoneNumberId}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...form.getHeaders(),
        },
      },
    );

    return response.data.id;
  }

  // Send WhatsApp message via Graph API
  private async sendWhatsAppMessage(phoneNumberId: string, accessToken: string, payload: SendMessagePayload) {
    try {
      const response = await axios.post(
        `${this.graphApiUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          ...payload,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: unknown }; message?: string };
      this.logger.error(`WhatsApp API error: ${JSON.stringify(axiosError.response?.data || axiosError.message)}`);
      throw new BadRequestException('Failed to send WhatsApp message');
    }
  }

  // WhatsApp Business Profile
  async getBusinessProfile(vendorId: number) {
    const settings = await this.getVendorSettings(vendorId);
    try {
      const response = await axios.get(
        `${this.graphApiUrl}/${settings.phoneNumberId}/whatsapp_business_profile`,
        {
          headers: { Authorization: `Bearer ${settings.accessToken}` },
          params: { fields: 'about,address,description,email,profile_picture_url,websites,vertical' },
        },
      );
      return response.data;
    } catch {
      throw new BadRequestException('Failed to fetch business profile');
    }
  }

  async updateBusinessProfile(vendorId: number, data: Record<string, unknown>) {
    const settings = await this.getVendorSettings(vendorId);
    try {
      const response = await axios.post(
        `${this.graphApiUrl}/${settings.phoneNumberId}/whatsapp_business_profile`,
        { messaging_product: 'whatsapp', ...data },
        { headers: { Authorization: `Bearer ${settings.accessToken}` } },
      );
      return response.data;
    } catch {
      throw new BadRequestException('Failed to update business profile');
    }
  }

  // Embedded signup
  async processEmbeddedSignup(vendorId: number, data: Record<string, unknown>) {
    const { accessToken, phoneNumberId, businessAccountId, wabaId } = data as Record<string, string>;

    // Save vendor settings
    const settingsToSave = [
      { name: 'whatsapp_access_token', value: accessToken },
      { name: 'current_phone_number_id', value: phoneNumberId },
      { name: 'whatsapp_business_account_id', value: businessAccountId || wabaId },
    ];

    for (const setting of settingsToSave) {
      await this.prisma.vendor_settings.upsert({
        where: {
          vendors__id_name: { vendors_id: vendorId, name: setting.name },
        },
        update: { value: setting.value },
        create: {
          uid: uuidv4(),
          vendors_id: vendorId,
          name: setting.name,
          value: setting.value,
        },
      });
    }

    return { success: true, message: 'WhatsApp connected successfully' };
  }

  // Disconnect WhatsApp account
  async disconnectAccount(vendorId: number) {
    const settingsToRemove = [
      'whatsapp_access_token',
      'current_phone_number_id',
      'whatsapp_business_account_id',
      'whatsapp_phone_numbers_data',
    ];

    await this.prisma.vendor_settings.deleteMany({
      where: { vendors_id: vendorId, name: { in: settingsToRemove } },
    });

    return { success: true, message: 'WhatsApp account disconnected' };
  }

  // Message analytics
  async getMessageAnalytics(vendorId: number, startDate: Date, endDate: Date) {
    const messages = await this.prisma.whatsapp_message_logs.groupBy({
      by: ['status', 'is_incoming_message'],
      where: {
        vendors_id: vendorId,
        messaged_at: { gte: startDate, lte: endDate },
      },
      _count: true,
    });

    return messages;
  }
}
