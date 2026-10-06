import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.notificationsService.findAll(
      req.user.tenantId,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.findOne(
      req.user.tenantId,
      id,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(
      req.user.tenantId,
      id,
    );
  }

  @Patch('read/all')
  markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(
      req.user.tenantId,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(
      req.user.tenantId,
      id,
    );
  }
}
