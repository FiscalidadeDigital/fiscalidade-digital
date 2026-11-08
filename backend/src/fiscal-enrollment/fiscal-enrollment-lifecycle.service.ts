import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FiscalRegime,
  TaxRegimeAssignmentStatus,
  TaxType,
} from '@prisma/client';
import type { TaxRegimeAssignment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ChangeEnrollmentInput = {
  taxType: TaxType;
  regime: FiscalRegime;
  validFrom: string;
};

type CreateEnrollmentInput = ChangeEnrollmentInput & {
  validUntil?: string;
  legalReference?: string;
  officialSourceUrl?: string;
  sourceDiploma?: string;
  sourceArticle?: string;
};

/**
 * Changes an enrollment by closing the previous validity period and adding a
 * new historical record.  It deliberately does not touch FiscalObligation:
 * already generated, paid or submitted obligations keep their provenance.
 */
@Injectable()
export class FiscalEnrollmentLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.taxRegimeAssignment.findMany({
      where: { tenantId },
      orderBy: [{ taxType: 'asc' }, { validFrom: 'desc' }],
    });
  }

  async create(tenantId: string, input: CreateEnrollmentInput) {
    const validFrom = this.utcDay(input.validFrom);
    const validUntil = input.validUntil ? this.utcDay(input.validUntil) : null;

    if (validUntil && validUntil < validFrom) {
      throw new BadRequestException('Vigência fiscal inválida.');
    }

    const overlap = await this.prisma.taxRegimeAssignment.findFirst({
      where: {
        tenantId,
        taxType: input.taxType,
        status: TaxRegimeAssignmentStatus.ACTIVE,
        validFrom: { lte: validUntil ?? new Date('9999-12-31') },
        OR: [{ validUntil: null }, { validUntil: { gte: validFrom } }],
      },
    });
    if (overlap) {
      throw new BadRequestException(
        'Já existe um enquadramento activo sobreposto para este imposto.',
      );
    }

    return this.prisma.taxRegimeAssignment.create({
      data: {
        tenantId,
        taxType: input.taxType,
        regime: input.regime,
        validFrom,
        validUntil,
        legalReference: input.legalReference,
        officialSourceUrl: input.officialSourceUrl,
        sourceDiploma: input.sourceDiploma,
        sourceArticle: input.sourceArticle,
        status: TaxRegimeAssignmentStatus.ACTIVE,
        reviewStatus: TaxRegimeAssignmentStatus.REVIEW_REQUIRED,
        decisionDate: new Date(),
        decisionType: 'MANUAL_REVIEW_REQUIRED',
      },
    });
  }

  async change(tenantId: string, input: ChangeEnrollmentInput) {
    const validFrom = this.utcDay(input.validFrom);

    return this.prisma.$transaction(async (tx) => {
      const sameDay = await tx.taxRegimeAssignment.findFirst({
        where: {
          tenantId,
          taxType: input.taxType,
          status: TaxRegimeAssignmentStatus.ACTIVE,
          validFrom,
        },
        orderBy: { validFrom: 'desc' },
      });

      if (sameDay) {
        throw new BadRequestException(
          'Já existe um enquadramento fiscal com esta data de início.',
        );
      }

      const futureEnrollment = await tx.taxRegimeAssignment.findFirst({
        where: {
          tenantId,
          taxType: input.taxType,
          status: TaxRegimeAssignmentStatus.ACTIVE,
          validFrom: { gt: validFrom },
          OR: [{ validUntil: null }, { validUntil: { gte: validFrom } }],
        },
        orderBy: { validFrom: 'asc' },
      });

      if (futureEnrollment) {
        throw new BadRequestException(
          'Já existe um enquadramento fiscal posterior para este imposto. Reveja o histórico antes de alterar o regime.',
        );
      }

      const previous = await tx.taxRegimeAssignment.findFirst({
        where: {
          tenantId,
          taxType: input.taxType,
          status: TaxRegimeAssignmentStatus.ACTIVE,
          validFrom: { lt: validFrom },
          OR: [{ validUntil: null }, { validUntil: { gte: validFrom } }],
        },
        orderBy: { validFrom: 'desc' },
      });

      let closed: TaxRegimeAssignment | null = null;
      if (previous) {
        // Keep this assignment ACTIVE with a closed date range.  The existing
        // resolver can therefore still answer historical periods correctly.
        closed = await tx.taxRegimeAssignment.update({
          where: { id: previous.id },
          data: { validUntil: this.previousUtcDay(validFrom) },
        });
      }

      const current = await tx.taxRegimeAssignment.create({
        data: {
          tenantId,
          taxType: input.taxType,
          regime: input.regime,
          validFrom,
          status: TaxRegimeAssignmentStatus.ACTIVE,
          reviewStatus: TaxRegimeAssignmentStatus.REVIEW_REQUIRED,
          decisionDate: new Date(),
          decisionType: 'MANUAL_REGIME_CHANGE',
        },
      });

      return { previous: closed, current };
    });
  }

  async close(tenantId: string, id: string, validUntil: string) {
    const end = this.utcDay(validUntil);
    const enrollment = await this.prisma.taxRegimeAssignment.findFirst({
      where: { id, tenantId },
    });
    if (!enrollment) {
      throw new NotFoundException('Enquadramento fiscal não encontrado.');
    }
    if (end < this.utcDay(enrollment.validFrom.toISOString())) {
      throw new BadRequestException('Fim de vigência inválido.');
    }

    // A closed date range is still an historical enrollment.  Keep its
    // lifecycle active so the resolver can answer old fiscal periods.
    return this.prisma.taxRegimeAssignment.update({
      where: { id },
      data: { validUntil: end },
    });
  }

  private utcDay(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Data de efeito inválida.');
    }
    return new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
      ),
    );
  }

  private previousUtcDay(value: Date) {
    return new Date(value.getTime() - 24 * 60 * 60 * 1000);
  }
}
