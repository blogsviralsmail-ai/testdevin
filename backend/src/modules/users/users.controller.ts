import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { UsersService } from './users.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getAll(@Query('page') page?: string, @Query('search') search?: string) {
    return this.usersService.getUsers(page ? parseInt(page) : 1, 20, search);
  }

  @Post()
  async create(@Body() body: { email: string; password: string; firstName: string; lastName: string; roleId: number; vendorId?: number }) {
    return this.usersService.createUser(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.usersService.updateUser(parseInt(id), body); }

  @Delete(':id')
  async delete(@Param('id') id: string) { return this.usersService.deleteUser(parseInt(id)); }

  @Get('login-logs')
  async getLoginLogs(@Query('userId') userId?: string, @Query('page') page?: string) {
    return this.usersService.getLoginLogs(userId ? parseInt(userId) : undefined, page ? parseInt(page) : 1);
  }
}
