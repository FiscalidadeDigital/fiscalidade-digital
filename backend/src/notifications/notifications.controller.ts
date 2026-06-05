import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  private readonly tenantId =
    'd666e572-6320-4bb3-aaea-646d77afdf1c';

  @Get()
  findAll() {
    return this.notificationsService.findAll(
      this.tenantId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.notificationsService.findOne(
      id,
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(
      id,
    );
  }

  @Patch('read/all')
  markAllAsRead() {
    return this.notificationsService.markAllAsRead(
      this.tenantId,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(
      id,
    );
  }
}