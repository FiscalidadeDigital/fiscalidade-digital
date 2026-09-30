import { Controller, Get, UseGuards } from '@nestjs/common';

import { AdminDashboardService } from './admin-dashboard.service';
import { PlatformAdminAuthGuard } from './guards/platform-admin-auth.guard';
import { PlatformAdminReadyGuard } from './guards/platform-admin-ready.guard';

@Controller('admin/dashboard')
@UseGuards(PlatformAdminAuthGuard, PlatformAdminReadyGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
