import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { PagesService } from './pages.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pages')
export class PagesController {
  constructor(private service: PagesService) {}
}
