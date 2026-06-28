import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { BlogService } from './blog.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('blog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('blog')
export class BlogController {
  constructor(private service: BlogService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('search') search?: string) {
    return this.service.getArticles(page ? parseInt(page) : 1, 20, search);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) { return this.service.getArticle(parseInt(id)); }

  @Post()
  async create(@Body() body: { title: string; slug?: string; content?: string; category?: string }) {
    return this.service.createArticle(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateArticle(parseInt(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) { return this.service.deleteArticle(parseInt(id)); }
}
