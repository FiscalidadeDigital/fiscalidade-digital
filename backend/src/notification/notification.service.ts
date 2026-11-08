import { Injectable, NotFoundException, Optional } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { FiscalObligationEligibilityService } from '../fiscal-obligation-eligibility/fiscal-obligation-eligibility.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly eligibility: FiscalObligationEligibilityService = new FiscalObligationEligibilityService(
      prisma,
    ),
  ) {}

  // =====================================================
  // LISTAR NOTIFICAÇÕES DA EMPRESA
  // =====================================================

  async findAll(tenantId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        tenantId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        notificationType: true,
      },
    });

    return this.filterIneligibleFiscalNotifications(tenantId, notifications);
  }

  // =====================================================
  // LISTAR NÃO LIDAS
  // =====================================================

  async findUnread(tenantId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        tenantId,
        isRead: false,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        notificationType: true,
      },
    });

    return this.filterIneligibleFiscalNotifications(tenantId, notifications);
  }

  // =====================================================
  // CONTAR NÃO LIDAS
  // =====================================================

  async countUnread(tenantId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        tenantId,
        isRead: false,
      },
      select: { id: true },
    });

    return {
      count: (
        await this.filterIneligibleFiscalNotifications(tenantId, notifications)
      ).length,
    };
  }

  // =====================================================
  // OBTER UMA NOTIFICAÇÃO
  // =====================================================

  async findOne(tenantId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId,
      },

      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        notificationType: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    const [visibleNotification] =
      await this.filterIneligibleFiscalNotifications(tenantId, [notification]);
    if (!visibleNotification) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    return visibleNotification;
  }

  // =====================================================
  // MARCAR COMO LIDA
  // =====================================================

  async markAsRead(tenantId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    return this.prisma.notification.update({
      where: {
        id: notification.id,
      },

      data: {
        isRead: true,
      },

      select: {
        id: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true,
        notificationType: true,
      },
    });
  }

  // =====================================================
  // MARCAR TODAS COMO LIDAS
  // =====================================================

  async markAllAsRead(tenantId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId,
        isRead: false,
      },

      data: {
        isRead: true,
      },
    });

    return {
      success: true,
      updated: result.count,
    };
  }

  // =====================================================
  // CRIAR NOTIFICAÇÃO
  //
  // Usado pelo AlertsService e outros módulos.
  // =====================================================

  async create(
    tenantId: string,
    title: string,
    message: string,
    notificationType: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO',
  ) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        title: title.trim(),
        message: message.trim(),
        notificationType,
        isRead: false,
      },
    });
  }

  private async filterIneligibleFiscalNotifications<T extends { id: string }>(
    tenantId: string,
    notifications: T[],
  ): Promise<T[]> {
    if (notifications.length === 0) return notifications;

    const alerts = await this.prisma.fiscalAlert.findMany({
      where: {
        tenantId,
        notificationId: {
          in: notifications.map((notification) => notification.id),
        },
      },
      include: {
        obligation: {
          include: { fiscalCalendar: true },
        },
      },
    });
    if (alerts.length === 0) return notifications;

    const eligibleObligationIds = new Set(
      (
        await this.eligibility.filterEligible(
          tenantId,
          alerts.map((alert) => alert.obligation),
        )
      ).map((obligation) => obligation.id),
    );
    const hiddenNotificationIds = new Set(
      alerts
        .filter((alert) => !eligibleObligationIds.has(alert.obligationId))
        .map((alert) => alert.notificationId),
    );

    return notifications.filter(
      (notification) => !hiddenNotificationIds.has(notification.id),
    );
  }
}
