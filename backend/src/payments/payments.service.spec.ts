import { BadRequestException, ConflictException } from '@nestjs/common';

import { DeclarationStatus, TaxType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { PaymentsService } from './payments.service';

const paymentDate = new Date('2026-11-20T09:15:00.000Z');

type PaymentCreateArgs = {
  data: Record<string, unknown>;
};

type PaymentFixture = Record<string, unknown> & {
  id: string;
  declaration: null;
};

function createFixture(options?: {
  declaration?: {
    id: string;
    taxType: TaxType;
    declaredAmount: number;
    paidAmount: number;
  } | null;
  existingPayment?: Record<string, unknown> | null;
}) {
  const transaction = {
    $queryRaw: jest.fn().mockResolvedValue([{ lock: '1' }]),
    taxDeclaration: {
      findFirst: jest.fn().mockResolvedValue(
        options?.declaration === undefined
          ? {
              id: 'declaration-1',
              taxType: TaxType.IVA,
              declaredAmount: 100,
              paidAmount: 70,
            }
          : options.declaration,
      ),
      update: jest.fn().mockResolvedValue({ id: 'declaration-1' }),
    },
    taxPayment: {
      findFirst: jest.fn().mockResolvedValue(options?.existingPayment ?? null),
      create: jest.fn<PaymentFixture, [PaymentCreateArgs]>(({ data }) => ({
        id: 'payment-1',
        ...data,
        declaration: null,
      })),
    },
  };
  type TransactionCallback = (value: typeof transaction) => unknown;
  const prisma = {
    $transaction: jest.fn<Promise<unknown>, [TransactionCallback]>((callback) =>
      Promise.resolve(callback(transaction)),
    ),
  } as unknown as PrismaService;

  return {
    service: new PaymentsService(prisma),
    transaction,
  };
}

describe('PaymentsService create', () => {
  it('locks and rereads the declaration before recording a payment and its balance', async () => {
    const { service, transaction } = createFixture();

    const result = await service.create('tenant-1', {
      declarationId: 'declaration-1',
      taxType: TaxType.IVA,
      amount: 30,
      reference: 'REC-2026-001',
      paidAt: paymentDate.toISOString(),
    });

    expect(transaction.$queryRaw).toHaveBeenCalledTimes(2);
    expect(transaction.taxDeclaration.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'declaration-1',
        tenantId: 'tenant-1',
      },
    });
    expect(transaction.taxPayment.create).toHaveBeenCalledTimes(1);
    const createPaymentArgs = transaction.taxPayment.create.mock.calls[0]?.[0];
    expect(createPaymentArgs?.data).toMatchObject({
      tenantId: 'tenant-1',
      declarationId: 'declaration-1',
      amount: 30,
      reference: 'REC-2026-001',
      paidAt: paymentDate,
    });
    expect(transaction.taxDeclaration.update).toHaveBeenCalledWith({
      where: { id: 'declaration-1' },
      data: {
        paidAmount: 100,
        status: DeclarationStatus.PAID,
        paymentDate,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'payment-1',
        status: 'PAID',
      }),
    );
  });

  it('returns an existing payment for an exact retry without adding it twice', async () => {
    const existingPayment = {
      id: 'payment-existing',
      tenantId: 'tenant-1',
      declarationId: 'declaration-1',
      taxType: TaxType.IVA,
      amount: 30,
      reference: 'REC-2026-001',
      paymentMethod: 'TRANSFERÊNCIA',
      paidAt: paymentDate,
      declaration: null,
    };
    const { service, transaction } = createFixture({ existingPayment });

    const result = await service.create('tenant-1', {
      declarationId: 'declaration-1',
      taxType: TaxType.IVA,
      amount: 30,
      reference: 'REC-2026-001',
    });

    expect(transaction.taxPayment.create).not.toHaveBeenCalled();
    expect(transaction.taxDeclaration.findFirst).not.toHaveBeenCalled();
    expect(transaction.taxDeclaration.update).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: 'payment-existing',
        status: 'PAID',
      }),
    );
  });

  it('rejects reuse of a reference with different values before changing totals', async () => {
    const { service, transaction } = createFixture({
      existingPayment: {
        id: 'payment-existing',
        tenantId: 'tenant-1',
        declarationId: 'declaration-1',
        taxType: TaxType.IVA,
        amount: 25,
        reference: 'REC-2026-001',
        declaration: null,
      },
    });

    await expect(
      service.create('tenant-1', {
        declarationId: 'declaration-1',
        taxType: TaxType.IVA,
        amount: 30,
        reference: 'REC-2026-001',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.taxPayment.create).not.toHaveBeenCalled();
    expect(transaction.taxDeclaration.update).not.toHaveBeenCalled();
  });

  it('rejects reuse of a reference for another declaration in the same company', async () => {
    const { service, transaction } = createFixture({
      existingPayment: {
        id: 'payment-existing',
        tenantId: 'tenant-1',
        declarationId: 'declaration-other',
        taxType: TaxType.IVA,
        amount: 30,
        reference: 'REC-2026-001',
        declaration: null,
      },
    });

    await expect(
      service.create('tenant-1', {
        declarationId: 'declaration-1',
        taxType: TaxType.IVA,
        amount: 30,
        reference: 'REC-2026-001',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(transaction.taxPayment.create).not.toHaveBeenCalled();
    expect(transaction.taxDeclaration.update).not.toHaveBeenCalled();
  });

  it('refuses an amount greater than the balance read inside the transaction', async () => {
    const { service, transaction } = createFixture({
      declaration: {
        id: 'declaration-1',
        taxType: TaxType.IVA,
        declaredAmount: 100,
        paidAmount: 90,
      },
    });

    await expect(
      service.create('tenant-1', {
        declarationId: 'declaration-1',
        taxType: TaxType.IVA,
        amount: 10.01,
        reference: 'REC-2026-001',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transaction.taxPayment.create).not.toHaveBeenCalled();
    expect(transaction.taxDeclaration.update).not.toHaveBeenCalled();
  });
});
