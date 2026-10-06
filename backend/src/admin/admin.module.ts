import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuditController } from './admin-audit.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminPlatformService } from './admin-platform.service';
import { AdminTenantsController } from './admin-tenants.controller';
import { PlatformAdminAuthGuard } from './guards/platform-admin-auth.guard';
import { PlatformAdminReadyGuard } from './guards/platform-admin-ready.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminTenantsController,
    AdminAuditController,
  ],
  providers: [
    AdminAuthService,
    AdminDashboardService,
    AdminPlatformService,
    PlatformAdminAuthGuard,
    PlatformAdminReadyGuard,
  ],
})
export class AdminModule {}
