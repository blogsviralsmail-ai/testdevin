import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { MarketingService } from './marketing.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private service: MarketingService) {}
}
