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

  async create(data: {
    tenantId: string;
    month: number;
    year: number;
    amount: number;
    notes?: string;
  }) {
    return this.prisma.revenue.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.revenue.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const revenue =
      await this.prisma.revenue.findUnique({
        where: { id },
      });

    if (!revenue) {
      throw new NotFoundException(
        'Receita não encontrada',
      );
    }

    return revenue;
  }

  async update(
    id: string,
    data: {
      month?: number;
      year?: number;
      amount?: number;
      notes?: string;
    },
  ) {
    return this.prisma.revenue.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.revenue.delete({
      where: { id },
    });
  }

  async dashboardRevenue() {
    const revenues =
      await this.prisma.revenue.findMany();

    const totalRevenue =
      revenues.reduce(
        (sum, item) => sum + item.amount,
        0,
      );

    return {
      totalRevenue,
      totalRecords: revenues.length,
    };
  }
}