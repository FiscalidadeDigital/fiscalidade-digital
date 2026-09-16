import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  // =====================================================
  // TODAS AS NOTIFICAÇÕES
  // =====================================================

  @Get()
  async findAll(
    @Req() req: any,
  ) {
    return this.notificationService.findAll(
      req.user.tenantId,
    );
  }

  // =====================================================
  // NÃO LIDAS
  // =====================================================

  @Get('unread')
  async findUnread(
    @Req() req: any,
  ) {
    return this.notificationService.findUnread(
      req.user.tenantId,
    );
  }

  // =====================================================
  // CONTADOR DE NÃO LIDAS
  // =====================================================

  @Get('unread/count')
  async countUnread(
    @Req() req: any,
  ) {
    return this.notificationService.countUnread(
      req.user.tenantId,
    );
  }

  // =====================================================
  // UMA NOTIFICAÇÃO
  // =====================================================

  @Get(':id')
  async findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationService.findOne(
      req.user.tenantId,
      id,
    );
  }

  // =====================================================
  // MARCAR UMA COMO LIDA
  // =====================================================

  @Patch(':id/read')
  async markAsRead(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(
      req.user.tenantId,
      id,
    );
  }

  // =====================================================
  // MARCAR TODAS COMO LIDAS
  // =====================================================

  @Patch('read-all')
  async markAllAsRead(
    @Req() req: any,
  ) {
    return this.notificationService.markAllAsRead(
      req.user.tenantId,
    );
  }
}