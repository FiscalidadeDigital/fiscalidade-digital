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

@Injectable()
export class ObligationsService {
  private readonly logger =
    new Logger(ObligationsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================
  // SINCRONIZAR TODAS AS EMPRESAS
  // ============================================================

  async syncAllCompanies() {
    const tenants =
      await this.prisma.tenant.findMany({
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
        const result =
          await this.syncCompany(
            tenant.id,
          );

        created += Number(
          result.created || 0,
        );

        updated += Number(
          result.updated || 0,
        );

        late += Number(
          result.late || 0,
        );

        backfilledPayments +=
          Number(
            result.backfilledPayments ||
              0,
          );
      } catch (error) {
        this.logger.error(
          [
            'Erro ao sincronizar empresa.',
            `Empresa: ${tenant.name}`,
            `ID: ${tenant.id}`,
            error instanceof Error
              ? error.message
              : String(error),
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
    return this.syncCompany(
      tenantId,
    );
  }

  // ============================================================
  // SINCRONIZAR EMPRESA
  // ============================================================

  async syncCompany(
    tenantId: string,
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
          sector: true,
          companyType: true,
          retentionRate: true,
          status: true,
          createdAt: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    const now = new Date();

    const currentYear =
      now.getFullYear();

    const companyCreationDate =
      tenant.createdAt > now
        ? now
        : tenant.createdAt;

    const existingObligationCount =
      await this.prisma.fiscalObligation.count({
        where: {
          tenantId,
        },
      });

    const isFirstSynchronization =
      existingObligationCount === 0;

    /*
     * Primeira sincronização:
     * não criar obrigações já vencidas.
     *
     * Sincronizações seguintes:
     * reconciliar desde a criação da empresa.
     */

    const minimumDueDate =
      isFirstSynchronization
        ? now
        : companyCreationDate;

    // ==========================================================
    // CALENDÁRIO FISCAL
    // ==========================================================

    const rawCalendarRules =
      await this.prisma.fiscalCalendar.findMany({
        where: {
          active: true,

          referenceYear:
            currentYear,

          regimes: {
            some: {
              regime:
                tenant.regime,
            },
          },

          dueDate: {
            gte:
              minimumDueDate,
          },
        },

        include: {
          regimes: true,
        },

        orderBy: {
          dueDate: 'asc',
        },
      });

    const calendarRules =
      rawCalendarRules.filter(
        (rule) =>
          this.isCalendarRuleApplicable(
            rule,
            tenant.regime,
          ),
      );

    let created = 0;
    let updated = 0;
    let late = 0;

    // ==========================================================
    // PROCESSAR REGRAS
    // ==========================================================

    for (const rule of calendarRules) {
      const period =
        rule.period ||
        String(
          rule.referenceYear ||
            currentYear,
        );

      let existing =
        await this.prisma.fiscalObligation.findFirst({
          where: {
            tenantId,

            fiscalCalendarId:
              rule.id,

            period,
          },
        });

      // --------------------------------------------------------
      // COMPATIBILIDADE COM OBRIGAÇÕES ANTIGAS
      // --------------------------------------------------------

      if (!existing) {
        existing =
          await this.prisma.fiscalObligation.findFirst({
            where: {
              tenantId,

              period,

              type:
                rule.obligationType,

              dueDate:
                rule.dueDate,
            },

            orderBy: {
              createdAt:
                'asc',
            },
          });
      }

      // --------------------------------------------------------
      // CALCULAR VALOR
      // --------------------------------------------------------

      const calculatedAmount =
        await this.calculateObligationAmount(
          tenant,
          rule.obligationType,
          rule.taxType,
          rule.title,
          rule.description,
          rule.dueDate,
          period,
        );

      const existingAmount =
        existing
          ? this.number(
              existing.amount,
            )
          : 0;

      let finalAmount =
        calculatedAmount === null
          ? existingAmount
          : this.number(
              calculatedAmount,
            );

      /*
       * Quando a fonte operacional determina
       * que o valor é realmente zero,
       * não manter um valor antigo artificial.
       */

      if (
        calculatedAmount === 0 &&
        existingAmount > 0 &&
        !this.hasReliableZeroSource(
          rule.obligationType,
          rule.taxType,
          rule.title,
          rule.description,
        )
      ) {
        finalAmount =
          existingAmount;
      }

      finalAmount =
        this.round(
          Math.max(
            0,
            finalAmount,
          ),
        );

      // ========================================================
      // OBRIGAÇÃO EXISTENTE
      // ========================================================

      if (existing) {
        /*
         * Nunca recalcular uma obrigação já paga.
         */

        if (
          existing.status ===
          ObligationStatus.PAID
        ) {
          await this.ensureTaxPaymentForObligation(
            existing.id,
            tenant.id,
            existing.amount,
            rule.taxType ??
              this.mapObligationTypeToTaxType(
                existing.type,
              ),
            existing.period ||
              period,
          );

          continue;
        }

        const isLate =
          rule.dueDate <
          now;

        const nextStatus =
          isLate
            ? ObligationStatus.LATE
            : ObligationStatus.PENDING;

        await this.prisma.fiscalObligation.update({
          where: {
            id:
              existing.id,
          },

          data: {
            fiscalCalendarId:
              rule.id,

            title:
              rule.title,

            description:
              rule.description,

            type:
              rule.obligationType,

            dueDate:
              rule.dueDate,

            period,

            amount:
              finalAmount,

            status:
              nextStatus,

            alertEnabled:
              true,

            alertDaysBefore:
              7,
          },
        });

        updated++;

        if (isLate) {
          late++;
        }

        continue;
      }

      // ========================================================
      // NOVA OBRIGAÇÃO
      // ========================================================

      const isLate =
        rule.dueDate <
        now;

      const status =
        isLate
          ? ObligationStatus.LATE
          : ObligationStatus.PENDING;

      await this.prisma.fiscalObligation.create({
        data: {
          tenantId:
            tenant.id,

          fiscalCalendarId:
            rule.id,

          type:
            rule.obligationType,

          title:
            rule.title,

          description:
            rule.description,

          amount:
            finalAmount,

          dueDate:
            rule.dueDate,

          period,

          status,

          alertEnabled:
            true,

          alertDaysBefore:
            7,

          reminderSent:
            false,
        },
      });

      created++;

      if (isLate) {
        late++;
      }
    }

    // ==========================================================
    // ACTUALIZAR ESTADOS
    // ==========================================================

    const statusResult =
      await this.updateStatuses(
        tenant.id,
      );

    late = Math.max(
      late,
      Number(
        statusResult.updated ||
          0,
      ),
    );

    // ==========================================================
    // RECONCILIAR PAGAMENTOS
    // ==========================================================

    const backfilledPayments =
      await this.backfillPaidObligations(
        tenant.id,
      );

    this.logger.log(
      [
        `Empresa: ${tenant.name}`,
        `NIF: ${tenant.nif}`,
        `Regime: ${tenant.regime}`,
        `Ano: ${currentYear}`,
        `Primeira sincronização: ${
          isFirstSynchronization
            ? 'SIM'
            : 'NÃO'
        }`,
        `Regras elegíveis: ${calendarRules.length}`,
        `Regras ignoradas: ${
          rawCalendarRules.length -
          calendarRules.length
        }`,
        `Criadas: ${created}`,
        `Actualizadas: ${updated}`,
        `Atrasadas: ${late}`,
        `Pagamentos reconciliados: ${backfilledPayments}`,
      ].join(' | '),
    );

    return {
      success: true,

      tenant: {
        id:
          tenant.id,

        name:
          tenant.name,

        nif:
          tenant.nif,

        regime:
          tenant.regime,
      },

      year:
        currentYear,

      firstSynchronization:
        isFirstSynchronization,

      existingObligationCount,

      minimumDueDate,

      calendarRules:
        calendarRules.length,

      ignoredCalendarRules:
        rawCalendarRules.length -
        calendarRules.length,

      created,

      updated,

      late,

      backfilledPayments,

      synchronizedAt:
        new Date(),
    };
  }

  // ============================================================
  // VALIDAR REGRA DO CALENDÁRIO
  // ============================================================

  private isCalendarRuleApplicable(
    rule: {
      title: string;
      description: string | null;
      taxType: TaxType;
      obligationType: ObligationType;
    },

    regime: FiscalRegime,
  ): boolean {
    const text =
      this.normalizeFiscalText(
        `${rule.title ?? ''} ${
          rule.description ?? ''
        }`,
      );

    const isGeneral =
      this.isGeneralRegime(
        regime,
      );

    const isSimplified =
      this.isSimplifiedRegime(
        regime,
      );

    // ==========================================================
    // GERAL
    // ==========================================================

    if (isGeneral) {
      /*
       * Uma empresa do regime geral não recebe
       * obrigações específicas do IVA Simplificado.
       */

      if (
        text.includes(
          'iva simplificado',
        )
      ) {
        return false;
      }

      if (
        text.includes(
          'regime simplificado',
        ) &&
        text.includes('iva')
      ) {
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

      if (
        text.includes(
          'iva regime geral',
        )
      ) {
        return false;
      }

      if (
        text.includes(
          'regime geral',
        ) &&
        text.includes('iva')
      ) {
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

    obligationType:
      ObligationType,

    taxType:
      TaxType,

    title:
      string,

    description:
      string | null,

    dueDate:
      Date,

    period:
      string,
  ): Promise<number | null> {
    const dueYear =
      dueDate.getFullYear();

    const dueMonth =
      dueDate.getMonth() + 1;

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

    const parsedPeriod =
      this.parseFiscalPeriod(
        period,
        dueYear,
      );

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
      taxType === TaxType.IVA &&
      this.isGeneralRegime(tenant.regime);

    const referenceMonth =
      isGeneralIva
        ? (
            dueMonth === 1
              ? 12
              : dueMonth - 1
          )
        : (
            parsedPeriod?.month ??
            (
              dueMonth === 1
                ? 12
                : dueMonth - 1
            )
          );

    const referenceYear =
      isGeneralIva
        ? (
            dueMonth === 1
              ? dueYear - 1
              : dueYear
          )
        : (
            parsedPeriod?.year ??
            (
              dueMonth === 1
                ? dueYear - 1
                : dueYear
            )
          );

    const start =
      new Date(
        referenceYear,
        referenceMonth - 1,
        1,
      );

    const end =
      new Date(
        referenceYear,
        referenceMonth,
        1,
      );

    const ruleText =
      this.normalizeFiscalText(
        `${title ?? ''} ${
          description ?? ''
        }`,
      );

    // ==========================================================
    // SAF-T
    // ==========================================================

    if (
      ruleText.includes('saft') ||
      ruleText.includes('saf-t')
    ) {
      return 0;
    }

    // ==========================================================
    // IRT
    // ==========================================================

    if (
      taxType ===
      TaxType.IRT
    ) {
      const isGroupA =
        ruleText.includes(
          'grupo a',
        );

      const isGroupBC =
        ruleText.includes(
          'grupos b e c',
        ) ||
        ruleText.includes(
          'grupo b',
        ) ||
        ruleText.includes(
          'grupo c',
        );

      /*
       * Grupo B/C não deve utilizar a folha
       * de salários dos trabalhadores.
       */

      if (
        isGroupBC &&
        !isGroupA
      ) {
        return 0;
      }

      /*
       * Grupo A:
       * fonte oficial interna = Payroll.
       */

      if (
        isGroupA
      ) {
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

    if (
      taxType ===
      TaxType.SS
    ) {
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

    if (
      taxType === TaxType.IVA ||
      obligationType === ObligationType.IVA
    ) {
      // ========================================================
      // IVA REGIME GERAL
      // ========================================================

      if (
        this.isGeneralRegime(
          tenant.regime,
        )
      ) {
        if (
          ruleText.includes(
            'iva simplificado',
          ) ||
          (
            ruleText.includes(
              'regime simplificado',
            ) &&
            ruleText.includes(
              'iva',
            )
          )
        ) {
          return 0;
        }

        /*
         * Regime Geral:
         * o IVA é apurado pelo período da operação,
         * independentemente de a factura já estar paga.
         */
        const invoices =
          await this.prisma.invoice.findMany({
            where: {
              tenantId:
                tenant.id,

              issuedAt: {
                gte:
                  start,

                lt:
                  end,
              },

              status: {
                not:
                  'CANCELLED',
              },
            },

            select: {
              iva:
                true,
            },
          });

        const ivaLiquidado =
          invoices.reduce(
            (
              sum,
              invoice,
            ) =>
              sum +
              this.number(
                invoice.iva,
              ),
            0,
          );

        const purchases =
          await this.prisma.purchaseInvoice.findMany({
            where: {
              tenantId:
                tenant.id,

              issuedAt: {
                gte:
                  start,

                lt:
                  end,
              },

              status: {
                not:
                  'CANCELLED',
              },
            },

            select: {
              iva:
                true,
            },
          });

        const ivaDedutivel =
          purchases.reduce(
            (
              sum,
              purchase,
            ) =>
              sum +
              this.number(
                purchase.iva,
              ),
            0,
          );

        /*
         * IVA a entregar:
         *
         * IVA liquidado
         * -
         * IVA dedutível
         */

        return this.round(
          Math.max(
            0,
            ivaLiquidado -
              ivaDedutivel,
          ),
        );
      }

      // ========================================================
      // IVA REGIME SIMPLIFICADO
      // ========================================================

      if (
        this.isSimplifiedRegime(
          tenant.regime,
        )
      ) {
        return this.calculateSimplifiedVat(
          tenant.id,
          referenceYear,
          referenceMonth,
        );
      }

      return 0;
    }

    // ==========================================================
    // RETENÇÃO
    // ==========================================================

    if (
      obligationType ===
      ObligationType.RETENCAO
    ) {
      const invoices =
        await this.prisma.invoice.findMany({
          where: {
            tenantId:
              tenant.id,

            issuedAt: {
              gte:
                start,

              lt:
                end,
            },

            status: {
              not:
                'CANCELLED',
            },
          },

          select: {
            withholdingTax:
              true,
          },
        });

      const amount =
        invoices.reduce(
          (
            sum,
            invoice,
          ) =>
            sum +
            this.number(
              invoice.withholdingTax,
            ),
          0,
        );

      return this.round(
        amount,
      );
    }

    // ==========================================================
    // IMPOSTO INDUSTRIAL
    // ==========================================================

    if (
      taxType ===
      TaxType.INDUSTRIAL
    ) {
      /*
       * Se o motor fiscal já produziu uma avaliação,
       * damos prioridade ao TaxAssessment.
       */

      const assessment =
        await this.findAssessment(
          tenant.id,
          TaxType.INDUSTRIAL,
          period,
          referenceYear,
        );

      if (
        assessment
      ) {
        return this.round(
          Math.max(
            0,
            this.number(
              assessment.finalAmount,
            ),
          ),
        );
      }

      /*
       * Pagamento provisório do II:
       *
       * 2% das vendas dos primeiros
       * seis meses.
       *
       * A obrigação de pagamento provisório
       * é normalmente associada ao mês de Agosto.
       */

      if (
        dueMonth === 8 ||
        ruleText.includes(
          'industrial provisorio',
        ) ||
        ruleText.includes(
          'industrial provisório',
        )
      ) {
        return this.calculateIndustrialProvisional(
          tenant.id,
          referenceYear,
        );
      }

      /*
       * Não inventar imposto industrial definitivo
       * com base apenas no volume de facturação.
       *
       * O definitivo deve vir de declaração,
       * assessment ou regra fiscal específica.
       */

      return 0;
    }

    // ==========================================================
    // TAX ASSESSMENT
    // ==========================================================

    const assessment =
      await this.findAssessment(
        tenant.id,
        taxType,
        period,
        referenceYear,
      );

    if (
      assessment
    ) {
      return this.round(
        Math.max(
          0,
          this.number(
            assessment.finalAmount,
          ),
        ),
      );
    }

    // ==========================================================
    // TAX DECLARATION
    // ==========================================================

    const declarationAmount =
      await this.getDeclarationAmount(
        tenant.id,
        taxType,
        period,
        referenceYear,
        referenceMonth,
      );

    if (
      declarationAmount !==
      null
    ) {
      return this.round(
        Math.max(
          0,
          declarationAmount,
        ),
      );
    }

    // ==========================================================
    // TAX RULE
    // ==========================================================

    const taxRule =
      await this.findTaxRule(
        tenant,
        taxType,
        TaxRuleOperation.OTHER,
      );

    if (
      taxRule
    ) {
      const revenues =
        await this.prisma.revenue.findMany({
          where: {
            tenantId:
              tenant.id,

            year:
              referenceYear,

            month:
              referenceMonth,
          },

          select: {
            amount:
              true,
          },
        });

      const base =
        revenues.reduce(
          (
            sum,
            revenue,
          ) =>
            sum +
            this.number(
              revenue.amount,
            ),
          0,
        );

      if (
        base > 0
      ) {
        return this.applyTaxRule(
          base,
          taxRule,
        );
      }
    }

    return 0;
  }

  // ============================================================
  // IVA SIMPLIFICADO
  // ============================================================

  private async calculateSimplifiedVat(
    tenantId: string,
    referenceYear: number,
    referenceMonth: number,
  ): Promise<number> {
    /*
     * REGIME SIMPLIFICADO DO IVA — ANGOLA
     *
     * Regra usada pelo motor:
     * - apuramento mensal;
     * - 7% sobre o volume de negócios efectivamente recebido;
     * - operações não isentas;
     * - dedução de 7% do IVA suportado apenas quando existir
     *   suporte/documentação para essa dedução.
     *
     * O Calendário Fiscal AGT 2026 tem uma obrigação mensal
     * para o Regime Simplificado.
     *
     * A tabela Invoice não possui actualmente um campo paidAt.
     * Por isso, não é possível determinar com precisão a data real
     * do recebimento apenas com o schema actual.
     *
     * Enquanto o campo paidAt não existir, usamos issuedAt como
     * referência operacional do mês da factura e exigimos status PAID.
     * Isto evita consultar um campo inexistente no Prisma e mantém
     * o cálculo mensal consistente com os dados actualmente disponíveis.
     */

    const start =
      new Date(
        referenceYear,
        referenceMonth - 1,
        1,
      );

    const end =
      new Date(
        referenceYear,
        referenceMonth,
        1,
      );

    const invoices =
      await this.prisma.invoice.findMany({
        where: {
          tenantId,

          status:
            'PAID',

          issuedAt: {
            gte:
              start,

            lt:
              end,
          },
        },

        select: {
          subtotal:
            true,
        },
      });

    const received =
      invoices.reduce(
        (
          sum,
          invoice,
        ) =>
          sum +
          this.number(
            invoice.subtotal,
          ),
        0,
      );

    if (
      received <= 0
    ) {
      return 0;
    }

    /*
     * A dedução de 7% do IVA suportado não é aplicada
     * automaticamente aqui, porque o modelo actual não possui
     * um indicador de submissão/validação do Mapa de Fornecedores.
     *
     * Quando esse suporte existir, a dedução deve ser:
     *
     *   7% × IVA suportado elegível
     *
     * e não 100% do IVA da compra.
     */

    return this.round(
      received *
        0.07,
    );
  }

  // ============================================================
  // INDUSTRIAL PROVISÓRIO
  // ============================================================

  private async calculateIndustrialProvisional(
    tenantId: string,
    year: number,
  ): Promise<number> {
    /*
     * Preferimos vendas reais registadas
     * por facturas.
     */

    const invoices =
      await this.prisma.invoice.findMany({
        where: {
          tenantId,

          issuedAt: {
            gte:
              new Date(
                year,
                0,
                1,
              ),

            lt:
              new Date(
                year,
                6,
                1,
              ),
          },

          status: {
            not:
              'CANCELLED',
          },

          /*
           * Não incluir operações
           * que já tenham retenção.
           */
          withholdingTax: {
            lte:
              0,
          },
        },

        select: {
          subtotal:
            true,
        },
      });

    let base =
      invoices.reduce(
        (
          sum,
          invoice,
        ) =>
          sum +
          this.number(
            invoice.subtotal,
          ),
        0,
      );

    /*
     * Caso ainda não existam facturas,
     * utilizamos receitas registadas manualmente.
     */

    if (
      base <= 0
    ) {
      const revenues =
        await this.prisma.revenue.findMany({
          where: {
            tenantId,

            year,

            month: {
              gte:
                1,

              lte:
                6,
            },
          },

          select: {
            amount:
              true,
          },
        });

      base =
        revenues.reduce(
          (
            sum,
            revenue,
          ) =>
            sum +
            this.number(
              revenue.amount,
            ),
          0,
        );
    }

    if (
      base <= 0
    ) {
      return 0;
    }

    return this.round(
      base *
        0.02,
    );
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
          updatedAt:
            'desc',
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
    const candidates =
      this.buildPeriodCandidates(
        period,
        year,
        month,
      );

    const declarations =
      await this.prisma.taxDeclaration.findMany({
        where: {
          tenantId,

          taxType,

          period: {
            in:
              candidates,
          },
        },

        orderBy: {
          declarationDate:
            'desc',
        },

        take:
          10,
      });

    if (
      declarations.length ===
      0
    ) {
      return null;
    }

    const declaration =
      declarations[0];

    const declared =
      this.number(
        declaration.declaredAmount,
      );

    const paid =
      this.number(
        declaration.paidAmount,
      );

    return this.round(
      Math.max(
        0,
        declared -
          paid,
      ),
    );
  }

  // ============================================================
  // PERÍODOS
  // ============================================================

  private buildPeriodCandidates(
    period: string,
    year: number,
    month: number,
  ): string[] {
    const values =
      new Set<string>();

    const raw =
      String(
        period || '',
      ).trim();

    if (
      raw
    ) {
      values.add(
        raw,
      );
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

    const monthName =
      months[
        month - 1
      ];

    if (
      monthName
    ) {
      values.add(
        monthName,
      );

      values.add(
        monthName.toLowerCase(),
      );

      values.add(
        `${monthName}/${year}`,
      );

      values.add(
        `${monthName} ${year}`,
      );

      values.add(
        `${String(
          month,
        ).padStart(
          2,
          '0',
        )}/${year}`,
      );

      values.add(
        `${year}-${String(
          month,
        ).padStart(
          2,
          '0',
        )}`,
      );
    }

    values.add(
      String(year),
    );

    return Array.from(
      values,
    );
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
    const raw =
      String(
        period ?? '',
      ).trim();

    if (!raw) {
      return null;
    }

    const normalized =
      this.normalizeFiscalText(
        raw,
      );

    const monthNames: Record<
      string,
      number
    > = {
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

    for (
      const [monthName, month] of
        Object.entries(
          monthNames,
        )
    ) {
      if (
        normalized === monthName ||
        normalized.startsWith(
          `${monthName}/`,
        ) ||
        normalized.startsWith(
          `${monthName} `,
        )
      ) {
        const yearMatch =
          normalized.match(
            /(19|20)\\d{2}/,
          );

        return {
          month,
          year: yearMatch
            ? Number(
                yearMatch[0],
              )
            : fallbackYear,
        };
      }
    }

    let match =
      normalized.match(
        /^(\\d{4})[-/]([01]\\d)$/,
      );

    if (match) {
      const year =
        Number(
          match[1],
        );

      const month =
        Number(
          match[2],
        );

      if (
        month >= 1 &&
        month <= 12
      ) {
        return {
          month,
          year,
        };
      }
    }

    match =
      normalized.match(
        /^([01]\\d)[-/](\\d{4})$/,
      );

    if (match) {
      const month =
        Number(
          match[1],
        );

      const year =
        Number(
          match[2],
        );

      if (
        month >= 1 &&
        month <= 12
      ) {
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
    obligationType:
      ObligationType,

    taxType:
      TaxType,

    title:
      string,

    description:
      string | null,
  ): boolean {
    const text =
      this.normalizeFiscalText(
        `${title ?? ''} ${
          description ?? ''
        }`,
      );

    if (
      text.includes('saft') ||
      text.includes('saf-t')
    ) {
      return true;
    }

    if (
      taxType ===
        TaxType.IVA ||
      obligationType ===
        ObligationType.IVA
    ) {
      return true;
    }

    if (
      taxType ===
        TaxType.IRT ||
      obligationType ===
        ObligationType.IRT
    ) {
      return true;
    }

    if (
      taxType ===
        TaxType.SS ||
      obligationType ===
        ObligationType.SS
    ) {
      return true;
    }

    if (
      obligationType ===
      ObligationType.RETENCAO
    ) {
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
    type:
      | 'IRT'
      | 'SS',
  ): Promise<number> {
    const payrolls =
      await this.prisma.payroll.findMany({
        where: {
          tenantId,

          year,

          month,

          status: {
            not:
              'DRAFT',
          },
        },

        orderBy: [
          {
            processedAt:
              'desc',
          },

          {
            updatedAt:
              'desc',
          },

          {
            createdAt:
              'desc',
          },
        ],

        select: {
          irtAmount:
            true,

          socialSecurityAmount:
            true,
        },
      });

    if (
      payrolls.length ===
      0
    ) {
      return 0;
    }

    const payroll =
      payrolls[0];

    if (
      type === 'IRT'
    ) {
      return this.round(
        this.number(
          payroll.irtAmount,
        ),
      );
    }

    return this.round(
      this.number(
        payroll.socialSecurityAmount,
      ),
    );
  }

  // ============================================================
  // TAX RULES
  // ============================================================

  private async getTaxRules(
    _tenantId: string,
  ): Promise<any[]> {
    try {
      /*
       * TaxRule NÃO possui tenantId no schema Prisma.
       *
       * Portanto as regras são globais e depois
       * filtradas por regime/operação/sector/tipo
       * de empresa.
       */

      const rules =
        await this.prisma.taxRule.findMany({
          where: {
            active:
              true,
          },
        });

      return rules;
    } catch (error) {
      this.logger.warn(
        [
          'Não foi possível carregar TaxRules.',
          error instanceof Error
            ? error.message
            : String(error),
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
      regime: FiscalRegime;
      sector: string | null;
      companyType: string | null;
    },

    taxType:
      TaxType,

    operation:
      TaxRuleOperation,
  ): Promise<any | null> {
    const rules =
      await this.getTaxRules(
        tenant.id,
      );

    const now =
      new Date();

    const candidates =
      rules.filter(
        (rule) => {
          if (
            rule.taxType !==
            taxType
          ) {
            return false;
          }

          if (
            rule.regime &&
            rule.regime !==
              tenant.regime
          ) {
            return false;
          }

          if (
            rule.operation &&
            rule.operation !==
              operation
          ) {
            return false;
          }

          if (
            rule.sector &&
            rule.sector !==
              tenant.sector
          ) {
            return false;
          }

          if (
            rule.companyType &&
            rule.companyType !==
              tenant.companyType
          ) {
            return false;
          }

          if (
            rule.validFrom &&
            new Date(
              rule.validFrom,
            ) > now
          ) {
            return false;
          }

          if (
            rule.validTo &&
            new Date(
              rule.validTo,
            ) < now
          ) {
            return false;
          }

          return true;
        },
      );

    if (
      candidates.length ===
      0
    ) {
      return null;
    }

    return candidates.sort(
      (a, b) =>
        this.taxRuleSpecificity(
          b,
        ) -
        this.taxRuleSpecificity(
          a,
        ),
    )[0];
  }

  // ============================================================
  // ESPECIFICIDADE DA REGRA
  // ============================================================

  private taxRuleSpecificity(
    rule: any,
  ): number {
    let score = 0;

    if (
      rule.regime
    ) {
      score += 30;
    }

    if (
      rule.operation
    ) {
      score += 20;
    }

    if (
      rule.sector
    ) {
      score += 10;
    }

    if (
      rule.companyType
    ) {
      score += 10;
    }

    return score;
  }

  // ============================================================
  // APLICAR TAX RULE
  // ============================================================

  private applyTaxRule(
    base: number,
    rule: any,
  ): number {
    const safeBase =
      Math.max(
        0,
        this.number(
          base,
        ),
      );

    const rate =
      this.number(
        rule.rate,
      );

    const fixedAmount =
      this.number(
        rule.fixedAmount,
      );

    let amount =
      fixedAmount > 0
        ? fixedAmount
        : safeBase *
          rate;

    const min =
      this.number(
        rule.minAmount,
      );

    const max =
      this.number(
        rule.maxAmount,
      );

    if (
      min > 0 &&
      amount < min
    ) {
      amount =
        min;
    }

    if (
      max > 0 &&
      amount > max
    ) {
      amount =
        max;
    }

    return this.round(
      Math.max(
        0,
        amount,
      ),
    );
  }

  // ============================================================
  // LISTAR OBRIGAÇÕES
  // ============================================================

  async findAll(
    tenantId: string,
    referenceYear?: number,
  ) {
    await this.syncCompany(
      tenantId,
    );

    await this.updateStatuses(
      tenantId,
    );

    const where:
      Prisma.FiscalObligationWhereInput =
      {
        tenantId,
      };

    if (
      referenceYear
    ) {
      where.dueDate = {
        gte:
          new Date(
            `${referenceYear}-01-01T00:00:00`,
          ),

        lt:
          new Date(
            `${referenceYear + 1}-01-01T00:00:00`,
          ),
      };
    }

    return this.prisma.fiscalObligation.findMany({
      where,

      include: {
        fiscalCalendar: {
          include: {
            regimes:
              true,
          },
        },
      },

      orderBy: [
        {
          dueDate:
            'asc',
        },

        {
          title:
            'asc',
        },
      ],
    });
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  async getDashboard(
    tenantId: string,
  ) {
    await this.syncCompany(
      tenantId,
    );

    await this.updateStatuses(
      tenantId,
    );

    const obligations =
      await this.prisma.fiscalObligation.findMany({
        where: {
          tenantId,
        },

        include: {
          fiscalCalendar: {
            include: {
              regimes:
                true,
            },
          },
        },

        orderBy: {
          dueDate:
            'asc',
        },
      });

    const now =
      new Date();

    const total =
      obligations.length;

    const pending =
      obligations.filter(
        (item) =>
          item.status ===
          ObligationStatus.PENDING,
      ).length;

    const paid =
      obligations.filter(
        (item) =>
          item.status ===
          ObligationStatus.PAID,
      ).length;

    const late =
      obligations.filter(
        (item) =>
          item.status ===
            ObligationStatus.LATE ||
          (
            item.status ===
              ObligationStatus.PENDING &&
            item.dueDate <
              now
          ),
      ).length;

    const upcoming =
      obligations
        .filter(
          (item) =>
            item.status !==
              ObligationStatus.PAID &&
            item.dueDate >=
              now,
        )
        .slice(
          0,
          10,
        );

    const overdue =
      obligations
        .filter(
          (item) =>
            item.status ===
              ObligationStatus.LATE ||
            (
              item.status ===
                ObligationStatus.PENDING &&
              item.dueDate <
                now
            ),
        )
        .slice(
          0,
          10,
        );

    const totalAmount =
      obligations.reduce(
        (
          sum,
          item,
        ) =>
          sum +
          this.number(
            item.amount,
          ),
        0,
      );

    const pendingAmount =
      obligations
        .filter(
          (item) =>
            item.status !==
            ObligationStatus.PAID,
        )
        .reduce(
          (
            sum,
            item,
          ) =>
            sum +
            this.number(
              item.amount,
            ),
          0,
        );

    const paidAmount =
      obligations
        .filter(
          (item) =>
            item.status ===
            ObligationStatus.PAID,
        )
        .reduce(
          (
            sum,
            item,
          ) =>
            sum +
            this.number(
              item.amount,
            ),
          0,
        );

    return {
      total,

      pending,

      paid,

      late,

      totalAmount:
        this.round(
          totalAmount,
        ),

      pendingAmount:
        this.round(
          pendingAmount,
        ),

      paidAmount:
        this.round(
          paidAmount,
        ),

      upcoming,

      overdue,

      source: {
        name:
          'Calendário Fiscal AGT',

        official:
          true,
      },

      synchronizedAt:
        new Date(),
    };
  }

  // ============================================================
  // BUSCAR OBRIGAÇÃO
  // ============================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const obligation =
      await this.prisma.fiscalObligation.findFirst({
        where: {
          id,

          tenantId,
        },

        include: {
          fiscalCalendar: {
            include: {
              regimes:
                true,
            },
          },
        },
      });

    if (!obligation) {
      throw new NotFoundException(
        'Obrigação fiscal não encontrada.',
      );
    }

    return obligation;
  }

  // ============================================================
  // MARCAR COMO PAGA
  // ============================================================

  async markAsPaid(
    tenantId: string,
    id: string,
  ) {
    const obligation =
      await this.findOne(
        tenantId,
        id,
      );

    if (
      obligation.status ===
      ObligationStatus.PAID
    ) {
      await this.ensureTaxPaymentForObligation(
        obligation.id,
        tenantId,
        obligation.amount,
        obligation.fiscalCalendar?.taxType ??
          this.mapObligationTypeToTaxType(
            obligation.type,
          ),
        obligation.period ??
          undefined,
      );

      return this.findOne(
        tenantId,
        id,
      );
    }

    const amount =
      this.number(
        obligation.amount,
      );

    if (
      amount <= 0
    ) {
      throw new BadRequestException(
        'Não é possível registar um pagamento para uma obrigação sem valor fiscal.',
      );
    }

    const taxType =
      obligation.fiscalCalendar?.taxType ??
      this.mapObligationTypeToTaxType(
        obligation.type,
      );

    await this.prisma.$transaction(
      async (tx) => {
        await tx.fiscalObligation.update({
          where: {
            id:
              obligation.id,
          },

          data: {
            status:
              ObligationStatus.PAID,

            reminderSent:
              true,
          },
        });

        const reference =
          `OBL-${obligation.id}`;

        const existingPayment =
          await tx.taxPayment.findFirst({
            where: {
              tenantId,

              reference,
            },
          });

        if (
          !existingPayment
        ) {
          await tx.taxPayment.create({
            data: {
              tenantId,

              taxType,

              amount,

              reference,

              paymentMethod:
                'OBRIGAÇÃO FISCAL',

              paidAt:
                new Date(),
            },
          });
        }
      },
    );

    this.logger.log(
      [
        'Pagamento registado',
        `Empresa: ${tenantId}`,
        `Obrigação: ${obligation.id}`,
        `Valor: ${amount}`,
        `Imposto: ${taxType}`,
      ].join(' | '),
    );

    return this.findOne(
      tenantId,
      id,
    );
  }

  // ============================================================
  // RECONCILIAR OBRIGAÇÕES PAGAS
  // ============================================================

  private async backfillPaidObligations(
    tenantId: string,
  ): Promise<number> {
    const paidObligations =
      await this.prisma.fiscalObligation.findMany({
        where: {
          tenantId,

          status:
            ObligationStatus.PAID,
        },

        include: {
          fiscalCalendar: {
            select: {
              taxType:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            'asc',
        },
      });

    let created = 0;

    for (
      const obligation of
        paidObligations
    ) {
      const reference =
        `OBL-${obligation.id}`;

      const existingPayment =
        await this.prisma.taxPayment.findFirst({
          where: {
            tenantId,

            reference,
          },

          select: {
            id:
              true,
          },
        });

      if (
        existingPayment
      ) {
        continue;
      }

      const taxType =
        obligation.fiscalCalendar?.taxType ??
        this.mapObligationTypeToTaxType(
          obligation.type,
        );

      const payment =
        await this.ensureTaxPaymentForObligation(
          obligation.id,
          tenantId,
          obligation.amount,
          taxType,
          obligation.period ??
            undefined,
        );

      if (
        payment
      ) {
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
    amountValue:
      | number
      | null
      | undefined,

    taxType:
      TaxType,

    period?: string,
  ) {
    const amount =
      this.number(
        amountValue,
      );

    if (
      amount <= 0
    ) {
      return null;
    }

    const reference =
      `OBL-${obligationId}`;

    const existing =
      await this.prisma.taxPayment.findFirst({
        where: {
          tenantId,

          reference,
        },
      });

    if (
      existing
    ) {
      return existing;
    }

    void period;

    return this.prisma.taxPayment.create({
      data: {
        tenantId,

        taxType,

        amount,

        reference,

        paymentMethod:
          'OBRIGAÇÃO FISCAL',

        paidAt:
          new Date(),
      },
    });
  }

  // ============================================================
  // MAPEAR OBRIGAÇÃO PARA TAX TYPE
  // ============================================================

  private mapObligationTypeToTaxType(
    type: ObligationType,
  ): TaxType {
    const map: Record<
      string,
      TaxType
    > = {
      IVA:
        TaxType.IVA,

      IRT:
        TaxType.IRT,

      II:
        TaxType.II,

      SS:
        TaxType.SS,

      IEC:
        TaxType.IEC,

      IAC:
        TaxType.IAC,

      IP:
        TaxType.IP,

      IVM:
        TaxType.IVM,

      IEJ:
        TaxType.IEJ,

      IS:
        TaxType.IS,

      CEOC:
        TaxType.CEOC,

      IRP:
        TaxType.IRP,

      RCN:
        TaxType.RCN,

      TS:
        TaxType.TS,

      CFQA:
        TaxType.CFQA,

      ITP:
        TaxType.ITP,

      IPP:
        TaxType.IPP,

      IVRM:
        TaxType.IVRM,

      TAXA_GAS:
        TaxType.TAXA_GAS,

      INDUSTRIAL:
        TaxType.INDUSTRIAL,

      SELO:
        TaxType.SELO,
    };

    return (
      map[
        String(
          type,
        ).toUpperCase()
      ] ??
      TaxType.SELO
    );
  }

  // ============================================================
  // ACTUALIZAR ESTADOS
  // ============================================================

  async updateStatuses(
    tenantId?: string,
  ) {
    const now =
      new Date();

    const where:
      Prisma.FiscalObligationWhereInput =
      {
        status:
          ObligationStatus.PENDING,

        dueDate: {
          lt:
            now,
        },
      };

    if (
      tenantId
    ) {
      where.tenantId =
        tenantId;
    }

    const result =
      await this.prisma.fiscalObligation.updateMany({
        where,

        data: {
          status:
            ObligationStatus.LATE,
        },
      });

    return {
      success: true,

      updated:
        result.count,

      updatedAt:
        new Date(),
    };
  }

  // ============================================================
  // REMOVER
  // ============================================================

  async remove(
    tenantId: string,
    id: string,
  ) {
    const obligation =
      await this.findOne(
        tenantId,
        id,
      );

    if (
      obligation.status ===
      ObligationStatus.PAID
    ) {
      throw new BadRequestException(
        'Uma obrigação já paga não pode ser removida, pois faz parte do histórico fiscal da empresa.',
      );
    }

    await this.prisma.fiscalAlert.deleteMany({
      where: {
        tenantId,

        obligationId:
          id,
      },
    });

    const deleted =
      await this.prisma.fiscalObligation.delete({
        where: {
          id:
            obligation.id,
        },
      });

    return {
      success: true,

      message:
        'Obrigação fiscal removida com sucesso.',

      obligation:
        deleted,
    };
  }

  // ============================================================
  // REGIME GERAL
  // ============================================================

  private isGeneralRegime(
    regime: FiscalRegime,
  ): boolean {
    return (
      String(
        regime,
      ).toUpperCase() ===
      'GERAL'
    );
  }

  // ============================================================
  // REGIME SIMPLIFICADO
  // ============================================================

  private isSimplifiedRegime(
    regime: FiscalRegime,
  ): boolean {
    return String(
      regime,
    )
      .toUpperCase()
      .includes(
        'SIMPLIFICADO',
      );
  }

  // ============================================================
  // NORMALIZAR TEXTO
  // ============================================================

  private normalizeFiscalText(
    value: string,
  ): string {
    return String(
      value || '',
    )
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .replace(
        /[—–−]/g,
        '-',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim()
      .toLowerCase();
  }

  // ============================================================
  // CONVERTER PARA NUMBER
  // ============================================================

  private number(
    value: any,
  ): number {
    const result =
      Number(value);

    return Number.isFinite(
      result,
    )
      ? result
      : 0;
  }

  // ============================================================
  // ARREDONDAMENTO
  // ============================================================

  private round(
    value: number,
  ): number {
    return (
      Math.round(
        (
          this.number(
            value,
          ) +
          Number.EPSILON
        ) *
          100,
      ) / 100
    );
  }
}