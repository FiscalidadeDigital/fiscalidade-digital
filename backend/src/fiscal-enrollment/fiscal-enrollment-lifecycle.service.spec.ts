import { BadRequestException } from '@nestjs/common';
import { FiscalRegime, TaxType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FiscalEnrollmentLifecycleService } from './fiscal-enrollment-lifecycle.service';

type EnrollmentData = Record<string, unknown>;
type UpdateInput = { data: EnrollmentData };
type CreateInput = { data: EnrollmentData };

describe('FiscalEnrollmentLifecycleService', () => {
  function setup() {
    const assignment = {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<EnrollmentData>, [UpdateInput]>(({ data }) =>
        Promise.resolve({ id: 'previous', ...data }),
      ),
      create: jest.fn<Promise<EnrollmentData>, [CreateInput]>(({ data }) =>
        Promise.resolve({ id: 'current', ...data }),
      ),
    };
    const tx = { taxRegimeAssignment: assignment };
    const prisma = {
      $transaction: jest.fn(
        (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
      taxRegimeAssignment: assignment,
      fiscalObligation: { update: jest.fn(), delete: jest.fn() },
    };
    return {
      assignment,
      prisma,
      service: new FiscalEnrollmentLifecycleService(
        prisma as unknown as PrismaService,
      ),
    };
  }

  it('closes the previous validity on the preceding day and preserves obligations', async () => {
    const { assignment, prisma, service } = setup();
    assignment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'previous',
        tenantId: 'tenant-a',
        taxType: 'IVA',
        validFrom: new Date('2026-01-01T00:00:00.000Z'),
        validUntil: null,
      });

    const result = await service.change('tenant-a', {
      taxType: TaxType.IVA,
      regime: FiscalRegime.SIMPLIFICADO,
      validFrom: '2026-07-01',
    });

    expect(assignment.update).toHaveBeenCalledWith({
      where: { id: 'previous' },
      data: { validUntil: new Date('2026-06-30T00:00:00.000Z') },
    });
    const createInput = assignment.create.mock.calls[0]?.[0];
    expect(createInput).toBeDefined();
    expect(createInput?.data).toMatchObject({
      tenantId: 'tenant-a',
      taxType: TaxType.IVA,
      regime: FiscalRegime.SIMPLIFICADO,
      validFrom: new Date('2026-07-01T00:00:00.000Z'),
      decisionType: 'MANUAL_REGIME_CHANGE',
    });
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.delete).not.toHaveBeenCalled();
    expect(result.current.id).toBe('current');
  });

  it('does not overwrite an enrollment that already starts on the selected date', async () => {
    const { assignment, service } = setup();
    assignment.findFirst.mockResolvedValueOnce({ id: 'same-day' });

    await expect(
      service.change('tenant-a', {
        taxType: TaxType.IVA,
        regime: FiscalRegime.GERAL,
        validFrom: '2026-07-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(assignment.update).not.toHaveBeenCalled();
    expect(assignment.create).not.toHaveBeenCalled();
  });

  it('closes a validity range without changing the historical enrollment status or obligations', async () => {
    const { assignment, prisma, service } = setup();
    assignment.findFirst.mockResolvedValueOnce({
      id: 'previous',
      tenantId: 'tenant-a',
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
    });

    await service.close('tenant-a', 'previous', '2026-06-30');

    expect(assignment.update).toHaveBeenCalledWith({
      where: { id: 'previous' },
      data: { validUntil: new Date('2026-06-30T00:00:00.000Z') },
    });
    expect(prisma.fiscalObligation.update).not.toHaveBeenCalled();
    expect(prisma.fiscalObligation.delete).not.toHaveBeenCalled();
  });
});
