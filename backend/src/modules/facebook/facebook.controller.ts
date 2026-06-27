import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { FacebookService } from './facebook.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('facebook')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('facebook')
export class FacebookController {
  constructor(private service: FacebookService) {}
}
