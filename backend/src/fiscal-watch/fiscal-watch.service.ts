import { Injectable, Logger } from '@nestjs/common';
import { FiscalThresholdOperator, FiscalThresholdStatus, FiscalWatchEventType, Prisma, TaxType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TURNOVER_METRIC = 'TURNOVER';

@Injectable()
export class FiscalWatchService {
  private readonly logger = new Logger(FiscalWatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async evaluateTenant(tenantId: string, referenceDate = new Date()) {
    const rules = await this.prisma.fiscalThresholdRule.findMany({
      where: {
        taxType: TaxType.IVA,
        metric: TURNOVER_METRIC,
        status: FiscalThresholdStatus.OFFICIAL_CONFIRMED,
        OR: [{ tenantId: null }, { tenantId }],
        AND: [
          { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: referenceDate } }] },
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: referenceDate } }] },
        ],
      },
    });
    const results = [];
    for (const rule of rules) {
      const fiscalYear = rule.periodBasis === 'PREVIOUS_FISCAL_YEAR'
        ? referenceDate.getUTCFullYear() - 1
        : referenceDate.getUTCFullYear();
      const period = String(fiscalYear);
      const invoices = await this.prisma.invoice.findMany({
        where: { tenantId, documentType: 'NORMAL', status: { not: 'CANCELLED' }, issuedAt: { gte: new Date(Date.UTC(fiscalYear, 0, 1)), lt: new Date(Date.UTC(fiscalYear + 1, 0, 1)) } },
        select: { totalAmount: true, total: true },
      });
      const amount = invoices.reduce((sum, invoice) => sum.add(invoice.totalAmount ?? new Prisma.Decimal(invoice.total)), new Prisma.Decimal(0));
      if (!this.matches(rule.operator, amount, rule.threshold)) continue;
      results.push(await this.createEvent(tenantId, rule, period, amount));
    }
    return results;
  }

  async evaluateAllTenants(referenceDate = new Date()) {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    const results = [];
    for (const tenant of tenants) {
      try { results.push(...await this.evaluateTenant(tenant.id, referenceDate)); }
      catch (error) { this.logger.error(`Fiscal Watch falhou para tenant ${tenant.id}.`, error instanceof Error ? error.stack : undefined); }
    }
    return results;
  }

  private matches(operator: FiscalThresholdOperator, amount: Prisma.Decimal, threshold: Prisma.Decimal) {
    const comparison = amount.comparedTo(threshold);
    return operator === 'GREATER_THAN' ? comparison > 0
      : operator === 'GREATER_THAN_OR_EQUAL' ? comparison >= 0
        : operator === 'LESS_THAN' ? comparison < 0
          : operator === 'LESS_THAN_OR_EQUAL' ? comparison <= 0
            : comparison === 0;
  }

  private async createEvent(tenantId: string, rule: any, fiscalPeriod: string, metricValue: Prisma.Decimal) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.fiscalWatchEvent.findUnique({ where: { tenantId_ruleId_fiscalPeriod_eventType: { tenantId, ruleId: rule.id, fiscalPeriod, eventType: FiscalWatchEventType.REACHED } } });
      if (existing) return existing;
      const notification = await transaction.notification.create({
        data: { tenantId, title: 'Revisão de enquadramento fiscal', notificationType: 'WARNING', message: `O volume de negócios relevante de ${metricValue.toFixed(2)} Kz atingiu a condição da regra de IVA para o período ${fiscalPeriod}. Reveja o enquadramento fiscal. Fonte: ${rule.officialSource ?? rule.legalDiploma ?? 'pendente de confirmação'}.` },
      });
      return transaction.fiscalWatchEvent.create({ data: { tenantId, ruleId: rule.id, fiscalPeriod, eventType: FiscalWatchEventType.REACHED, metric: TURNOVER_METRIC, metricValue, threshold: rule.threshold, notificationId: notification.id } });
    });
  }
}
