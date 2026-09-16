import {
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
  ) {}

  @Post('check')
  async checkAlerts() {
    return this.alertsService.runManualCheck();
  }
}