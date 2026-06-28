import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { LiveChatService } from './live-chat.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('live-chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('live-chat')
export class LiveChatController {
  constructor(private service: LiveChatService) {}
}
