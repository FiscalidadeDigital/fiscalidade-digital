import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RevenueService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =====================================================
  // CRIAR RECEITA
  // =====================================================

  async create(
    tenantId: string,
    data: {
      month: number;
      year: number;
      amount: number;
      notes?: string;
    },
  ) {
    return this.prisma.revenue.create({
      data: {
        tenantId,
        month: data.month,
        year: data.year,
        amount: data.amount,
        notes: data.notes,
      },
    });
  }

  // =====================================================
  // LISTAR RECEITAS
  // =====================================================

  async findAll(tenantId: string) {
    return this.prisma.revenue.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =====================================================
  // CONSULTAR RECEITA
  // =====================================================

  async findOne(
    id: string,
    tenantId: string,
  ) {
    const revenue =
      await this.prisma.revenue.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!revenue) {
      throw new NotFoundException(
        'Receita não encontrada.',
      );
    }

    return revenue;
  }

  // =====================================================
  // ATUALIZAR RECEITA
  // =====================================================

  async update(
    id: string,
    tenantId: string,
    data: {
      month?: number;
      year?: number;
      amount?: number;
      notes?: string;
    },
  ) {
    const revenue =
      await this.prisma.revenue.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!revenue) {
      throw new NotFoundException(
        'Receita não encontrada.',
      );
    }

    return this.prisma.revenue.update({
      where: {
        id,
      },
      data: {
        ...(data.month !== undefined && {
          month: data.month,
        }),

        ...(data.year !== undefined && {
          year: data.year,
        }),

        ...(data.amount !== undefined && {
          amount: data.amount,
        }),

        ...(data.notes !== undefined && {
          notes: data.notes,
        }),
      },
    });
  }

  // =====================================================
  // ELIMINAR RECEITA
  // =====================================================

  async remove(
    id: string,
    tenantId: string,
  ) {
    const revenue =
      await this.prisma.revenue.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!revenue) {
      throw new NotFoundException(
        'Receita não encontrada.',
      );
    }

    return this.prisma.revenue.delete({
      where: {
        id,
      },
    });
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  async dashboardRevenue(
    tenantId: string,
  ) {
    const revenues =
      await this.prisma.revenue.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    const totalRevenue =
      revenues.reduce(
        (sum, item) =>
          sum + Number(item.amount),
        0,
      );

    return {
      totalRevenue,
      totalRecords: revenues.length,
    };
  }
}