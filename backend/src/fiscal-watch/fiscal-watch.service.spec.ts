import { Prisma } from '@prisma/client';
import { FiscalWatchService } from './fiscal-watch.service';

function setup(total: string, ruleOverrides: Record<string, unknown> = {}) {
  const notificationCreate = jest.fn().mockResolvedValue({ id: 'notification-a' });
  const eventCreate = jest.fn().mockResolvedValue({ id: 'event-a' });
  const transaction = {
    fiscalWatchEvent: { findUnique: jest.fn().mockResolvedValue(null), create: eventCreate },
    notification: { create: notificationCreate },
  };
  const prisma = {
    fiscalThresholdRule: { findMany: jest.fn().mockResolvedValue([{ id: 'rule-a', taxType: 'IVA', metric: 'TURNOVER', operator: 'GREATER_THAN_OR_EQUAL', threshold: new Prisma.Decimal('25000000'), periodBasis: 'RELEVANT_PERIOD', status: 'OFFICIAL_CONFIRMED', ...ruleOverrides }]) },
    invoice: { findMany: jest.fn().mockResolvedValue([{ totalAmount: new Prisma.Decimal(total), total: Number(total) }]) },
    $transaction: jest.fn(async (callback: any) => callback(transaction)),
  };
  return { service: new FiscalWatchService(prisma as any), prisma, transaction };
}

describe('FiscalWatchService', () => {
  it.each(['24999999.99', '25000000.00', '25000000.01'])('evaluates Decimal turnover at %s', async (total) => {
    const { service } = setup(total);
    const result = await service.evaluateTenant('tenant-a', new Date('2026-10-01'));
    expect(result).toHaveLength(total === '24999999.99' ? 0 : 1);
  });

  it('uses only the tenant, excludes cancelled invoices, and uses the configured period', async () => {
    const { service, prisma } = setup('25000000', { periodBasis: 'PREVIOUS_FISCAL_YEAR' });
    await service.evaluateTenant('tenant-a', new Date('2027-02-01'));
    expect((prisma.invoice.findMany as jest.Mock).mock.calls[0][0].where).toEqual(expect.objectContaining({ tenantId: 'tenant-a', status: { not: 'CANCELLED' }, documentType: 'NORMAL', issuedAt: { gte: new Date('2026-01-01T00:00:00.000Z'), lt: new Date('2027-01-01T00:00:00.000Z') } }));
  });

  it('does not evaluate pending rules', async () => {
    const { service, prisma } = setup('25000000');
    (prisma.fiscalThresholdRule.findMany as jest.Mock).mockResolvedValue([]);
    await expect(service.evaluateTenant('tenant-a')).resolves.toEqual([]);
  });

  it('does not duplicate the same event or notification', async () => {
    const { service, transaction } = setup('25000000');
    transaction.fiscalWatchEvent.findUnique.mockResolvedValue({ id: 'existing' });
    await service.evaluateTenant('tenant-a');
    expect(transaction.notification.create).not.toHaveBeenCalled();
    expect(transaction.fiscalWatchEvent.create).not.toHaveBeenCalled();
  });
});
