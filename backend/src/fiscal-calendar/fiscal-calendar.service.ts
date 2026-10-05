import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  FiscalRegime,
  TaxType,
  ObligationType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';

@Injectable()
export class FiscalCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrollments: FiscalEnrollmentService = new FiscalEnrollmentService(prisma),
  ) {}

  // =====================================================
  // LISTAR TODO O CALENDÁRIO FISCAL
  // =====================================================

  async findAll(
    referenceYear?: number,
  ) {
    const where: any = {
      active: true,
    };

    if (referenceYear !== undefined) {
      where.referenceYear = referenceYear;
    }

    return this.prisma.fiscalCalendar.findMany({
      where,

      include: {
        regimes: true,
      },

      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  // =====================================================
  // CALENDÁRIO DA EMPRESA AUTENTICADA
  //
  // O REGIME DA EMPRESA É A FONTE DE VERDADE.
  // Uma empresa GERAL só recebe regras GERAL.
  // Uma empresa SIMPLIFICADO só recebe regras SIMPLIFICADO.
  // =====================================================

  async findForTenant(
    tenantId: string,
    referenceYear?: number,
  ) {
    const tenant =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },

        select: {
          id: true,
          name: true,
          nif: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    const rules = await this.findAll(referenceYear);
    const applicable = await Promise.all(rules.map(async (rule) => {
      if (!rule.regimes.length) return true;
      const enrollment = await this.enrollments.resolve(
        tenantId,
        rule.taxType,
        this.ruleReferenceDate(rule),
      );
      return Boolean(enrollment && rule.regimes.some((item) => item.regime === enrollment.regime));
    }));
    return rules.filter((_, index) => applicable[index]);
  }

  // =====================================================
  // CALENDÁRIO POR REGIME
  //
  // IMPORTANTE:
  // A relação FiscalCalendarRegime.calendar é usada
  // internamente pelo Prisma através de "regimes".
  // =====================================================

  async findByRegime(
    regime: FiscalRegime,
    referenceYear?: number,
  ) {
    const where: any = {
      active: true,

      regimes: {
        some: {
          regime,
        },
      },
    };

    if (referenceYear !== undefined) {
      where.referenceYear = referenceYear;
    }

    return this.prisma.fiscalCalendar.findMany({
      where,

      include: {
        regimes: true,
      },

      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  private ruleReferenceDate(rule: { period: string | null; referenceYear: number; dueDate: Date }) {
    const normalized = String(rule.period ?? '').trim().toUpperCase();
    const numeric = normalized.match(/^(\d{4})-(\d{1,2})$/);
    if (numeric) return new Date(Date.UTC(Number(numeric[1]), Number(numeric[2]) - 1, 1));
    const months = ['JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const month = months.indexOf(normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    if (month >= 0) return new Date(Date.UTC(rule.referenceYear, month, 1));
    return new Date(rule.dueDate);
  }

  // =====================================================
  // FILTRAR POR TIPO DE IMPOSTO
  //
  // Este método é global:
  // pode devolver regras de diferentes regimes.
  //
  // Para calendário de uma empresa específica,
  // usar findForTenant() / findByRegime().
  // =====================================================

  async findByTaxType(
    taxType: TaxType,
    referenceYear?: number,
  ) {
    const where: any = {
      active: true,
      taxType,
    };

    if (referenceYear !== undefined) {
      where.referenceYear = referenceYear;
    }

    return this.prisma.fiscalCalendar.findMany({
      where,

      include: {
        regimes: true,
      },

      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  // =====================================================
  // FILTRAR POR TIPO DE OBRIGAÇÃO
  //
  // Também é uma consulta global.
  // O regime deve ser aplicado quando a consulta for
  // feita no contexto de uma empresa.
  // =====================================================

  async findByObligationType(
    obligationType: ObligationType,
    referenceYear?: number,
  ) {
    const where: any = {
      active: true,
      obligationType,
    };

    if (referenceYear !== undefined) {
      where.referenceYear = referenceYear;
    }

    return this.prisma.fiscalCalendar.findMany({
      where,

      include: {
        regimes: true,
      },

      orderBy: [
        {
          dueDate: 'asc',
        },
        {
          title: 'asc',
        },
      ],
    });
  }

  // =====================================================
  // BUSCAR ITEM DO CALENDÁRIO POR ID
  // =====================================================

  async findOne(
    id: string,
  ) {
    const calendar =
      await this.prisma.fiscalCalendar.findUnique({
        where: {
          id,
        },

        include: {
          regimes: true,

          obligations: {
            take: 20,

            orderBy: {
              dueDate: 'asc',
            },
          },
        },
      });

    if (!calendar) {
      throw new NotFoundException(
        'Item do calendário fiscal não encontrado.',
      );
    }

    return calendar;
  }
}
