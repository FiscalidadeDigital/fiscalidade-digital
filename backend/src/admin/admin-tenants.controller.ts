import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminPlatformService } from './admin-platform.service';
import { AdminTenantQueryDto } from './dto/admin-tenant-query.dto';
import { UpdateAdminTenantStatusDto } from './dto/update-admin-tenant-status.dto';
import {
  PlatformAdminAuthGuard,
  PlatformAdminRequest,
} from './guards/platform-admin-auth.guard';
import { PlatformAdminReadyGuard } from './guards/platform-admin-ready.guard';

@Controller('admin/tenants')
@UseGuards(PlatformAdminAuthGuard, PlatformAdminReadyGuard)
export class AdminTenantsController {
  constructor(private readonly platformService: AdminPlatformService) {}

  @Get()
  list(@Query() query: AdminTenantQueryDto) {
    return this.platformService.listTenants(query);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) tenantId: string,
    @Body() dto: UpdateAdminTenantStatusDto,
    @Req() request: PlatformAdminRequest,
  ) {
    return this.platformService.updateTenantStatus(tenantId, dto, {
      adminId: request.platformAdmin!.id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }
}
