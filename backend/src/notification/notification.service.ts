import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // LISTAR NOTIFICAÇÕES DA EMPRESA
  // =====================================================

  async findAll(
    tenantId: string,
  ) {
    return this.prisma.notification.findMany({
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
  }

  // =====================================================
  // LISTAR NÃO LIDAS
  // =====================================================

  async findUnread(
    tenantId: string,
  ) {
    return this.prisma.notification.findMany({
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
  }

  // =====================================================
  // CONTAR NÃO LIDAS
  // =====================================================

  async countUnread(
    tenantId: string,
  ) {
    const count =
      await this.prisma.notification.count({
        where: {
          tenantId,
          isRead: false,
        },
      });

    return {
      count,
    };
  }

  // =====================================================
  // OBTER UMA NOTIFICAÇÃO
  // =====================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
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
      throw new NotFoundException(
        'Notificação não encontrada.',
      );
    }

    return notification;
  }

  // =====================================================
  // MARCAR COMO LIDA
  // =====================================================

  async markAsRead(
    tenantId: string,
    id: string,
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notificação não encontrada.',
      );
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

  async markAllAsRead(
    tenantId: string,
  ) {
    const result =
      await this.prisma.notification.updateMany({
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
    notificationType:
      | 'INFO'
      | 'WARNING'
      | 'SUCCESS'
      | 'ERROR' = 'INFO',
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
}