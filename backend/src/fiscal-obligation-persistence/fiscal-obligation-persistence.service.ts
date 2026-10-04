import { BadRequestException, Injectable } from '@nestjs/common';
import {
  FiscalObligationOrigin,
  ObligationStatus,
  ObligationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CommonObligationInput = {
  tenantId: string;
  type: ObligationType;
  title: string;
  dueDate: Date;
  description?: string | null;
  amount?: number | null;
  amountValue?: Prisma.Decimal | null;
  status?: ObligationStatus;
  alertEnabled?: boolean;
  alertDaysBefore?: number;
  reminderSent?: boolean;
  origin?: FiscalObligationOrigin;
};

export type CalendarObligationInput = CommonObligationInput & {
  fiscalCalendarId: string;
  period: string;
};

export type NonCalendarObligationInput = CommonObligationInput & {
  fiscalCalendarId?: null;
  origin: FiscalObligationOrigin;
  idempotencyKey: string;
  period?: string | null;
};

export type FiscalObligationPersistenceResult = {
  outcome: 'CREATED' | 'EXISTING';
  obligation: unknown;
};

const CALENDAR_IDENTITY_INDEX =
  'FiscalObligation_tenant_calendar_period_unique';
const NON_CALENDAR_IDENTITY_INDEX =
  'FiscalObligation_tenant_origin_idempotency_key_unique';

@Injectable()
export class FiscalObligationPersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  async persistCalendarDerived(
    input: CalendarObligationInput,
    prisma: Pick<PrismaService, 'fiscalObligation'> = this.prisma,
  ): Promise<FiscalObligationPersistenceResult> {
    this.assertTenant(input.tenantId);
    this.assertNonBlank(input.fiscalCalendarId, 'fiscalCalendarId');
    this.assertNonBlank(input.period, 'period');
    this.assertNewOrigin(input.origin);

    const data = {
      tenantId: input.tenantId,
      fiscalCalendarId: input.fiscalCalendarId,
      period: input.period,
      type: input.type,
      title: input.title,
      dueDate: input.dueDate,
      description: input.description,
      amount: input.amount,
      amountValue: input.amountValue,
      status: input.status,
      alertEnabled: input.alertEnabled,
      alertDaysBefore: input.alertDaysBefore,
      reminderSent: input.reminderSent,
      origin: input.origin,
    };

    try {
      return { outcome: 'CREATED', obligation: await prisma.fiscalObligation.create({ data }) };
    } catch (error) {
      if (!this.isExpectedUniqueConflict(error, CALENDAR_IDENTITY_INDEX, [
        'tenantId',
        'fiscalCalendarId',
        'period',
      ])) {
        throw error;
      }

      const obligation = await prisma.fiscalObligation.findFirst({
        where: {
          tenantId: input.tenantId,
          fiscalCalendarId: input.fiscalCalendarId,
          period: input.period,
        },
      });
      if (!obligation) throw error;
      return { outcome: 'EXISTING', obligation };
    }
  }

  async persistNonCalendar(
    input: NonCalendarObligationInput,
    prisma: Pick<PrismaService, 'fiscalObligation'> = this.prisma,
  ): Promise<FiscalObligationPersistenceResult> {
    this.assertTenant(input.tenantId);
    this.assertNewOrigin(input.origin);
    this.assertNonBlank(input.idempotencyKey, 'idempotencyKey');
    if (input.fiscalCalendarId !== undefined && input.fiscalCalendarId !== null) {
      throw new BadRequestException(
        'Non-calendar obligations cannot include fiscalCalendarId.',
      );
    }

    const data = {
      tenantId: input.tenantId,
      fiscalCalendarId: null,
      period: input.period,
      type: input.type,
      title: input.title,
      dueDate: input.dueDate,
      description: input.description,
      amount: input.amount,
      amountValue: input.amountValue,
      status: input.status,
      alertEnabled: input.alertEnabled,
      alertDaysBefore: input.alertDaysBefore,
      reminderSent: input.reminderSent,
      origin: input.origin,
      idempotencyKey: input.idempotencyKey,
    };

    try {
      return { outcome: 'CREATED', obligation: await prisma.fiscalObligation.create({ data }) };
    } catch (error) {
      if (!this.isExpectedUniqueConflict(error, NON_CALENDAR_IDENTITY_INDEX, [
        'tenantId',
        'origin',
        'idempotencyKey',
      ])) {
        throw error;
      }

      const obligation = await prisma.fiscalObligation.findFirst({
        where: {
          tenantId: input.tenantId,
          fiscalCalendarId: null,
          origin: input.origin,
          idempotencyKey: input.idempotencyKey,
        },
      });
      if (!obligation) throw error;
      return { outcome: 'EXISTING', obligation };
    }
  }

  private assertTenant(tenantId: string) {
    this.assertNonBlank(tenantId, 'tenantId');
  }

  private assertNonBlank(value: string | undefined | null, field: string) {
    if (!value?.trim()) {
      throw new BadRequestException(`${field} is required.`);
    }
  }

  private assertNewOrigin(origin: FiscalObligationOrigin | undefined) {
    if (origin === FiscalObligationOrigin.LEGACY) {
      throw new BadRequestException(
        'LEGACY cannot be assigned to a newly persisted obligation.',
      );
    }
  }

  private isExpectedUniqueConflict(
    error: unknown,
    indexName: string,
    fields: string[],
  ) {
    const candidate = error as {
      code?: string;
      meta?: { target?: string | string[] };
    };
    if (candidate?.code !== 'P2002') return false;
    const target = candidate.meta?.target;
    if (typeof target === 'string') return target.includes(indexName);
    return Array.isArray(target) && target.length === fields.length && fields.every((field) => target.includes(field));
  }
}
