import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionAccessService } from './subscription-access.service';

describe('SubscriptionAccessService', () => {
  const prisma = {
    tenant: { findUnique: jest.fn() },
    subscription: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const now = new Date('2026-09-29T12:00:00.000Z');
  let service: SubscriptionAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionAccessService(prisma);
  });

  it('reconhece um trial activo e calcula dias restantes no backend', async () => {
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      {
        id: 'tenant-a',
        status: 'TRIAL',
        planType: 'FREE',
        createdAt: new Date('2026-09-27T12:00:00.000Z'),
        trialEndsAt: new Date('2026-10-04T12:00:00.000Z'),
      },
      null,
      null,
    ]);

    const result = await service.getStatus('tenant-a', now);

    expect(result.state).toBe('TRIAL_ACTIVE');
    expect(result.commercialAccess).toBe(true);
    expect(result.trial.daysRemaining).toBe(5);
    expect(result.enforcement.status).toBe('PREPARED_NOT_APPLIED');
    expect(prisma.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'tenant-a' } }),
    );
    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }),
    );
  });

  it('dá precedência a uma subscrição paga válida depois do trial', async () => {
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      {
        id: 'tenant-a',
        status: 'ACTIVE',
        planType: 'BASIC',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        trialEndsAt: new Date('2026-01-08T00:00:00.000Z'),
      },
      {
        id: 'subscription-1',
        planType: 'PREMIUM',
        startsAt: new Date('2026-09-01T00:00:00.000Z'),
        endsAt: new Date('2026-10-01T00:00:00.000Z'),
        paymentStatus: 'PAID',
      },
      {
        id: 'subscription-1',
        planType: 'PREMIUM',
        startsAt: new Date('2026-09-01T00:00:00.000Z'),
        endsAt: new Date('2026-10-01T00:00:00.000Z'),
        paymentStatus: 'PAID',
        isActive: true,
      },
    ]);

    const result = await service.getStatus('tenant-a', now);

    expect(result.state).toBe('SUBSCRIPTION_ACTIVE');
    expect(result.plan.current).toBe('PREMIUM');
    expect(result.commercialAccess).toBe(true);
  });

  it.each([
    ['TRIAL', new Date('2026-09-28T12:00:00.000Z'), 'TRIAL_EXPIRED'],
    ['SUSPENDED', null, 'SUSPENDED'],
    ['ACTIVE', null, 'SUBSCRIPTION_REQUIRED'],
  ] as const)(
    'calcula o estado %s sem activar bloqueio global',
    async (tenantStatus, trialEndsAt, expectedState) => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        {
          id: 'tenant-a',
          status: tenantStatus,
          planType: 'FREE',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          trialEndsAt,
        },
        null,
        null,
      ]);

      const result = await service.getStatus('tenant-a', now);
      expect(result.state).toBe(expectedState);
      expect(result.commercialAccess).toBe(false);
      expect(result.enforcement.status).toBe('PREPARED_NOT_APPLIED');
    },
  );
});
