import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { InstagramService } from './instagram.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('instagram')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('instagram')
export class InstagramController {
  constructor(private service: InstagramService) {}
}
