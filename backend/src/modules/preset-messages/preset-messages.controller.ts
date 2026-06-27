import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { PresetMessagesService } from './preset-messages.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('preset-messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preset-messages')
export class PresetMessagesController {
  constructor(private service: PresetMessagesService) {}
}
