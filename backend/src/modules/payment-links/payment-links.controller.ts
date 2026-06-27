import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { PaymentLinksService } from './payment-links.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('payment-links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment-links')
export class PaymentLinksController {
  constructor(private service: PaymentLinksService) {}
}
