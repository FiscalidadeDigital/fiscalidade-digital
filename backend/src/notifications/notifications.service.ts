import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createNotification(
    tenantId: string,
    title: string,
    message: string,
  ) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        title,
        message,
        isRead: false,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.notification.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notificação não encontrada',
      );
    }

    return notification;
  }

  async markAsRead(tenantId: string, id: string) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notificação não encontrada',
      );
    }

    return this.prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(
    tenantId: string,
  ) {
    return this.prisma.notification.updateMany({
      where: {
        tenantId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notificação não encontrada',
      );
    }

    return this.prisma.notification.delete({
      where: {
        id: notification.id,
      },
    });
  }
}
