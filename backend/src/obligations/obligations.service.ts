import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateObligationDto } from './dto/create-obligation.dto';

@Injectable()
export class ObligationsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateObligationDto,
    tenantId: string,
  ) {
    const obligation =
      await this.prisma.fiscalObligation.create({
        data: {
          tenantId,
          title: dto.title,
          type: dto.type as any,
          description: dto.description,
          amount: dto.amount,
          dueDate: new Date(dto.dueDate),
        },
      });

    // Criar notificação automática
    await this.prisma.notification.create({
      data: {
        tenantId,
        title: 'Nova obrigação fiscal',
        message: `${dto.title} foi registada com sucesso`,
        isRead: false,
      },
    });

    return obligation;
  }

  async findAll() {
    return this.prisma.fiscalObligation.findMany({
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async getDashboard() {
    const obligations =
      await this.prisma.fiscalObligation.findMany();

    return {
      total: obligations.length,

      pending: obligations.filter(
        (o) => o.status === 'PENDING',
      ).length,

      paid: obligations.filter(
        (o) => o.status === 'PAID',
      ).length,

      late: obligations.filter(
        (o) => o.status === 'LATE',
      ).length,
    };
  }

  async findOne(id: string) {
    const obligation =
      await this.prisma.fiscalObligation.findUnique({
        where: {
          id,
        },
      });

    if (!obligation) {
      throw new NotFoundException(
        'Obrigação fiscal não encontrada',
      );
    }

    return obligation;
  }

  async markAsPaid(id: string) {
    const obligation =
      await this.prisma.fiscalObligation.findUnique({
        where: {
          id,
        },
      });

    if (!obligation) {
      throw new NotFoundException(
        'Obrigação fiscal não encontrada',
      );
    }

    const updated =
      await this.prisma.fiscalObligation.update({
        where: {
          id,
        },
        data: {
          status: 'PAID',
        },
      });

    await this.prisma.notification.create({
      data: {
        tenantId: updated.tenantId,
        title: 'Obrigação liquidada',
        message: `${updated.title} foi marcada como paga`,
        isRead: false,
      },
    });

    return updated;
  }

  async remove(id: string) {
    const obligation =
      await this.prisma.fiscalObligation.findUnique({
        where: {
          id,
        },
      });

    if (!obligation) {
      throw new NotFoundException(
        'Obrigação fiscal não encontrada',
      );
    }

    return this.prisma.fiscalObligation.delete({
      where: {
        id,
      },
    });
  }
}