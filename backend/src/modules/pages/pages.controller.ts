import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { PagesService } from './pages.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('pages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('pages')
export class PagesController {
  constructor(private service: PagesService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('search') search?: string) {
    return this.service.getPages(page ? parseInt(page) : 1, 20, search);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) { return this.service.getPage(parseInt(id)); }

  @Post()
  async create(@Body() body: { title: string; slug?: string; content?: string; meta_title?: string; meta_description?: string }) {
    return this.service.createPage(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.updatePage(parseInt(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) { return this.service.deletePage(parseInt(id)); }
}
