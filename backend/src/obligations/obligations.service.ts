import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  FiscalRegime,
  ObligationStatus,
  ObligationType,
  Prisma,
  TaxRuleOperation,
  TaxType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { FiscalObligationPersistenceService } from '../fiscal-obligation-persistence/fiscal-obligation-persistence.service';
import { FiscalEnrollmentService } from '../fiscal-enrollment/fiscal-enrollment.service';

@Injectable()
export class ObligationsService {
  private readonly logger = new Logger(ObligationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly obligationPersistence: FiscalObligationPersistenceService = new FiscalObligationPersistenceService(
      prisma,
    ),
    private readonly enrollments: FiscalEnrollmentService = new FiscalEnrollmentService(
      prisma,
    ),
  ) {}

  // ============================================================
  // SINCRONIZAR TODAS AS EMPRESAS
  // ============================================================

  async syncAllCompanies() {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIAL'],
        },
      },

      select: {
        id: true,
        name: true,
        regime: true,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });

    let created = 0;
    let updated = 0;
    let late = 0;
    let backfilledPayments = 0;

    for (const tenant of tenants) {
      try {
        const result = await this.syncCompany(tenant.id);

        created += Number(result.created || 0);

        updated += Number(result.updated || 0);

        late += Number(result.late || 0);

        backfilledPayments += Number(result.backfilledPayments || 0);
      } catch (error) {
        this.logger.error(
          [
            'Erro ao sincronizar empresa.',
            `Empresa: ${tenant.name}`,
            `ID: ${tenant.id}`,
            error instanceof Error ? error.message : String(error),
          ].join(' | '),
        );
      }
    }

    return {
      success: true,
      companies: tenants.length,
      created,
      updated,
      late,
      backfilledPayments,
      synchronizedAt: new Date(),
    };
  }

  // ============================================================
  // SINCRONIZAR
  // ============================================================

  async sync(tenantId: string) {
    return this.syncCompany(tenantId);
  }

  // ============================================================
  // SINCRONIZAR EMPRESA
  // ============================================================

  async syncCompany(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },

      select: {
        id: true,
        name: true,
        nif: true,
        regime: true,
        sector: true,
        companyType: true,
        retentionRate: true,
        status: true,
        createdAt: true,
        activityStartedAt: true,
        hasPriorUnregularizedObligations: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const now = new Date();

    const currentYear = now.getFullYear();

    const existingObligationCount = await this.prisma.fiscalObligation.count({
      where: {
        tenantId,
      },
    });

    const isFirstSynchronization = existingObligationCount === 0;

    /*
     * A sincronização só pode acrescentar obrigações futuras. Nunca volta a
     * percorrer períodos vencidos para os marcar em atraso ou reescrever o
     * histórico já guardado. A declaração de obrigações antigas usa o estado
     * próprio HISTORICAL_CONFIRMATION criado no onboarding.
     */
    const minimumDueDate = this.startOfDay(now);

    // ==========================================================
    // CALENDÁRIO FISCAL
    // ==========================================================

    const rawCalendarRules = await this.prisma.fiscalCalendar.findMany({
      where: {
        active: true,

        referenceYear: currentYear,

        dueDate: {
          gte: minimumDueDate,
        },
      },

      include: {
        regimes: true,
      },

      orderBy: {
        dueDate: 'asc',
      },
    });

    const calendarRules: Array<{
      rule: (typeof rawCalendarRules)[number];
      regime: FiscalRegime | null;
    }> = [];
    for (const rule of rawCalendarRules) {
      const effectiveDate = this.ruleEffectiveDate(
        rule.period,
        rule.referenceYear,
        rule.dueDate,
      );
      if (
        tenant.activityStartedAt &&
        effectiveDate < this.startOfDay(tenant.activityStartedAt)
      ) {
        continue;
      }
      if (
        this.isLabourObligation(rule.obligationType, rule.taxType) &&
        !(await this.hasLabourTrigger(tenantId, effectiveDate))
      ) {
        continue;
      }
      const enrollmentTaxType = this.enrollmentTaxType(rule.taxType);
      const enrollment = enrollmentTaxType
        ? await this.enrollments.resolve(
            tenantId,
            enrollmentTaxType,
            effectiveDate,
          )
        : null;
      if (
        this.isCalendarRuleApplicable(
          rule,
          enrollment?.regime ?? null,
          Boolean(enrollmentTaxType),
        )
      ) {
        calendarRules.push({ rule, regime: enrollment?.regime ?? null });
      }
    }

    let created = 0;
    let updated = 0;
    let late = 0;

    // ==========================================================
    // PROCESSAR REGRAS
    // ==========================================================

    for (const { rule, regime } of calendarRules) {
      const period = rule.period || String(rule.referenceYear || currentYear);

      let existing = await this.prisma.fiscalObligation.findFirst({
        where: {
          tenantId,

          fiscalCalendarId: rule.id,

          period,
        },
      });

      // --------------------------------------------------------
      // COMPATIBILIDADE COM OBRIGAÇÕES ANTIGAS
      // --------------------------------------------------------

      if (!existing) {
        existing = await this.prisma.fiscalObligation.findFirst({
          where: {
            tenantId,

            period,

            type: rule.obligationType,

            dueDate: rule.dueDate,
          },

          orderBy: {
            createdAt: 'asc',
          },
        });
      }

      // --------------------------------------------------------
      // CALCULAR VALOR
      // --------------------------------------------------------

      const calculatedAmount = await this.calculateObligationAmount(
        tenant,
        rule.obligationType,
        rule.taxType,
        rule.title,
        rule.description,
        rule.dueDate,
        period,
        regime,
      );

      const existingAmount = existing?.amount ?? null;

      /*
       * A ausência de um apuramento confirmado não é um imposto zero.
       * Mantemos o valor histórico já persistido, quando existe, e deixamos
       * novas obrigações sem montante até o FiscalEngine produzir o
       * TaxAssessment correspondente.
       */
      let finalAmount: number | null =
        calculatedAmount === null
          ? existingAmount
          : this.number(calculatedAmount);

      /*
       * Quando a fonte operacional determina
       * que o valor é realmente zero,
       * não manter um valor antigo artificial.
       */

      if (
        calculatedAmount === 0 &&
        existingAmount !== null &&
        existingAmount > 0 &&
        !this.hasReliableZeroSource(
          rule.obligationType,
          rule.taxType,
          rule.title,
          rule.description,
        )
      ) {
        finalAmount = existingAmount;
      }

      if (finalAmount !== null) {
        finalAmount = this.round(Math.max(0, finalAmount));
      }

      // ========================================================
      // OBRIGAÇÃO EXISTENTE
      // ========================================================

      if (existing) {
        // Calendar synchronisation is append-only. An existing record may
        // have been paid, reviewed, or manually corrected; its snapshot is
        // never overwritten by a later read/sync operation.
        continue;
      }

      // ========================================================
      // NOVA OBRIGAÇÃO
      // ========================================================

      const persisted = await this.obligationPersistence.persistCalendarDerived(
        {
          tenantId: tenant.id,
          fiscalCalendarId: rule.id,
          period,
          referenceYear: rule.referenceYear,
          type: rule.obligationType,
          title: rule.title,
          description: rule.description,
          amount: finalAmount,
          dueDate: rule.dueDate,
          status: ObligationStatus.PENDING,
          alertEnabled: true,
          alertDaysBefore: 7,
          reminderSent: false,
          origin: 'CALENDAR',
        },
      );

      if (persisted.outcome === 'CREATED') created++;
    }

    // ==========================================================
    // RECONCILIAR PAGAMENTOS
    // ==========================================================

    const backfilledPayments = await this.backfillPaidObligations(tenant.id);

    this.logger.log(
      [
        `Empresa: ${tenant.name}`,
        `NIF: ${tenant.nif}`,
        'Enquadramento: resolvido por imposto e período',
        `Ano: ${currentYear}`,
        `Primeira sincronização: ${isFirstSynchronization ? 'SIM' : 'NÃO'}`,
        `Regras elegíveis: ${calendarRules.length}`,
        `Regras ignoradas: ${rawCalendarRules.length - calendarRules.length}`,
        `Criadas: ${created}`,
        `Actualizadas: ${updated}`,
        `Atrasadas: ${late}`,
        `Pagamentos reconciliados: ${backfilledPayments}`,
      ].join(' | '),
    );

    return {
      success: true,

      tenant: {
        id: tenant.id,

        name: tenant.name,

        nif: tenant.nif,

        regime: null,
      },

      year: currentYear,

      firstSynchronization: isFirstSynchronization,

      existingObligationCount,

      minimumDueDate,

      calendarRules: calendarRules.length,

      ignoredCalendarRules: rawCalendarRules.length - calendarRules.length,

      created,

      updated,

      late,

      backfilledPayments,

      synchronizedAt: new Date(),
    };
  }

  // ============================================================
  // VALIDAR REGRA DO CALENDÁRIO
  // ============================================================

  /** Only IVA and Industrial currently use explicit regime enrollment. */
  private enrollmentTaxType(taxType: TaxType): TaxType | null {
    if (taxType === TaxType.IVA) return TaxType.IVA;
    if (taxType === TaxType.INDUSTRIAL || taxType === TaxType.II)
      return TaxType.INDUSTRIAL;
    return null;
  }

  private isLabourObligation(obligationType: ObligationType, taxType: TaxType) {
    return (
      obligationType === ObligationType.IRT ||
      obligationType === ObligationType.SS ||
      taxType === TaxType.IRT ||
      taxType === TaxType.SS
    );
  }

  /** IRT/INSS are generated only where there is an employee or a payroll. */
  private async hasLabourTrigger(tenantId: string, period: Date) {
    const [employees, payrolls] = await Promise.all([
      this.prisma.employee.count({
        where: {
          tenantId,
          status: 'ACTIVE',
          OR: [{ hireDate: null }, { hireDate: { lte: period } }],
          AND: [
            {
              OR: [
                { terminationDate: null },
                { terminationDate: { gte: period } },
              ],
            },
          ],
        },
      }),
      this.prisma.payroll.count({
        where: {
          tenantId,
          year: period.getUTCFullYear(),
          month: period.getUTCMonth() + 1,
        },
      }),
    ]);
    return employees > 0 || payrolls > 0;
  }

  /** Resolves an enrollment against the obligation's fiscal period, never today's date. */
  private ruleEffectiveDate(
    period: string | null,
    referenceYear: number,
    dueDate: Date,
  ): Date {
    const parsed = this.parseFiscalPeriod(period || '', referenceYear);
    if (parsed) return new Date(Date.UTC(parsed.year, parsed.month - 1, 1));
    return new Date(
      Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), 1),
    );
  }

  private isCalendarRuleApplicable(
    rule: {
      title: string;
      description: string | null;
      taxType: TaxType;
      obligationType: ObligationType;
      regimes?: Array<{ regime: FiscalRegime }>;
    },

    regime: FiscalRegime | null,
    enrollmentRequired: boolean,
  ): boolean {
    if (enrollmentRequired && !regime) return false;
    if (
      enrollmentRequired &&
      rule.regimes?.length &&
      !rule.regimes.some((item) => item.regime === regime)
    )
      return false;
    const text = this.normalizeFiscalText(
      `${rule.title ?? ''} ${rule.description ?? ''}`,
    );

    const isGeneral = regime ? this.isGeneralRegime(regime) : false;

    const isSimplified = regime ? this.isSimplifiedRegime(regime) : false;

    // ==========================================================
    // GERAL
    // ==========================================================

    if (isGeneral) {
      /*
       * Uma empresa do regime geral não recebe
       * obrigações específicas do IVA Simplificado.
       */

      if (text.includes('iva simplificado')) {
        return false;
      }

      if (text.includes('regime simplificado') && text.includes('iva')) {
        return false;
      }
    }

    // ==========================================================
    // SIMPLIFICADO
    // ==========================================================

    if (isSimplified) {
      /*
       * Uma empresa simplificada não recebe
       * regras específicas do IVA Geral.
       */

      if (text.includes('iva regime geral')) {
        return false;
      }

      if (text.includes('regime geral') && text.includes('iva')) {
        return false;
      }
    }

    return true;
  }

  // ============================================================
  // CALCULAR OBRIGAÇÃO
  // ============================================================

  private async calculateObligationAmount(
    tenant: {
      id: string;
      regime: FiscalRegime;
      sector: string | null;
      companyType: string | null;
      retentionRate: number;
    },

    obligationType: ObligationType,

    taxType: TaxType,

    title: string,

    description: string | null,

    dueDate: Date,

    period: string,
    applicableRegime: FiscalRegime | null = null,
  ): Promise<number | null> {
    const dueYear = dueDate.getFullYear();

    const dueMonth = dueDate.getMonth() + 1;

    // ==========================================================
    // PERÍODO FISCAL DA OBRIGAÇÃO
    // ==========================================================
    //
    // A data de vencimento NÃO é o período tributário.
    //
    // Exemplo IVA Regime Geral:
    // - Facturas de Setembro
    // - obrigação correspondente: Setembro
    // - vencimento: Outubro
    //
    // Por isso usamos primeiro o campo `period` do calendário.
    // Só usamos o mês anterior ao vencimento como fallback para
    // regras antigas cujo período não seja um mês reconhecível.
    // ==========================================================

    const parsedPeriod = this.parseFiscalPeriod(period, dueYear);

    /*
     * Para impostos mensais, o período fiscal é determinado
     * pela obrigação do calendário.
     *
     * No IVA do Regime Geral, a obrigação vence no mês seguinte
     * ao mês das operações. Portanto:
     *
     *   obrigação vencimento Outubro -> facturas de Setembro
     *   obrigação vencimento Novembro -> facturas de Outubro
     *
     * Não usamos `period` do calendário para o IVA Geral porque
     * existem calendários antigos/importados onde esse campo pode
     * estar preenchido com o mês de vencimento em vez do mês de
     * referência. A data de vencimento é a referência segura para
     * esta obrigação mensal.
     *
     * Para os restantes impostos mantemos o período explícito do
     * calendário quando ele for reconhecível.
     */
    const isGeneralIva =
      taxType === TaxType.IVA && applicableRegime === FiscalRegime.GERAL;

    const referenceMonth = isGeneralIva
      ? dueMonth === 1
        ? 12
        : dueMonth - 1
      : (parsedPeriod?.month ?? (dueMonth === 1 ? 12 : dueMonth - 1));

    const referenceYear = isGeneralIva
      ? dueMonth === 1
        ? dueYear - 1
        : dueYear
      : (parsedPeriod?.year ?? (dueMonth === 1 ? dueYear - 1 : dueYear));

    const start = new Date(referenceYear, referenceMonth - 1, 1);

    const end = new Date(referenceYear, referenceMonth, 1);

    const ruleText = this.normalizeFiscalText(
      `${title ?? ''} ${description ?? ''}`,
    );

    /*
     * The FiscalEngine is the sole authority for assessed IVA and Industrial
     * amounts. Calendar synchronization may create a duty, but it must not
     * recreate a concurrent formula when the assessment needs review.
     */
    const assessmentTaxType =
      taxType === TaxType.II ? TaxType.INDUSTRIAL : taxType;
    const centralAssessment = await this.findAssessment(
      tenant.id,
      assessmentTaxType,
      period,
      referenceYear,
    );

    if (centralAssessment) {
      const status = centralAssessment.calculationStatus;
      if (status === 'CALCULATED' || status === 'ZERO' || status === 'CREDIT') {
        return this.round(
          Math.max(
            0,
            this.number(
              centralAssessment.payableAmountValue ??
                centralAssessment.finalAmountValue ??
                centralAssessment.finalAmount,
            ),
          ),
        );
      }

      return null;
    }

    // ==========================================================
    // SAF-T
    // ==========================================================

    if (ruleText.includes('saft') || ruleText.includes('saf-t')) {
      return 0;
    }

    // ==========================================================
    // IRT
    // ==========================================================

    if (taxType === TaxType.IRT) {
      const isGroupA = ruleText.includes('grupo a');

      const isGroupBC =
        ruleText.includes('grupos b e c') ||
        ruleText.includes('grupo b') ||
        ruleText.includes('grupo c');

      /*
       * Grupo B/C não deve utilizar a folha
       * de salários dos trabalhadores.
       */

      if (isGroupBC && !isGroupA) {
        return 0;
      }

      /*
       * Grupo A:
       * fonte oficial interna = Payroll.
       */

      if (isGroupA) {
        return this.getPayrollTaxAmount(
          tenant.id,
          referenceYear,
          referenceMonth,
          'IRT',
        );
      }

      return 0;
    }

    // ==========================================================
    // SEGURANÇA SOCIAL
    // ==========================================================

    if (taxType === TaxType.SS) {
      return this.getPayrollTaxAmount(
        tenant.id,
        referenceYear,
        referenceMonth,
        'SS',
      );
    }

    // ==========================================================
    // IVA
    // ==========================================================

    if (taxType === TaxType.IVA || obligationType === ObligationType.IVA) {
      return null;
    }

    // ==========================================================
    // RETENÇÃO
    // ==========================================================

    if (obligationType === ObligationType.RETENCAO) {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          tenantId: tenant.id,

          issuedAt: {
            gte: start,

            lt: end,
          },

          status: {
            not: 'CANCELLED',
          },
        },

        select: {
          withholdingTax: true,
        },
      });

      const amount = invoices.reduce(
        (sum, invoice) => sum + this.number(invoice.withholdingTax),
        0,
      );

      return this.round(amount);
    }

    // ==========================================================
    // IMPOSTO INDUSTRIAL
    // ==========================================================

    if (taxType === TaxType.INDUSTRIAL) {
      return null;
    }

    // ==========================================================
    // TAX DECLARATION
    // ==========================================================

    const declarationAmount = await this.getDeclarationAmount(
      tenant.id,
      taxType,
      period,
      referenceYear,
      referenceMonth,
    );

    if (declarationAmount !== null) {
      return this.round(Math.max(0, declarationAmount));
    }

    // ==========================================================
    // TAX RULE
    // ==========================================================

    const taxRule = await this.findTaxRule(
      tenant,
      taxType,
      TaxRuleOperation.OTHER,
      referenceMonth === null
        ? null
        : ((
            await this.enrollments.resolve(
              tenant.id,
              taxType,
              new Date(Date.UTC(referenceYear, referenceMonth - 1, 1)),
            )
          )?.regime ?? null),
      new Date(Date.UTC(referenceYear, Math.max(0, referenceMonth - 1), 1)),
    );

    if (taxRule) {
      const revenues = await this.prisma.revenue.findMany({
        where: {
          tenantId: tenant.id,

          year: referenceYear,

          month: referenceMonth,
        },

        select: {
          amount: true,
        },
      });

      const base = revenues.reduce(
        (sum, revenue) => sum + this.number(revenue.amount),
        0,
      );

      if (base > 0) {
        return this.applyTaxRule(base, taxRule);
      }
    }

    return 0;
  }

  // ============================================================
  // TAX ASSESSMENT
  // ============================================================

  private async findAssessment(
    tenantId: string,
    taxType: TaxType,
    period: string,
    year: number,
  ) {
    try {
      return await this.prisma.taxAssessment.findFirst({
        where: {
          tenantId,

          taxType,

          period,

          year,
        },

        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch {
      return null;
    }
  }

  // ============================================================
  // DECLARAÇÃO
  // ============================================================

  private async getDeclarationAmount(
    tenantId: string,
    taxType: TaxType,
    period: string,
    year: number,
    month: number,
  ): Promise<number | null> {
    const candidates = this.buildPeriodCandidates(period, year, month);

    const declarations = await this.prisma.taxDeclaration.findMany({
      where: {
        tenantId,

        taxType,

        period: {
          in: candidates,
        },
      },

      orderBy: {
        declarationDate: 'desc',
      },

      take: 10,
    });

    if (declarations.length === 0) {
      return null;
    }

    const declaration = declarations[0];

    const declared = this.number(declaration.declaredAmount);

    const paid = this.number(declaration.paidAmount);

    return this.round(Math.max(0, declared - paid));
  }

  // ============================================================
  // PERÍODOS
  // ============================================================

  private buildPeriodCandidates(
    period: string,
    year: number,
    month: number,
  ): string[] {
    const values = new Set<string>();

    const raw = String(period || '').trim();

    if (raw) {
      values.add(raw);
    }

    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    const monthName = months[month - 1];

    if (monthName) {
      values.add(monthName);

      values.add(monthName.toLowerCase());

      values.add(`${monthName}/${year}`);

      values.add(`${monthName} ${year}`);

      values.add(`${String(month).padStart(2, '0')}/${year}`);

      values.add(`${year}-${String(month).padStart(2, '0')}`);
    }

    values.add(String(year));

    return Array.from(values);
  }

  // ============================================================
  // INTERPRETAR PERÍODO FISCAL
  // ============================================================
  //
  // O calendário fiscal pode guardar o período como:
  // Janeiro, Fevereiro, ..., Dezembro
  // 2026-01, 2026-02, ...
  // 01/2026, 02/2026, ...
  // Janeiro/2026, Janeiro 2026, etc.
  //
  // Retornamos o mês/ano do período tributário.
  // ============================================================

  private parseFiscalPeriod(
    period: string,
    fallbackYear: number,
  ): {
    month: number;
    year: number;
  } | null {
    const raw = String(period ?? '').trim();

    if (!raw) {
      return null;
    }

    const normalized = this.normalizeFiscalText(raw);

    const monthNames: Record<string, number> = {
      janeiro: 1,
      fevereiro: 2,
      marco: 3,
      abril: 4,
      maio: 5,
      junho: 6,
      julho: 7,
      agosto: 8,
      setembro: 9,
      outubro: 10,
      novembro: 11,
      dezembro: 12,
    };

    for (const [monthName, month] of Object.entries(monthNames)) {
      if (
        normalized === monthName ||
        normalized.startsWith(`${monthName}/`) ||
        normalized.startsWith(`${monthName} `)
      ) {
        const yearMatch = normalized.match(/(19|20)\\d{2}/);

        return {
          month,
          year: yearMatch ? Number(yearMatch[0]) : fallbackYear,
        };
      }
    }

    let match = normalized.match(/^(\\d{4})[-/]([01]\\d)$/);

    if (match) {
      const year = Number(match[1]);

      const month = Number(match[2]);

      if (month >= 1 && month <= 12) {
        return {
          month,
          year,
        };
      }
    }

    match = normalized.match(/^([01]\\d)[-/](\\d{4})$/);

    if (match) {
      const month = Number(match[1]);

      const year = Number(match[2]);

      if (month >= 1 && month <= 12) {
        return {
          month,
          year,
        };
      }
    }

    return null;
  }

  // ============================================================
  // ZERO CONFIÁVEL
  // ============================================================

  private hasReliableZeroSource(
    obligationType: ObligationType,

    taxType: TaxType,

    title: string,

    description: string | null,
  ): boolean {
    const text = this.normalizeFiscalText(
      `${title ?? ''} ${description ?? ''}`,
    );

    if (text.includes('saft') || text.includes('saf-t')) {
      return true;
    }

    if (taxType === TaxType.IVA || obligationType === ObligationType.IVA) {
      return true;
    }

    if (taxType === TaxType.IRT || obligationType === ObligationType.IRT) {
      return true;
    }

    if (taxType === TaxType.SS || obligationType === ObligationType.SS) {
      return true;
    }

    if (obligationType === ObligationType.RETENCAO) {
      return true;
    }

    return false;
  }

  // ============================================================
  // PAYROLL
  // ============================================================

  private async getPayrollTaxAmount(
    tenantId: string,
    year: number,
    month: number,
    type: 'IRT' | 'SS',
  ): Promise<number> {
    const payrolls = await this.prisma.payroll.findMany({
      where: {
        tenantId,

        year,

        month,

        status: {
          not: 'DRAFT',
        },
      },

      orderBy: [
        {
          processedAt: 'desc',
        },

        {
          updatedAt: 'desc',
        },

        {
          createdAt: 'desc',
        },
      ],

      select: {
        irtAmount: true,

        socialSecurityAmount: true,
      },
    });

    if (payrolls.length === 0) {
      return 0;
    }

    const payroll = payrolls[0];

    if (type === 'IRT') {
      return this.round(this.number(payroll.irtAmount));
    }

    return this.round(this.number(payroll.socialSecurityAmount));
  }

  // ============================================================
  // TAX RULES
  // ============================================================

  private async getTaxRules(_tenantId: string): Promise<any[]> {
    try {
      /*
       * TaxRule NÃO possui tenantId no schema Prisma.
       *
       * Portanto as regras são globais e depois
       * filtradas por regime/operação/sector/tipo
       * de empresa.
       */

      const rules = await this.prisma.taxRule.findMany({
        where: {
          active: true,
        },
      });

      return rules;
    } catch (error) {
      this.logger.warn(
        [
          'Não foi possível carregar TaxRules.',
          error instanceof Error ? error.message : String(error),
        ].join(' '),
      );

      return [];
    }
  }

  // ============================================================
  // ENCONTRAR TAX RULE
  // ============================================================

  private async findTaxRule(
    tenant: {
      id: string;
      sector: string | null;
      companyType: string | null;
    },

    taxType: TaxType,

    operation: TaxRuleOperation,
    regime: FiscalRegime | null,
    referenceDate: Date,
  ): Promise<any | null> {
    const rules = await this.getTaxRules(tenant.id);

    const candidates = rules.filter((rule) => {
      if (rule.taxType !== taxType) {
        return false;
      }

      if (rule.regime && rule.regime !== regime) {
        return false;
      }

      if (rule.operation && rule.operation !== operation) {
        return false;
      }

      if (rule.sector && rule.sector !== tenant.sector) {
        return false;
      }

      if (rule.companyType && rule.companyType !== tenant.companyType) {
        return false;
      }

      if (rule.validFrom && new Date(rule.validFrom) > referenceDate) {
        return false;
      }

      if (rule.validTo && new Date(rule.validTo) < referenceDate) {
        return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    return candidates.sort(
      (a, b) => this.taxRuleSpecificity(b) - this.taxRuleSpecificity(a),
    )[0];
  }

  // ============================================================
  // ESPECIFICIDADE DA REGRA
  // ============================================================

  private taxRuleSpecificity(rule: any): number {
    let score = 0;

    if (rule.regime) {
      score += 30;
    }

    if (rule.operation) {
      score += 20;
    }

    if (rule.sector) {
      score += 10;
    }

    if (rule.companyType) {
      score += 10;
    }

    return score;
  }

  // ============================================================
  // APLICAR TAX RULE
  // ============================================================

  private applyTaxRule(base: number, rule: any): number {
    const safeBase = Math.max(0, this.number(base));

    const rate = this.number(rule.rate);

    const fixedAmount = this.number(rule.fixedAmount);

    let amount = fixedAmount > 0 ? fixedAmount : safeBase * rate;

    const min = this.number(rule.minAmount);

    const max = this.number(rule.maxAmount);

    if (min > 0 && amount < min) {
      amount = min;
    }

    if (max > 0 && amount > max) {
      amount = max;
    }

    return this.round(Math.max(0, amount));
  }

  // ============================================================
  // LISTAR OBRIGAÇÕES
  // ============================================================

  async findAll(tenantId: string, referenceYear?: number) {
    // GET must be observational: no synchronization, no status mutation and
    // no payment backfill. The urgency state is derived below from the stored
    // snapshot and the current date.
    const where = this.whereForReferenceYear(tenantId, referenceYear);

    const obligations = await this.prisma.fiscalObligation.findMany({
      where,

      include: {
        fiscalCalendar: {
          include: {
            regimes: true,
          },
        },
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

    return Promise.all(
      obligations.map((obligation) =>
        this.withCalculationContext(tenantId, obligation),
      ),
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  async getDashboard(tenantId: string) {
    const obligations = await this.prisma.fiscalObligation.findMany({
      where: {
        tenantId,
      },

      include: {
        fiscalCalendar: {
          include: {
            regimes: true,
          },
        },
      },

      orderBy: {
        dueDate: 'asc',
      },
    });

    const presented = obligations.map((obligation) =>
      this.withObligationPresentation(obligation),
    );

    const total = presented.length;

    const pending = presented.filter(
      (item) =>
        item.status === ObligationStatus.FUTURE ||
        item.status === ObligationStatus.DUE_SOON ||
        item.status === ObligationStatus.IN_DEADLINE ||
        item.status === ObligationStatus.TO_DETERMINE,
    ).length;

    const paid = presented.filter(
      (item) => item.status === ObligationStatus.FULFILLED,
    ).length;

    const late = presented.filter(
      (item) => item.status === ObligationStatus.OVERDUE,
    ).length;

    const upcoming = presented
      .filter(
        (item) =>
          item.status === ObligationStatus.FUTURE ||
          item.status === ObligationStatus.DUE_SOON ||
          item.status === ObligationStatus.IN_DEADLINE,
      )
      .slice(0, 10);

    const overdue = presented
      .filter((item) => item.status === ObligationStatus.OVERDUE)
      .slice(0, 10);

    const totalAmount = presented.reduce(
      (sum, item) =>
        sum +
        (item.amount === null || item.amount === undefined
          ? 0
          : this.number(item.amount)),
      0,
    );

    const pendingAmount = presented
      .filter((item) => item.status !== ObligationStatus.FULFILLED)
      .reduce(
        (sum, item) =>
          sum +
          (item.amount === null || item.amount === undefined
            ? 0
            : this.number(item.amount)),
        0,
      );

    const paidAmount = presented
      .filter((item) => item.status === ObligationStatus.FULFILLED)
      .reduce(
        (sum, item) =>
          sum +
          (item.amount === null || item.amount === undefined
            ? 0
            : this.number(item.amount)),
        0,
      );

    return {
      total,

      pending,

      paid,

      late,

      totalAmount: this.round(totalAmount),

      pendingAmount: this.round(pendingAmount),

      paidAmount: this.round(paidAmount),

      undeterminedAmountCount: presented.filter(
        (item) => item.amountState === 'TO_DETERMINE',
      ).length,

      upcoming,

      overdue,

      source: {
        name: 'Calendário Fiscal AGT',

        official: true,
      },

      synchronizedAt: new Date(),
    };
  }

  // ============================================================
  // BUSCAR OBRIGAÇÃO
  // ============================================================

  async findOne(tenantId: string, id: string) {
    const obligation = await this.prisma.fiscalObligation.findFirst({
      where: {
        id,

        tenantId,
      },

      include: {
        fiscalCalendar: {
          include: {
            regimes: true,
          },
        },
      },
    });

    if (!obligation) {
      throw new NotFoundException('Obrigação fiscal não encontrada.');
    }

    return this.withCalculationContext(tenantId, obligation);
  }

  /** Read-only historical listing for reports: no synchronization or status writes. */
  async findAllReadOnly(tenantId: string, referenceYear?: number) {
    const where = this.whereForReferenceYear(tenantId, referenceYear);
    const obligations = await this.prisma.fiscalObligation.findMany({
      where,
      include: { fiscalCalendar: { include: { regimes: true } } },
      orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
    });
    return Promise.all(
      obligations.map((obligation) =>
        this.withCalculationContext(tenantId, obligation),
      ),
    );
  }

  /**
   * Exposes the calculation provenance without trusting an identifier supplied
   * by the client. Legacy obligations without an assessment stay reviewable
   * instead of being labelled as confirmed.
   */
  private async withCalculationContext(tenantId: string, obligation: any) {
    const taxType =
      obligation.fiscalCalendar?.taxType ??
      this.mapObligationTypeToTaxType(obligation.type);
    const year = Number(
      String(obligation.period ?? obligation.dueDate.getUTCFullYear()).slice(
        0,
        4,
      ),
    );

    if (!taxType || !Number.isInteger(year)) {
      return this.withObligationPresentation({
        ...obligation,
        calculation: {
          quality: 'REVIEW_REQUIRED',
          message:
            'Não existe regra fiscal estruturada para explicar este valor.',
        },
      });
    }

    const assessment = await this.prisma.taxAssessment.findFirst({
      where: {
        tenantId,
        taxType,
        year,
        period: obligation.period ?? undefined,
      },
      orderBy: { calculatedAt: 'desc' },
    });

    const hasPendingVat =
      taxType === TaxType.IVA
        ? (await this.prisma.taxTransaction.count({
            where: {
              tenantId,
              taxType: TaxType.IVA,
              period: obligation.period ?? undefined,
              sourceType: 'PURCHASE_INVOICE_IVA_SUPPORTED_PENDING_REVIEW',
            },
          })) > 0
        : false;

    const quality =
      taxType === TaxType.INDUSTRIAL
        ? 'REVIEW_REQUIRED'
        : !assessment || hasPendingVat
          ? 'REVIEW_REQUIRED'
          : 'CALCULATED';

    return this.withObligationPresentation({
      ...obligation,
      calculation: {
        quality,
        calculatedAt: assessment?.calculatedAt ?? null,
        calculationStatus: assessment?.calculationStatus ?? quality,
        period: assessment?.period ?? obligation.period ?? null,
        ruleVersion: assessment?.ruleVersion ?? null,
        snapshot: assessment?.calculationSnapshot ?? null,
        amounts: assessment
          ? {
              taxableAmount:
                assessment.taxableAmountValue ?? assessment.taxableAmount,
              taxDueAmount:
                assessment.taxDueAmountValue ?? assessment.taxDueAmount,
              deductibleAmount:
                assessment.deductibleAmountValue ?? assessment.deductibleAmount,
              withheldAmount:
                assessment.withheldAmountValue ?? assessment.withheldAmount,
              adjustmentsAmount:
                assessment.adjustmentsAmountValue ??
                assessment.adjustmentsAmount,
              finalAmount:
                assessment.finalAmountValue ?? assessment.finalAmount,
            }
          : null,
        origin: {
          taxType,
          calendarTitle: obligation.fiscalCalendar?.title ?? null,
          dueDate: obligation.dueDate,
        },
        rule: {
          reference:
            assessment?.legalReference ??
            obligation.fiscalCalendar?.officialReference ??
            null,
          source: obligation.fiscalCalendar?.source ?? null,
          sourceUrl:
            assessment?.officialSource ??
            obligation.fiscalCalendar?.sourceUrl ??
            null,
        },
        message:
          taxType === TaxType.INDUSTRIAL
            ? 'Valor por apurar: confirme a matéria colectável e a declaração aplicável junto da AGT.'
            : hasPendingVat
              ? 'Há IVA suportado indicado pendente de revisão; esse valor não foi deduzido.'
              : assessment
                ? 'Valor apurado a partir dos registos da empresa e da regra fiscal associada.'
                : 'Ainda não existe uma avaliação fiscal para este período.',
      },
    });
  }

  /**
   * Annual views are keyed to the fiscal calendar's reference year, not the
   * calendar year of a deadline. Historical rows pre-dating referenceYear use
   * their linked calendar, then a conservative period/due-date fallback.
   */
  private whereForReferenceYear(
    tenantId: string,
    referenceYear?: number,
  ): Prisma.FiscalObligationWhereInput {
    if (referenceYear === undefined) return { tenantId };

    const dueDate = {
      gte: new Date(`${referenceYear}-01-01T00:00:00.000Z`),
      lt: new Date(`${referenceYear + 1}-01-01T00:00:00.000Z`),
    };

    return {
      tenantId,
      OR: [
        { referenceYear },
        {
          referenceYear: null,
          fiscalCalendar: { is: { referenceYear } },
        },
        {
          referenceYear: null,
          fiscalCalendarId: null,
          period: { startsWith: `${referenceYear}-` },
        },
        {
          referenceYear: null,
          fiscalCalendarId: null,
          period: null,
          dueDate,
        },
      ],
    };
  }

  /**
   * Status is a read model. Stored PENDING/PAID/LATE remains an immutable
   * lifecycle snapshot, while urgency follows the current day without an
   * UPDATE during a GET request.
   */
  private withObligationPresentation<
    T extends {
      status: ObligationStatus;
      dueDate: Date;
      amount?: number | null;
      amountValue?: unknown;
      alertDaysBefore?: number | null;
    },
  >(obligation: T) {
    const lifecycleStatus = obligation.status;
    const amount =
      obligation.amount !== null && obligation.amount !== undefined
        ? this.number(obligation.amount)
        : obligation.amountValue !== null &&
            obligation.amountValue !== undefined
          ? this.number(obligation.amountValue)
          : null;

    let status: ObligationStatus;
    if (
      lifecycleStatus === ObligationStatus.PAID ||
      lifecycleStatus === ObligationStatus.FULFILLED
    ) {
      status = ObligationStatus.FULFILLED;
    } else if (lifecycleStatus === ObligationStatus.HISTORICAL_CONFIRMATION) {
      status = ObligationStatus.HISTORICAL_CONFIRMATION;
    } else if (
      amount === null ||
      lifecycleStatus === ObligationStatus.TO_DETERMINE
    ) {
      status = ObligationStatus.TO_DETERMINE;
    } else {
      const today = this.startOfDay(new Date());
      const dueDate = this.startOfDay(new Date(obligation.dueDate));
      const daysUntilDue = Math.round(
        (dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (daysUntilDue < 0) status = ObligationStatus.OVERDUE;
      else if (daysUntilDue === 0) status = ObligationStatus.IN_DEADLINE;
      else if (daysUntilDue <= Math.max(1, obligation.alertDaysBefore ?? 7)) {
        status = ObligationStatus.DUE_SOON;
      } else {
        status = ObligationStatus.FUTURE;
      }
    }

    return {
      ...obligation,
      lifecycleStatus,
      status,
      displayStatus: status,
      amountState:
        amount === null
          ? 'TO_DETERMINE'
          : amount === 0
            ? 'CALCULATED_ZERO'
            : 'CALCULATED',
      amountIsCalculatedZero: amount === 0,
    };
  }

  private startOfDay(value: Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  // ============================================================
  // MARCAR COMO PAGA
  // ============================================================

  async markAsPaid(tenantId: string, id: string) {
    const obligation = await this.findOne(tenantId, id);

    if (
      obligation.lifecycleStatus === ObligationStatus.PAID ||
      obligation.lifecycleStatus === ObligationStatus.FULFILLED
    ) {
      await this.ensureTaxPaymentForObligation(
        obligation.id,
        tenantId,
        obligation.amount,
        obligation.fiscalCalendar?.taxType ??
          this.mapObligationTypeToTaxType(obligation.type),
        obligation.period ?? undefined,
      );

      return this.findOne(tenantId, id);
    }

    const amount = this.number(obligation.amount);

    if (amount <= 0) {
      throw new BadRequestException(
        'Não é possível registar um pagamento para uma obrigação sem valor fiscal.',
      );
    }

    const taxType =
      obligation.fiscalCalendar?.taxType ??
      this.mapObligationTypeToTaxType(obligation.type);

    await this.prisma.$transaction(async (tx) => {
      await tx.fiscalObligation.update({
        where: {
          id: obligation.id,
        },

        data: {
          status: ObligationStatus.PAID,

          reminderSent: true,
        },
      });

      const reference = `OBL-${obligation.id}`;

      const existingPayment = await tx.taxPayment.findFirst({
        where: {
          tenantId,

          reference,
        },
      });

      if (!existingPayment) {
        await tx.taxPayment.create({
          data: {
            tenantId,

            taxType,

            amount,

            reference,

            paymentMethod: 'OBRIGAÇÃO FISCAL',

            paidAt: new Date(),
          },
        });
      }
    });

    this.logger.log(
      [
        'Pagamento registado',
        `Empresa: ${tenantId}`,
        `Obrigação: ${obligation.id}`,
        `Valor: ${amount}`,
        `Imposto: ${taxType}`,
      ].join(' | '),
    );

    return this.findOne(tenantId, id);
  }

  // ============================================================
  // RECONCILIAR OBRIGAÇÕES PAGAS
  // ============================================================

  private async backfillPaidObligations(tenantId: string): Promise<number> {
    const paidObligations = await this.prisma.fiscalObligation.findMany({
      where: {
        tenantId,

        status: ObligationStatus.PAID,
      },

      include: {
        fiscalCalendar: {
          select: {
            taxType: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });

    let created = 0;

    for (const obligation of paidObligations) {
      const reference = `OBL-${obligation.id}`;

      const existingPayment = await this.prisma.taxPayment.findFirst({
        where: {
          tenantId,

          reference,
        },

        select: {
          id: true,
        },
      });

      if (existingPayment) {
        continue;
      }

      const taxType =
        obligation.fiscalCalendar?.taxType ??
        this.mapObligationTypeToTaxType(obligation.type);

      const payment = await this.ensureTaxPaymentForObligation(
        obligation.id,
        tenantId,
        obligation.amount,
        taxType,
        obligation.period ?? undefined,
      );

      if (payment) {
        created++;
      }
    }

    return created;
  }

  // ============================================================
  // CRIAR TAX PAYMENT
  // ============================================================

  private async ensureTaxPaymentForObligation(
    obligationId: string,
    tenantId: string,
    amountValue: number | null | undefined,

    taxType: TaxType,

    period?: string,
  ) {
    const amount = this.number(amountValue);

    if (amount <= 0) {
      return null;
    }

    const reference = `OBL-${obligationId}`;

    const existing = await this.prisma.taxPayment.findFirst({
      where: {
        tenantId,

        reference,
      },
    });

    if (existing) {
      return existing;
    }

    void period;

    return this.prisma.taxPayment.create({
      data: {
        tenantId,

        taxType,

        amount,

        reference,

        paymentMethod: 'OBRIGAÇÃO FISCAL',

        paidAt: new Date(),
      },
    });
  }

  // ============================================================
  // MAPEAR OBRIGAÇÃO PARA TAX TYPE
  // ============================================================

  private mapObligationTypeToTaxType(type: ObligationType): TaxType {
    const map: Record<string, TaxType> = {
      IVA: TaxType.IVA,

      IRT: TaxType.IRT,

      II: TaxType.II,

      SS: TaxType.SS,

      IEC: TaxType.IEC,

      IAC: TaxType.IAC,

      IP: TaxType.IP,

      IVM: TaxType.IVM,

      IEJ: TaxType.IEJ,

      IS: TaxType.IS,

      CEOC: TaxType.CEOC,

      IRP: TaxType.IRP,

      RCN: TaxType.RCN,

      TS: TaxType.TS,

      CFQA: TaxType.CFQA,

      ITP: TaxType.ITP,

      IPP: TaxType.IPP,

      IVRM: TaxType.IVRM,

      TAXA_GAS: TaxType.TAXA_GAS,

      INDUSTRIAL: TaxType.INDUSTRIAL,

      SELO: TaxType.SELO,
    };

    return map[String(type).toUpperCase()] ?? TaxType.SELO;
  }

  // ============================================================
  // ACTUALIZAR ESTADOS
  // ============================================================

  async updateStatuses(tenantId?: string) {
    // Kept as a compatibility endpoint for older clients. Urgency is derived
    // when records are read, so this operation deliberately has no write side
    // effect and cannot convert historical PENDING rows into LATE rows.
    return {
      success: true,
      updated: 0,
      tenantId: tenantId ?? null,
      message: 'Os estados são calculados automaticamente na consulta.',
      calculatedAt: new Date(),
    };
  }

  // ============================================================
  // REMOVER
  // ============================================================

  async remove(tenantId: string, id: string) {
    const obligation = await this.findOne(tenantId, id);

    // Obligations are fiscal history, including unpaid and review-required
    // records. Do not silently remove either the obligation or its alerts.
    void obligation;
    throw new BadRequestException(
      'As obrigações registadas são mantidas no histórico e não podem ser removidas.',
    );
  }

  // ============================================================
  // REGIME GERAL
  // ============================================================

  private isGeneralRegime(regime: FiscalRegime): boolean {
    return String(regime).toUpperCase() === 'GERAL';
  }

  // ============================================================
  // REGIME SIMPLIFICADO
  // ============================================================

  private isSimplifiedRegime(regime: FiscalRegime): boolean {
    return String(regime).toUpperCase().includes('SIMPLIFICADO');
  }

  // ============================================================
  // NORMALIZAR TEXTO
  // ============================================================

  private normalizeFiscalText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[—–−]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // ============================================================
  // CONVERTER PARA NUMBER
  // ============================================================

  private number(value: any): number {
    const result = Number(value);

    return Number.isFinite(result) ? result : 0;
  }

  // ============================================================
  // ARREDONDAMENTO
  // ============================================================

  private round(value: number): number {
    return Math.round((this.number(value) + Number.EPSILON) * 100) / 100;
  }
}
