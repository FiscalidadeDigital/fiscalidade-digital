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

@Injectable()
export class FiscalCalendarService {
  constructor(
    private readonly prisma: PrismaService,
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
          regime: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    return this.findByRegime(
      tenant.regime,
      referenceYear,
    );
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