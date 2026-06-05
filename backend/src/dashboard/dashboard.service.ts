import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard(
    tenantId: string,
  ) {
    const [
      invoices,
      pendingInvoices,
      obligations,
      clients,
      products,
      revenue,
    ] = await Promise.all([
      this.prisma.invoice.count({
        where: {
          tenantId,
        },
      }),

      this.prisma.invoice.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }),

      this.prisma.fiscalObligation.count({
        where: {
          tenantId,
          status: 'PENDING',
        },
      }),

      this.prisma.client.count({
        where: {
          tenantId,
        },
      }),

      this.prisma.product.count({
        where: {
          tenantId,
        },
      }),

      this.prisma.invoice.aggregate({
        where: {
          tenantId,
          status: 'PAID',
        },

        _sum: {
          total: true,
        },
      }),
    ]);

    const recentInvoices =
      await this.prisma.invoice.findMany({
        where: {
          tenantId,
        },

        orderBy: {
          createdAt: 'desc',
        },

        take: 10,
      });

    return {
      metrics: {
        totalRevenue:
          revenue._sum.total || 0,

        pendingObligations:
          obligations,

        invoices,

        pendingInvoices,

        clients,

        products,

        iva: 0,

        totalTaxes: 0,

        fiscalScore: 95,

        healthScore: 90,
      },

      recentInvoices,

      monthlyRevenue: [],

      chartData: [],
    };
  }
}