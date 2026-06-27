import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId } from '../../common/decorators';
import { BlogService } from './blog.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('blog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('blog')
export class BlogController {
  constructor(private service: BlogService) {}
}
