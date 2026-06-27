import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { VendorId } from '../../common/decorators';
import { WhatsappService } from './whatsapp.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@ApiTags('WhatsApp Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VendorGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('chat')
  async getChatData(
    @VendorId() vendorId: number,
    @Query('contact') contactUid?: string,
    @Query('assigned') assigned?: string,
  ) {
    return this.whatsappService.getChatData(vendorId, contactUid, assigned);
  }

  @Get('contacts')
  async getContacts(
    @VendorId() vendorId: number,
    @Query('search') search?: string,
    @Query('labelId') labelId?: string,
  ) {
    return this.whatsappService.getContactsForChat(vendorId, search, labelId ? parseInt(labelId) : undefined);
  }

  @Get('messages/:contactId')
  async getMessages(
    @VendorId() vendorId: number,
    @Param('contactId') contactId: string,
    @Query('before') before?: string,
  ) {
    return this.whatsappService.getContactMessages(parseInt(contactId), 50, before ? parseInt(before) : undefined);
  }

  @Post('send/text')
  async sendTextMessage(
    @VendorId() vendorId: number,
    @Body() body: { contactId: number; message: string; replyToMessageId?: string },
  ) {
    return this.whatsappService.sendTextMessage(vendorId, body.contactId, body.message, body.replyToMessageId);
  }

  @Post('send/media')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './storage/app/public/media',
      filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
  }))
  async sendMediaMessage(
    @VendorId() vendorId: number,
    @Body() body: { contactId: string; type: 'image' | 'video' | 'document' | 'audio' | 'sticker'; caption?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.whatsappService.sendMediaMessage(
      vendorId,
      parseInt(body.contactId),
      body.type,
      file.path,
      body.caption,
      file.originalname,
    );
  }

  @Post('send/template')
  async sendTemplateMessage(
    @VendorId() vendorId: number,
    @Body() body: {
      contactId: number;
      templateName: string;
      languageCode: string;
      components: Record<string, unknown>[];
    },
  ) {
    return this.whatsappService.sendTemplateMessage(
      vendorId,
      body.contactId,
      body.templateName,
      body.languageCode,
      body.components,
    );
  }

  @Post('send/interactive')
  async sendInteractiveMessage(
    @VendorId() vendorId: number,
    @Body() body: { contactId: number; interactive: Record<string, unknown> },
  ) {
    return this.whatsappService.sendInteractiveMessage(vendorId, body.contactId, body.interactive);
  }

  @Post('mark-read/:contactId')
  async markAsRead(
    @VendorId() vendorId: number,
    @Param('contactId') contactId: string,
  ) {
    return this.whatsappService.markAsRead(vendorId, parseInt(contactId));
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @VendorId() vendorId: number,
    @Param('messageId') messageId: string,
  ) {
    return this.whatsappService.deleteMessage(vendorId, parseInt(messageId));
  }

  @Post('forward')
  async forwardMessage(
    @VendorId() vendorId: number,
    @Body() body: { messageId: number; targetContactId: number },
  ) {
    return this.whatsappService.forwardMessage(vendorId, body.messageId, body.targetContactId);
  }

  @Get('search')
  async searchMessages(
    @VendorId() vendorId: number,
    @Query('q') query: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.whatsappService.searchMessages(vendorId, query, contactId ? parseInt(contactId) : undefined);
  }

  @Delete('chat/:contactId')
  async clearChat(
    @VendorId() vendorId: number,
    @Param('contactId') contactId: string,
  ) {
    return this.whatsappService.clearChatHistory(vendorId, parseInt(contactId));
  }

  @Get('business-profile')
  async getBusinessProfile(@VendorId() vendorId: number) {
    return this.whatsappService.getBusinessProfile(vendorId);
  }

  @Post('business-profile')
  async updateBusinessProfile(
    @VendorId() vendorId: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.whatsappService.updateBusinessProfile(vendorId, body);
  }

  @Post('embedded-signup')
  async embeddedSignup(
    @VendorId() vendorId: number,
    @Body() body: Record<string, unknown>,
  ) {
    return this.whatsappService.processEmbeddedSignup(vendorId, body);
  }

  @Post('disconnect')
  async disconnectAccount(@VendorId() vendorId: number) {
    return this.whatsappService.disconnectAccount(vendorId);
  }

  @Get('analytics')
  async getAnalytics(
    @VendorId() vendorId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.whatsappService.getMessageAnalytics(vendorId, new Date(startDate), new Date(endDate));
  }
}
