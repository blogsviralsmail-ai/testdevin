import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { TranslationService } from './translation.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('translation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translation')
export class TranslationController {
  constructor(private service: TranslationService) {}
}
