import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorId, CurrentUser } from '../../common/decorators';
import { DashboardService } from './dashboard.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  async getDashboard(
    @CurrentUser() user: { role: number; vendorId: number },
  ) {
    if (user.role === 1) {
      return this.dashboardService.getSuperAdminDashboard();
    }
    return this.dashboardService.getVendorDashboard(user.vendorId);
  }

  @Get('chart')
  async getChartData(
    @VendorId() vendorId: number,
    @Query('period') period: string,
  ) {
    return this.dashboardService.getMessageChartData(vendorId, period || 'weekly');
  }
}
