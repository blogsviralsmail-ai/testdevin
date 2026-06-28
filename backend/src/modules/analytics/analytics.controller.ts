import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('overview')
  async getOverview(@CurrentUser() user: { role: number; vendorId: number | null }) {
    const vendorId = user.role === 1 ? null : user.vendorId;
    return this.service.getOverview(vendorId);
  }

  @Get('messages')
  async getMessageStats(@CurrentUser() user: { role: number; vendorId: number | null }, @Query('days') days?: string) {
    const vendorId = user.role === 1 ? null : user.vendorId;
    return this.service.getMessageStats(vendorId, days ? parseInt(days) : 30);
  }
}
