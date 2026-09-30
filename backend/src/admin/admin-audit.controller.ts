import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { AdminPlatformService } from './admin-platform.service';
import { AdminAuditQueryDto } from './dto/admin-audit-query.dto';
import { PlatformAdminAuthGuard } from './guards/platform-admin-auth.guard';
import { PlatformAdminReadyGuard } from './guards/platform-admin-ready.guard';

@Controller('admin/audit')
@UseGuards(PlatformAdminAuthGuard, PlatformAdminReadyGuard)
export class AdminAuditController {
  constructor(private readonly platformService: AdminPlatformService) {}

  @Get()
  list(@Query() query: AdminAuditQueryDto) {
    return this.platformService.listAuditEvents(query);
  }
}
