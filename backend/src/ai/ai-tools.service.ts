import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiToolsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getCompanyData(
    tenantId: string,
  ) {
    const [
      company,
      clients,
      products,
      invoices,
      pendingInvoices,
      obligations,
      revenue,
    ] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
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

    return {
      company,
      clients,
      products,
      invoices,
      pendingInvoices,
      obligations,
      revenue:
        revenue._sum.total || 0,
    };
  }
}