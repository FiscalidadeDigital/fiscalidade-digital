import {
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
  ) {}

  @Post('check')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async checkAlerts(@Req() req: any) {
    return this.alertsService.runManualCheck(
      req.user.tenantId,
    );
  }
}
