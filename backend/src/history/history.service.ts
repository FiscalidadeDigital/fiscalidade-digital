import {
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll(
    tenantId: string,
  ) {
    const [
      invoices,
      purchases,
      revenues,
      taxTransactions,
      taxAssessments,
      obligations,
      declarations,
      payments,
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          issuedAt: 'desc',
        },
      }),

      this.prisma.purchaseInvoice.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          issuedAt: 'desc',
        },
      }),

      this.prisma.revenue.findMany({
        where: {
          tenantId,
        },
        orderBy: [
          {
            year: 'desc',
          },
          {
            month: 'desc',
          },
        ],
      }),

      this.prisma.taxTransaction.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          referenceDate: 'desc',
        },
      }),

      this.prisma.taxAssessment.findMany({
        where: {
          tenantId,
        },
        orderBy: [
          {
            year: 'desc',
          },
          {
            period: 'desc',
          },
        ],
      }),

      this.prisma.fiscalObligation.findMany({
        where: {
          tenantId,
        },
        include: {
          fiscalCalendar: true,
        },
        orderBy: {
          dueDate: 'desc',
        },
      }),

      this.prisma.taxDeclaration.findMany({
        where: {
          tenantId,
        },
        include: {
          payments: true,
        },
        orderBy: {
          declarationDate: 'desc',
        },
      }),

      this.prisma.taxPayment.findMany({
        where: {
          tenantId,
        },
        orderBy: {
          paidAt: 'desc',
        },
      }),
    ]);

    const history = [
      ...invoices.map(
        (invoice) => ({
          id: invoice.id,
          type: 'SALE',
          category: 'INVOICE',
          date: invoice.issuedAt,
          reference: invoice.invoiceNumber,
          description:
            `Factura emitida ${invoice.invoiceNumber}`,
          amount: Number(
            invoice.total,
          ),
          taxAmount: Number(
            invoice.iva,
          ),
          withholdingAmount:
            Number(
              invoice.withholdingTax,
            ),
          status:
            invoice.status,
          sourceId:
            invoice.id,
        }),
      ),

      ...purchases.map(
        (purchase) => ({
          id: purchase.id,
          type: 'PURCHASE',
          category:
            'PURCHASE_INVOICE',
          date: purchase.issuedAt,
          reference:
            purchase.invoiceNumber,
          description:
            `Factura de compra ${purchase.invoiceNumber}`,
          amount: Number(
            purchase.total,
          ),
          taxAmount: Number(
            purchase.iva,
          ),
          withholdingAmount:
            Number(
              purchase.withholdingTax,
            ),
          status:
            purchase.status,
          sourceId:
            purchase.id,
        }),
      ),

      ...revenues.map(
        (revenue) => ({
          id: revenue.id,
          type: 'REVENUE',
          category: 'REVENUE',
          date: new Date(
            revenue.year,
            revenue.month - 1,
            1,
          ),
          reference:
            `${revenue.year}-${String(
              revenue.month,
            ).padStart(2, '0')}`,
          description:
            revenue.notes ??
            'Receita registada',
          amount:
            Number(
              revenue.amount,
            ),
          taxAmount: 0,
          withholdingAmount: 0,
          status: 'RECORDED',
          sourceId:
            revenue.id,
        }),
      ),

      ...taxTransactions.map(
        (transaction) => ({
          id: transaction.id,
          type: 'TAX',
          category:
            'TAX_TRANSACTION',
          date:
            transaction.referenceDate,
          reference:
            transaction.period,
          description:
            transaction.description ??
            `${transaction.taxType} - ${transaction.operation}`,
          amount:
            Number(
              transaction.taxAmount,
            ),
          taxAmount:
            Number(
              transaction.taxAmount,
            ),
          withholdingAmount:
            Number(
              transaction.withheldAmount,
            ),
          status:
            'CALCULATED',
          sourceId:
            transaction.sourceId,
          taxType:
            transaction.taxType,
          operation:
            transaction.operation,
        }),
      ),

      ...taxAssessments.map(
        (assessment) => ({
          id: assessment.id,
          type: 'TAX_ASSESSMENT',
          category:
            'TAX_ASSESSMENT',
          date:
            assessment.calculatedAt,
          reference:
            assessment.period,
          description:
            `Apuramento ${assessment.taxType} ${assessment.period}`,
          amount:
            Number(
              assessment.finalAmount,
            ),
          taxAmount:
            Number(
              assessment.taxDueAmount,
            ),
          withholdingAmount:
            Number(
              assessment.withheldAmount,
            ),
          status:
            assessment.status,
          sourceId:
            assessment.id,
          taxType:
            assessment.taxType,
        }),
      ),

      ...obligations.map(
        (obligation) => ({
          id: obligation.id,
          type: 'OBLIGATION',
          category:
            'FISCAL_OBLIGATION',
          date:
            obligation.dueDate,
          reference:
            obligation.period ??
            obligation.id,
          description:
            obligation.title,
          amount:
            Number(
              obligation.amount ?? 0,
            ),
          taxAmount: 0,
          withholdingAmount: 0,
          status:
            obligation.status,
          sourceId:
            obligation.id,
          taxType:
            obligation.fiscalCalendar
              ?.taxType ?? null,
        }),
      ),

      ...declarations.map(
        (declaration) => ({
          id: declaration.id,
          type: 'DECLARATION',
          category:
            'TAX_DECLARATION',
          date:
            declaration.declarationDate,
          reference:
            declaration.period,
          description:
            `Declaração ${declaration.taxType} ${declaration.period}`,
          amount:
            Number(
              declaration.declaredAmount,
            ),
          taxAmount:
            Number(
              declaration.declaredAmount,
            ),
          withholdingAmount: 0,
          status:
            declaration.status,
          sourceId:
            declaration.id,
          taxType:
            declaration.taxType,
        }),
      ),

      ...payments.map(
        (payment) => ({
          id: payment.id,
          type: 'TAX_PAYMENT',
          category:
            'TAX_PAYMENT',
          date:
            payment.paidAt,
          reference:
            payment.reference ??
            payment.id,
          description:
            `Pagamento ${payment.taxType}`,
          amount:
            Number(
              payment.amount,
            ),
          taxAmount:
            Number(
              payment.amount,
            ),
          withholdingAmount: 0,
          status: 'PAID',
          sourceId:
            payment.id,
          taxType:
            payment.taxType,
        }),
      ),
    ];

    history.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime(),
    );

    const totalIncome =
      history
        .filter(
          (item) =>
            item.type ===
              'SALE' ||
            item.type ===
              'REVENUE',
        )
        .reduce(
          (sum, item) =>
            sum + item.amount,
          0,
        );

    const totalPurchases =
      history
        .filter(
          (item) =>
            item.type ===
            'PURCHASE',
        )
        .reduce(
          (sum, item) =>
            sum + item.amount,
          0,
        );

    const totalTaxes =
      taxAssessments.reduce(
        (sum, item) =>
          sum +
          Number(
            item.finalAmount,
          ),
        0,
      );

    const totalTaxPaid =
      payments.reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount,
          ),
        0,
      );

    return {
      success: true,

      count:
        history.length,

      totals: {
        income:
          totalIncome,

        purchases:
          totalPurchases,

        taxes:
          totalTaxes,

        taxesPaid:
          totalTaxPaid,

        balance:
          totalIncome -
          totalPurchases,
      },

      history,
    };
  }

  async findByType(
    tenantId: string,
    type: string,
  ) {
    const result =
      await this.findAll(
        tenantId,
      );

    return {
      ...result,

      history:
        result.history.filter(
          (item) =>
            item.type ===
            type.toUpperCase(),
        ),
    };
  }
}