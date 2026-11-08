import { ConflictException } from '@nestjs/common';

import {
  NotificationType,
  ObligationStatus,
  ObligationType,
  TaxType,
} from '@prisma/client';

import { ObligationsService } from './obligations.service';

describe('ObligationsService payment confirmations', () => {
  const pendingObligation = {
    id: 'obligation-1',
    tenantId: 'tenant-1',
    title: 'IVA mensal',
    amount: 12500,
    status: ObligationStatus.PENDING,
    type: ObligationType.IVA,
    period: '2026-10',
    fiscalCalendar: {
      taxType: TaxType.IVA,
    },
  };

  function createFixture() {
    const transaction = {
      fiscalObligation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      taxPayment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (callback) => callback(transaction)),
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          name: 'Empresa Exemplo',
          email: 'financeiro@example.com',
        }),
      },
      emailLog: {
        create: jest.fn().mockResolvedValue({ id: 'email-log-1' }),
      },
      taxPayment: {
        findFirst: jest.fn().mockResolvedValue({ id: 'payment-1' }),
        create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      },
    };

    const mailService = {
      sendObligationPaymentConfirmation: jest
        .fn()
        .mockResolvedValue({ id: 'resend-1' }),
    };

    const service = new ObligationsService(
      prisma as never,
      undefined,
      undefined,
      mailService as never,
    );

    const findOne = jest
      .spyOn(service, 'findOne')
      .mockResolvedValueOnce(pendingObligation as any)
      .mockResolvedValueOnce({
        ...pendingObligation,
        status: ObligationStatus.PAID,
      } as any);

    return {
      findOne,
      mailService,
      prisma,
      service,
      transaction,
    };
  }

  it('records an in-platform confirmation and sends it to the tenant email', async () => {
    const { mailService, prisma, service, transaction } = createFixture();

    await service.markAsPaid('tenant-1', 'obligation-1');

    expect(transaction.fiscalObligation.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'obligation-1',
        tenantId: 'tenant-1',
        status: {
          in: [ObligationStatus.PENDING, ObligationStatus.LATE],
        },
      },
      data: {
        status: ObligationStatus.PAID,
        reminderSent: true,
      },
    });

    expect(transaction.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        title: 'Pagamento registado',
        message: expect.stringContaining('IVA mensal'),
        isRead: false,
        notificationType: NotificationType.SUCCESS,
      }),
    });

    expect(mailService.sendObligationPaymentConfirmation).toHaveBeenCalledWith(
      'financeiro@example.com',
      'Empresa Exemplo',
      'IVA mensal',
      expect.any(String),
      '2026-10',
      'https://fiscalidadedigital.ao/obligations',
    );

    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        email: 'f***@example.com',
        status: 'SENT',
      }),
    });
  });

  it('does not create a second notification or email for an already paid obligation', async () => {
    const { findOne, mailService, service, transaction } = createFixture();

    findOne.mockReset();
    findOne
      .mockResolvedValueOnce({
        ...pendingObligation,
        status: ObligationStatus.PAID,
      } as any)
      .mockResolvedValueOnce({
        ...pendingObligation,
        status: ObligationStatus.PAID,
      } as any);

    await service.markAsPaid('tenant-1', 'obligation-1');

    expect(transaction.notification.create).not.toHaveBeenCalled();

    expect(
      mailService.sendObligationPaymentConfirmation,
    ).not.toHaveBeenCalled();
  });

  it('does not create a payment when another process changes the obligation state', async () => {
    const { findOne, prisma, service, transaction } = createFixture();

    transaction.fiscalObligation.updateMany.mockResolvedValue({
      count: 0,
    });

    findOne.mockReset();
    findOne
      .mockResolvedValueOnce(pendingObligation as any)
      .mockResolvedValueOnce(pendingObligation as any);

    await expect(
      service.markAsPaid('tenant-1', 'obligation-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.taxPayment.create).not.toHaveBeenCalled();
    expect(transaction.notification.create).not.toHaveBeenCalled();
    expect(prisma.taxPayment.create).not.toHaveBeenCalled();
  });

  it('keeps the payment registered when the email provider is unavailable', async () => {
    const { mailService, prisma, service, transaction } = createFixture();

    mailService.sendObligationPaymentConfirmation.mockRejectedValue(
      new Error('Resend indisponivel'),
    );

    await expect(
      service.markAsPaid('tenant-1', 'obligation-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        status: ObligationStatus.PAID,
      }),
    );

    expect(transaction.notification.create).toHaveBeenCalledTimes(1);

    expect(prisma.emailLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'FAILED',
      }),
    });
  });
});
