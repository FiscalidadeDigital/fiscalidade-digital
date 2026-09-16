import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  ObligationStatus,
  TaxRuleOperation,
  TaxType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type FiscalTransactionData = {
  tenantId: string;
  taxType: TaxType;
  operation: TaxRuleOperation;
  period: string;
  referenceDate: Date;
  sourceType: string;
  sourceId: string;
  baseAmount: number;
  taxAmount: number;
  deductibleAmount: number;
  withheldAmount: number;
  description: string;
};

@Injectable()
export class FiscalEngineService {
  private readonly logger =
    new Logger(FiscalEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================
  // SINCRONIZAR EMPRESA
  // =========================================================

  async syncTenant(
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
          sector: true,
          companyType: true,
          retentionRate: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa autenticada não encontrada.',
      );
    }

    const year =
      referenceYear ??
      new Date().getFullYear();

    const start =
      new Date(
        Date.UTC(
          year,
          0,
          1,
        ),
      );

    const end =
      new Date(
        Date.UTC(
          year + 1,
          0,
          1,
        ),
      );

    // =======================================================
    // CARREGAR DADOS DA EMPRESA
    // =======================================================

    const [
      invoices,
      purchases,
      payrolls,
      revenues,
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          tenantId,

          status: {
            not: 'CANCELLED',
          },

          issuedAt: {
            gte: start,
            lt: end,
          },
        },

        select: {
          id: true,
          subtotal: true,
          iva: true,
          withholdingTax: true,
          issuedAt: true,
          invoiceNumber: true,
          status: true,
        },

        orderBy: {
          issuedAt: 'asc',
        },
      }),

      this.prisma.purchaseInvoice.findMany({
        where: {
          tenantId,

          status: {
            not: 'CANCELLED',
          },

          issuedAt: {
            gte: start,
            lt: end,
          },
        },

        select: {
          id: true,
          subtotal: true,
          iva: true,
          withholdingTax: true,
          issuedAt: true,
          invoiceNumber: true,
          status: true,
        },

        orderBy: {
          issuedAt: 'asc',
        },
      }),

      this.prisma.payroll.findMany({
        where: {
          tenantId,

          year,

          status: {
            in: [
              'CALCULATED',
              'APPROVED',
              'PAID',
              'CLOSED',
            ],
          },
        },

        select: {
          id: true,
          month: true,
          year: true,
          status: true,

          items: {
            select: {
              grossAmount: true,
              irtTaxableAmount: true,
              irtAmount: true,
              socialSecurityAmount: true,
            },
          },
        },

        orderBy: [
          {
            year: 'asc',
          },
          {
            month: 'asc',
          },
        ],
      }),

      this.prisma.revenue.findMany({
        where: {
          tenantId,

          year,
        },

        select: {
          id: true,
          month: true,
          year: true,
          amount: true,
        },

        orderBy: {
          month: 'asc',
        },
      }),
    ]);

    // =======================================================
    // TRANSAÇÕES FISCAIS
    // =======================================================

    const transactionData: FiscalTransactionData[] =
      [];

    // =======================================================
    // IVA DAS VENDAS
    // =======================================================

    for (
      const invoice of invoices
    ) {
      const subtotal =
        this.number(
          invoice.subtotal,
        );

      const iva =
        this.number(
          invoice.iva,
        );

      // =====================================================
      // REGIME GERAL
      // =====================================================

      if (
        tenant.regime ===
        'GERAL'
      ) {
        transactionData.push({
          tenantId,

          taxType:
            TaxType.IVA,

          operation:
            TaxRuleOperation.SALE,

          period:
            this.period(
              invoice.issuedAt,
            ),

          referenceDate:
            invoice.issuedAt,

          sourceType:
            'INVOICE_IVA',

          sourceId:
            invoice.id,

          baseAmount:
            this.round(
              subtotal,
            ),

          taxAmount:
            this.round(
              iva,
            ),

          deductibleAmount:
            0,

          /*
           * withholdingTax não é IVA.
           * Por isso não entra aqui.
           */
          withheldAmount:
            0,

          description:
            `IVA da venda ${invoice.invoiceNumber}`,
        });
      }

      // =====================================================
      // REGIME SIMPLIFICADO
      // =====================================================
      //
      // O modelo Invoice actual não possui paidAt.
      //
      // Portanto, para não inventar uma data de recebimento,
      // usamos apenas facturas efectivamente PAID e a
      // issuedAt como referência temporal disponível.
      // =====================================================

      if (
        tenant.regime ===
        'SIMPLIFICADO'
      ) {
        if (
          invoice.status ===
          'PAID'
        ) {
          const simplifiedVat =
            this.round(
              subtotal *
                0.07,
            );

          transactionData.push({
            tenantId,

            taxType:
              TaxType.IVA,

            operation:
              TaxRuleOperation.SALE,

            period:
              this.period(
                invoice.issuedAt,
              ),

            referenceDate:
              invoice.issuedAt,

            sourceType:
              'INVOICE_IVA_SIMPLIFICADO',

            sourceId:
              invoice.id,

            baseAmount:
              this.round(
                subtotal,
              ),

            taxAmount:
              simplifiedVat,

            deductibleAmount:
              0,

            withheldAmount:
              0,

            description:
              `IVA Simplificado da venda ${invoice.invoiceNumber}`,
          });
        }
      }
    }

    // =======================================================
    // IVA DEDUTÍVEL DAS COMPRAS
    // =======================================================

    if (
      tenant.regime ===
      'GERAL'
    ) {
      for (
        const purchase of purchases
      ) {
        const subtotal =
          this.number(
            purchase.subtotal,
          );

        const iva =
          this.number(
            purchase.iva,
          );

        transactionData.push({
          tenantId,

          taxType:
            TaxType.IVA,

          operation:
            TaxRuleOperation.PURCHASE,

          period:
            this.period(
              purchase.issuedAt,
            ),

          referenceDate:
            purchase.issuedAt,

          sourceType:
            'PURCHASE_INVOICE_IVA',

          sourceId:
            purchase.id,

          baseAmount:
            this.round(
              subtotal,
            ),

          /*
           * IVA suportado.
           */
          taxAmount:
            this.round(
              iva,
            ),

          /*
           * IVA potencialmente dedutível.
           */
          deductibleAmount:
            this.round(
              iva,
            ),

          withheldAmount:
            0,

          description:
            `IVA dedutível da compra ${purchase.invoiceNumber}`,
        });
      }
    }

    // =======================================================
    // RETENÇÕES
    // =======================================================
    //
    // NÃO criamos aqui uma transação TaxType.IVA para
    // withholdingTax.
    //
    // A retenção da factura não deve diminuir directamente
    // o IVA apurado.
    //
    // O enum TaxType actual não possui RETENCAO e não existe
    // informação suficiente no modelo Invoice para determinar
    // automaticamente a natureza jurídica da retenção.
    //
    // O valor continua preservado na própria factura.
    // =======================================================

    // =======================================================
    // IRT E SEGURANÇA SOCIAL
    // =======================================================

    for (
      const payroll of payrolls
    ) {
      const period =
        `${payroll.year}-${String(
          payroll.month,
        ).padStart(
          2,
          '0',
        )}`;

      const referenceDate =
        new Date(
          Date.UTC(
            payroll.year,
            payroll.month - 1,
            1,
          ),
        );

      const gross =
        payroll.items.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            this.number(
              item.grossAmount,
            ),
          0,
        );

      const irtBase =
        payroll.items.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            this.number(
              item.irtTaxableAmount,
            ),
          0,
        );

      const irt =
        payroll.items.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            this.number(
              item.irtAmount,
            ),
          0,
        );

      const socialSecurity =
        payroll.items.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            this.number(
              item.socialSecurityAmount,
            ),
          0,
        );

      // =====================================================
      // IRT
      // =====================================================

      if (
        irtBase > 0 ||
        irt > 0
      ) {
        transactionData.push({
          tenantId,

          taxType:
            TaxType.IRT,

          operation:
            TaxRuleOperation.PAYROLL,

          period,

          referenceDate,

          sourceType:
            'PAYROLL_IRT',

          sourceId:
            payroll.id,

          baseAmount:
            this.round(
              irtBase > 0
                ? irtBase
                : gross,
            ),

          taxAmount:
            this.round(
              irt,
            ),

          deductibleAmount:
            0,

          /*
           * O IRT da folha representa imposto retido pelo
           * empregador.
           */
          withheldAmount:
            this.round(
              irt,
            ),

          description:
            `IRT da folha ${period}`,
        });
      }

      // =====================================================
      // SEGURANÇA SOCIAL
      // =====================================================

      if (
        socialSecurity > 0
      ) {
        transactionData.push({
          tenantId,

          taxType:
            TaxType.SS,

          operation:
            TaxRuleOperation.PAYROLL,

          period,

          referenceDate,

          sourceType:
            'PAYROLL_SS',

          sourceId:
            payroll.id,

          baseAmount:
            this.round(
              gross,
            ),

          taxAmount:
            this.round(
              socialSecurity,
            ),

          deductibleAmount:
            0,

          withheldAmount:
            0,

          description:
            `Segurança Social da folha ${period}`,
        });
      }
    }

    // =======================================================
    // IMPOSTO INDUSTRIAL PROVISÓRIO
    // =======================================================
    //
    // Regime Geral:
    //
    // 2% sobre vendas/prestações de serviços dos primeiros
    // seis meses não sujeitas a retenção.
    //
    // Utilizamos as facturas como fonte da actividade de
    // vendas, excluindo as que possuem retenção.
    // =======================================================

    if (
      tenant.regime ===
      'GERAL'
    ) {
      const firstSixMonthsInvoices =
        invoices.filter(
          (invoice) => {
            const month =
              invoice.issuedAt.getUTCMonth() +
              1;

            const withholding =
              this.number(
                invoice.withholdingTax,
              );

            return (
              month >= 1 &&
              month <= 6 &&
              withholding <= 0
            );
          },
        );

      const firstSixMonthsSales =
        firstSixMonthsInvoices.reduce(
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
        firstSixMonthsSales >
        0
      ) {
        const industrial =
          this.round(
            firstSixMonthsSales *
              0.02,
          );

        transactionData.push({
          tenantId,

          taxType:
            TaxType.INDUSTRIAL,

          operation:
            TaxRuleOperation.SALE,

          period:
            `${year}-08`,

          referenceDate:
            new Date(
              Date.UTC(
                year,
                7,
                1,
              ),
            ),

          sourceType:
            'INDUSTRIAL_PROVISIONAL',

          sourceId:
            `${tenantId}-${year}-INDUSTRIAL-PROVISIONAL`,

          baseAmount:
            this.round(
              firstSixMonthsSales,
            ),

          taxAmount:
            industrial,

          deductibleAmount:
            0,

          withheldAmount:
            0,

          description:
            `Imposto Industrial provisório ${year} - vendas dos primeiros seis meses`,
        });
      }
    }

    // =======================================================
    // SINCRONIZAR TRANSAÇÕES E AVALIAÇÕES
    // =======================================================

    await this.prisma.$transaction(
      async (tx) => {
        const sourceTypes = [
          'INVOICE_IVA',
          'INVOICE_IVA_SIMPLIFICADO',
          'PURCHASE_INVOICE_IVA',
          'PAYROLL_IRT',
          'PAYROLL_SS',
          'INDUSTRIAL_PROVISIONAL',
        ];

        // ---------------------------------------------------
        // Apagar somente transações criadas pelo motor fiscal.
        //
        // Não apaga:
        // - facturas
        // - compras
        // - salários
        // - obrigações manuais
        // - pagamentos
        // - dados da empresa
        // ---------------------------------------------------

        await tx.taxTransaction.deleteMany({
          where: {
            tenantId,

            sourceType: {
              in: sourceTypes,
            },
          },
        });

        // ---------------------------------------------------
        // Criar transações actualizadas
        // ---------------------------------------------------

        if (
          transactionData.length >
          0
        ) {
          await tx.taxTransaction.createMany({
            data:
              transactionData,
          });
        }

        // ---------------------------------------------------
        // Recalcular assessments
        // ---------------------------------------------------

        const assessmentKeys =
          this.getAssessmentKeys(
            transactionData,
          );

        for (
          const key of assessmentKeys
        ) {
          await this.upsertAssessment(
            tx,
            tenantId,
            key.taxType,
            key.period,
            year,
            tenant.regime,
          );
        }
      },
    );

    // =======================================================
    // TOTAIS
    // =======================================================

    const revenueTotal =
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

    const invoiceTotal =
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

    const purchaseTotal =
      purchases.reduce(
        (
          sum,
          purchase,
        ) =>
          sum +
          this.number(
            purchase.subtotal,
          ),
        0,
      );

    // =======================================================
    // IVA LIQUIDADO
    // =======================================================

    const ivaLiquidado =
      transactionData
        .filter(
          (item) =>
            item.taxType ===
              TaxType.IVA &&
            item.operation ===
              TaxRuleOperation.SALE,
        )
        .reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.taxAmount,
          0,
        );

    // =======================================================
    // IVA DEDUTÍVEL
    // =======================================================

    const ivaDedutivel =
      transactionData
        .filter(
          (item) =>
            item.taxType ===
              TaxType.IVA &&
            item.operation ===
              TaxRuleOperation.PURCHASE,
        )
        .reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.deductibleAmount,
          0,
        );

    // =======================================================
    // IVA FINAL
    // =======================================================

    const ivaFinal =
      Math.max(
        0,
        this.round(
          ivaLiquidado -
            ivaDedutivel,
        ),
      );

    // =======================================================
    // LOG
    // =======================================================

    this.logger.log(
      [
        'MOTOR FISCAL SINCRONIZADO',

        `Empresa: ${tenant.name}`,

        `NIF: ${tenant.nif}`,

        `Regime: ${tenant.regime}`,

        `Ano: ${year}`,

        `Facturas: ${invoices.length}`,

        `Compras: ${purchases.length}`,

        `Folhas: ${payrolls.length}`,

        `Receitas: ${revenues.length}`,

        `Transações: ${transactionData.length}`,

        `IVA liquidado: ${this.round(
          ivaLiquidado,
        )}`,

        `IVA dedutível: ${this.round(
          ivaDedutivel,
        )}`,

        `IVA final: ${ivaFinal}`,
      ].join(
        ' | ',
      ),
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

        sector:
          tenant.sector,

        companyType:
          tenant.companyType,
      },

      year,

      activity: {
        invoices:
          invoices.length,

        purchases:
          purchases.length,

        payrolls:
          payrolls.length,

        revenues:
          revenues.length,
      },

      totals: {
        revenue:
          this.round(
            revenueTotal,
          ),

        sales:
          this.round(
            invoiceTotal,
          ),

        purchases:
          this.round(
            purchaseTotal,
          ),

        ivaLiquidado:
          this.round(
            ivaLiquidado,
          ),

        ivaDedutivel:
          this.round(
            ivaDedutivel,
          ),

        ivaFinal,
      },

      transactionCount:
        transactionData.length,

      synchronizedAt:
        new Date(),
    };
  }

  // =========================================================
  // RESUMO FISCAL
  // =========================================================

  async summary(
    tenantId: string,
    referenceYear?: number,
  ) {
    const year =
      referenceYear ??
      new Date().getFullYear();

    await this.syncTenant(
      tenantId,
      year,
    );

    const start =
      new Date(
        Date.UTC(
          year,
          0,
          1,
        ),
      );

    const end =
      new Date(
        Date.UTC(
          year + 1,
          0,
          1,
        ),
      );

    const [
      assessments,
      transactions,
    ] =
      await Promise.all([
        this.prisma.taxAssessment.findMany({
          where: {
            tenantId,

            year,
          },

          orderBy: [
            {
              period:
                'asc',
            },

            {
              taxType:
                'asc',
            },
          ],
        }),

        this.prisma.taxTransaction.findMany({
          where: {
            tenantId,

            referenceDate: {
              gte: start,
              lt: end,
            },
          },

          orderBy: {
            referenceDate:
              'asc',
          },
        }),
      ]);

    const totals =
      this.calculateAssessmentTotals(
        assessments,
      );

    return {
      year,

      assessments,

      transactions,

      totals,

      transactionCount:
        transactions.length,

      assessmentCount:
        assessments.length,
    };
  }

  // =========================================================
  // CALCULAR IMPOSTO
  // =========================================================

  async calculateTax(
    tenantId: string,
    taxType: TaxType,
    period: string,
    year?: number,
  ) {
    const referenceYear =
      year ??
      new Date().getFullYear();

    await this.syncTenant(
      tenantId,
      referenceYear,
    );

    const assessment =
      await this.prisma.taxAssessment.findUnique({
        where: {
          tenantId_taxType_period_year:
            {
              tenantId,

              taxType,

              period,

              year:
                referenceYear,
            },
        },
      });

    if (!assessment) {
      return {
        tenantId,

        taxType,

        period,

        year:
          referenceYear,

        taxableAmount:
          0,

        taxDueAmount:
          0,

        deductibleAmount:
          0,

        withheldAmount:
          0,

        finalAmount:
          0,

        status:
          'DRAFT',
      };
    }

    return assessment;
  }

  // =========================================================
  // ACTUALIZAR AVALIAÇÃO FISCAL
  // =========================================================

  private async upsertAssessment(
    tx: any,
    tenantId: string,
    taxType: TaxType,
    period: string,
    year: number,
    regime: any,
  ) {
    const transactions =
      await tx.taxTransaction.findMany({
        where: {
          tenantId,

          taxType,

          period,
        },

        select: {
          baseAmount: true,
          taxAmount: true,
          deductibleAmount: true,
          withheldAmount: true,
        },
      });

    if (
      !transactions.length
    ) {
      return;
    }

    const taxableAmount =
      transactions.reduce(
        (
          sum: number,
          item: any,
        ) =>
          sum +
          this.number(
            item.baseAmount,
          ),
        0,
      );

    const taxDueAmount =
      transactions.reduce(
        (
          sum: number,
          item: any,
        ) =>
          sum +
          this.number(
            item.taxAmount,
          ),
        0,
      );

    const deductibleAmount =
      transactions.reduce(
        (
          sum: number,
          item: any,
        ) =>
          sum +
          this.number(
            item.deductibleAmount,
          ),
        0,
      );

    const withheldAmount =
      transactions.reduce(
        (
          sum: number,
          item: any,
        ) =>
          sum +
          this.number(
            item.withheldAmount,
          ),
        0,
      );

    const finalAmount =
      Math.max(
        0,

        this.round(
          taxDueAmount -
            deductibleAmount -
            withheldAmount,
        ),
      );

    await tx.taxAssessment.upsert({
      where: {
        tenantId_taxType_period_year:
          {
            tenantId,

            taxType,

            period,

            year,
          },
      },

      create: {
        tenantId,

        taxType,

        period,

        year,

        taxableAmount:
          this.round(
            taxableAmount,
          ),

        taxDueAmount:
          this.round(
            taxDueAmount,
          ),

        deductibleAmount:
          this.round(
            deductibleAmount,
          ),

        withheldAmount:
          this.round(
            withheldAmount,
          ),

        adjustmentsAmount:
          0,

        finalAmount:
          this.round(
            finalAmount,
          ),

        status:
          'DRAFT',
      },

      update: {
        taxableAmount:
          this.round(
            taxableAmount,
          ),

        taxDueAmount:
          this.round(
            taxDueAmount,
          ),

        deductibleAmount:
          this.round(
            deductibleAmount,
          ),

        withheldAmount:
          this.round(
            withheldAmount,
          ),

        adjustmentsAmount:
          0,

        finalAmount:
          this.round(
            finalAmount,
          ),

        updatedAt:
          new Date(),
      },
    });

    await this.syncAssessmentObligation(
      tx,
      tenantId,
      taxType,
      period,
      year,
      regime,
      this.round(
        finalAmount,
      ),
    );
  }

  // =========================================================
  // LIGAR ASSESSMENT À OBRIGAÇÃO
  // =========================================================

  private async syncAssessmentObligation(
    tx: any,
    tenantId: string,
    taxType: TaxType,
    period: string,
    year: number,
    regime: any,
    finalAmount: number,
  ) {
    /*
     * IRT e SS são especiais:
     *
     * Folha Setembro
     *       ↓
     * Obrigação Outubro
     *
     * Por isso procuramos o calendário do mês seguinte.
     */

    const isPayrollTax =
      taxType === TaxType.IRT ||
      taxType === TaxType.SS;

    let targetYear =
      year;

    let targetMonth =
      this.monthFromPeriod(
        period,
      );

    if (
      isPayrollTax &&
      targetMonth !== null
    ) {
      if (
        targetMonth === 12
      ) {
        targetMonth = 1;

        targetYear =
          year + 1;
      } else {
        targetMonth += 1;
      }
    }

    // =======================================================
    // CALENDÁRIO FISCAL
    // =======================================================

    const calendars =
      await tx.fiscalCalendar.findMany({
        where: {
          active: true,

          referenceYear:
            targetYear,

          taxType,

          regimes: {
            some: {
              regime,
            },
          },
        },

        include: {
          regimes: true,
        },

        orderBy: {
          dueDate:
            'asc',
        },
      });

    if (
      !calendars.length
    ) {
      this.logger.warn(
        `Nenhum calendário encontrado para ${taxType}, regime ${regime}, ano ${targetYear}.`,
      );

      return;
    }

    // =======================================================
    // ENCONTRAR REGRA
    // =======================================================

    let rule: any = null;

    if (
      isPayrollTax &&
      targetMonth !== null
    ) {
      rule =
        this.findPayrollCalendar(
          calendars,
          taxType,
          targetMonth,
          targetYear,
        );
    } else {
      const normalizedPeriod =
        this.normalizePeriod(
          period,
        );

      rule =
        calendars.find(
          (calendar: any) =>
            calendar.period &&
            this.periodMatchesCalendar(
              calendar.period,
              normalizedPeriod,
            ),
        );
    }

    // =======================================================
    // FALLBACK
    // =======================================================

    if (!rule) {
      rule =
        calendars.find(
          (calendar: any) =>
            calendar.obligationType !==
            'DECLARACAO',
        );
    }

    if (!rule) {
      rule =
        calendars[0];
    }

    if (!rule) {
      return;
    }

    // =======================================================
    // PERÍODO DA OBRIGAÇÃO
    // =======================================================

    const obligationPeriod =
      isPayrollTax
        ? String(
            rule.period ??
              this.monthName(
                targetMonth!,
              ),
          ).trim()
        : period;

    // =======================================================
    // PROCURAR OBRIGAÇÃO
    // =======================================================

    let existing =
      await tx.fiscalObligation.findFirst({
        where: {
          tenantId,

          fiscalCalendarId:
            rule.id,

          period:
            obligationPeriod,
        },

        orderBy: {
          createdAt:
            'desc',
        },
      });

    // =======================================================
    // FALLBACK POR TIPO/PERÍODO
    // =======================================================

    if (!existing) {
      existing =
        await tx.fiscalObligation.findFirst({
          where: {
            tenantId,

            type:
              rule.obligationType,

            period:
              obligationPeriod,
          },

          orderBy: {
            createdAt:
              'desc',
          },
        });
    }

    // =======================================================
    // NÃO ALTERAR OBRIGAÇÃO PAGA
    // =======================================================

    if (
      existing?.status ===
      ObligationStatus.PAID
    ) {
      return;
    }

    // =======================================================
    // DATA DE VENCIMENTO
    // =======================================================

    const dueDate =
      new Date(
        rule.dueDate,
      );

    if (
      Number.isNaN(
        dueDate.getTime(),
      )
    ) {
      this.logger.warn(
        `Data inválida no calendário fiscal ${rule.id}.`,
      );

      return;
    }

    const now =
      new Date();

    const status =
      dueDate < now
        ? ObligationStatus.LATE
        : ObligationStatus.PENDING;

    // =======================================================
    // ACTUALIZAR OBRIGAÇÃO
    // =======================================================

    if (existing) {
      await tx.fiscalObligation.update({
        where: {
          id:
            existing.id,
        },

        data: {
          fiscalCalendarId:
            rule.id,

          type:
            rule.obligationType,

          title:
            rule.title,

          description:
            rule.description,

          dueDate:
            rule.dueDate,

          period:
            obligationPeriod,

          amount:
            this.round(
              finalAmount,
            ),

          status,

          alertEnabled:
            existing.alertEnabled ??
            true,

          alertDaysBefore:
            existing.alertDaysBefore ??
            7,
        },
      });

      return;
    }

    // =======================================================
    // CRIAR OBRIGAÇÃO
    // =======================================================

    await tx.fiscalObligation.create({
      data: {
        tenantId,

        fiscalCalendarId:
          rule.id,

        type:
          rule.obligationType,

        title:
          rule.title,

        description:
          rule.description,

        dueDate:
          rule.dueDate,

        period:
          obligationPeriod,

        amount:
          this.round(
            finalAmount,
          ),

        status,

        alertEnabled:
          true,

        alertDaysBefore:
          7,

        reminderSent:
          false,
      },
    });
  }

  // =========================================================
  // ENCONTRAR CALENDÁRIO DA FOLHA
  // =========================================================

  private findPayrollCalendar(
    calendars: any[],
    taxType: TaxType,
    month: number,
    year: number,
  ) {
    const expectedMonth =
      this.normalizeText(
        this.monthName(
          month,
        ),
      );

    const expectedMonthNumber =
      String(
        month,
      ).padStart(
        2,
        '0',
      );

    const candidates =
      calendars.map(
        (
          calendar,
        ) => {
          const title =
            this.normalizeText(
              calendar.title,
            );

          const description =
            this.normalizeText(
              calendar.description,
            );

          const period =
            this.normalizeText(
              calendar.period,
            );

          const text =
            `${title} ${description}`;

          const dueDate =
            new Date(
              calendar.dueDate,
            );

          const correctPeriod =
            period ===
              expectedMonth ||
            period ===
              expectedMonthNumber ||
            period ===
              String(
                month,
              );

          const correctDueDate =
            !Number.isNaN(
              dueDate.getTime(),
            ) &&
            dueDate.getUTCFullYear() ===
              year &&
            dueDate.getUTCMonth() + 1 ===
              month;

          let score =
            0;

          // =================================================
          // IRT
          // =================================================

          if (
            taxType ===
            TaxType.IRT
          ) {
            if (
              text.includes(
                'GRUPO A',
              )
            ) {
              score += 500;
            }

            if (
              text.includes(
                'MAPA DE REMUNERACOES',
              )
            ) {
              score += 500;
            }

            if (
              text.includes(
                'GRUPOS B E C',
              )
            ) {
              score -= 5000;
            }

            if (
              text.includes(
                'GRUPO B',
              )
            ) {
              score -= 5000;
            }

            if (
              text.includes(
                'GRUPO C',
              )
            ) {
              score -= 5000;
            }

            if (
              text.includes(
                'ANUAL',
              )
            ) {
              score -= 5000;
            }

            if (
              text.includes(
                'MODELO 2',
              )
            ) {
              score -= 5000;
            }
          }

          // =================================================
          // SEGURANÇA SOCIAL
          // =================================================

          if (
            taxType ===
            TaxType.SS
          ) {
            if (
              text.includes(
                'SEGURANCA SOCIAL',
              )
            ) {
              score += 1000;
            }

            if (
              text.includes(
                'SEGURANCA',
              )
            ) {
              score += 300;
            }

            if (
              text.includes(
                'ANUAL',
              )
            ) {
              score -= 5000;
            }
          }

          // =================================================
          // PERÍODO
          // =================================================

          if (
            correctPeriod
          ) {
            score += 2000;
          } else {
            score -= 2000;
          }

          // =================================================
          // DATA
          // =================================================

          if (
            correctDueDate
          ) {
            score += 2000;
          } else {
            score -= 1000;
          }

          return {
            calendar,
            score,
            correctPeriod,
            correctDueDate,
            text,
          };
        },
      );

    candidates.sort(
      (
        a,
        b,
      ) =>
        b.score -
        a.score,
    );

    const best =
      candidates[0];

    if (!best) {
      return null;
    }

    // =======================================================
    // VALIDAR IRT
    // =======================================================

    if (
      taxType ===
      TaxType.IRT
    ) {
      const isGroupA =
        best.text.includes(
          'GRUPO A',
        );

      const isPayroll =
        best.text.includes(
          'MAPA DE REMUNERACOES',
        );

      const isGroupBC =
        best.text.includes(
          'GRUPOS B E C',
        ) ||
        best.text.includes(
          'GRUPO B',
        ) ||
        best.text.includes(
          'GRUPO C',
        );

      if (
        !isGroupA ||
        !isPayroll ||
        isGroupBC
      ) {
        return null;
      }
    }

    // =======================================================
    // VALIDAR SS
    // =======================================================

    if (
      taxType ===
      TaxType.SS
    ) {
      if (
        !best.correctPeriod &&
        !best.correctDueDate
      ) {
        return null;
      }
    }

    return best.calendar;
  }

  // =========================================================
  // OBTER CHAVES DAS AVALIAÇÕES
  // =========================================================

  private getAssessmentKeys(
    transactions: FiscalTransactionData[],
  ) {
    const map =
      new Map<
        string,
        {
          taxType: TaxType;
          period: string;
        }
      >();

    for (
      const transaction of transactions
    ) {
      const key =
        `${transaction.taxType}:${transaction.period}`;

      if (
        !map.has(key)
      ) {
        map.set(
          key,
          {
            taxType:
              transaction.taxType,

            period:
              transaction.period,
          },
        );
      }
    }

    return Array.from(
      map.values(),
    );
  }

  // =========================================================
  // CALCULAR TOTAIS
  // =========================================================

  private calculateAssessmentTotals(
    assessments: any[],
  ) {
    return {
      taxDue:
        this.round(
          assessments.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.taxDueAmount,
              ),
            0,
          ),
        ),

      deductible:
        this.round(
          assessments.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.deductibleAmount,
              ),
            0,
          ),
        ),

      withheld:
        this.round(
          assessments.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.withheldAmount,
              ),
            0,
          ),
        ),

      final:
        this.round(
          assessments.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.finalAmount,
              ),
            0,
          ),
        ),
    };
  }

  // =========================================================
  // NORMALIZAR PERÍODO
  // =========================================================

  private normalizePeriod(
    period: string,
  ) {
    const value =
      String(
        period ?? '',
      )
        .trim()
        .toLowerCase();

    const months: Record<
      string,
      string
    > = {
      janeiro: '01',
      fevereiro: '02',
      marco: '03',
      março: '03',
      abril: '04',
      maio: '05',
      junho: '06',
      julho: '07',
      agosto: '08',
      setembro: '09',
      outubro: '10',
      novembro: '11',
      dezembro: '12',
    };

    if (
      months[value]
    ) {
      return months[value];
    }

    const match =
      value.match(
        /^(\d{4})-(\d{1,2})$/,
      );

    if (match) {
      return match[2].padStart(
        2,
        '0',
      );
    }

    const numeric =
      value.match(
        /^\d{1,2}$/,
      );

    if (numeric) {
      return numeric[0].padStart(
        2,
        '0',
      );
    }

    return value;
  }

  // =========================================================
  // COMPARAR PERÍODOS
  // =========================================================

  private periodMatchesCalendar(
    calendarPeriod: string,
    period: string,
  ) {
    const normalizedCalendar =
      this.normalizePeriod(
        calendarPeriod,
      );

    const normalizedPeriod =
      this.normalizePeriod(
        period,
      );

    return (
      normalizedCalendar ===
        normalizedPeriod ||
      this.normalizeText(
        calendarPeriod,
      ).includes(
        this.normalizeText(
          period,
        ),
      )
    );
  }

  // =========================================================
  // CONVERTER PERÍODO EM MÊS
  // =========================================================

  private monthFromPeriod(
    period: string,
  ): number | null {
    const normalized =
      this.normalizePeriod(
        period,
      );

    const value =
      Number(
        normalized,
      );

    if (
      Number.isInteger(
        value,
      ) &&
      value >= 1 &&
      value <= 12
    ) {
      return value;
    }

    return null;
  }

  // =========================================================
  // NOME DO MÊS
  // =========================================================

  private monthName(
    month: number,
  ) {
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

    return (
      months[month - 1] ??
      ''
    );
  }

  // =========================================================
  // PERÍODO YYYY-MM
  // =========================================================

  private period(
    date: Date,
  ) {
    return `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1,
    ).padStart(
      2,
      '0',
    )}`;
  }

  // =========================================================
  // NORMALIZAR TEXTO
  // =========================================================
  //
  // Esta função resolve comparações como:
  //
  // "Segurança Social"
  // "SEGURANCA SOCIAL"
  // "segurança social"
  //
  // Também remove acentos para facilitar a pesquisa
  // no calendário fiscal.
  // =========================================================

  private normalizeText(
    value: unknown,
  ): string {
    return String(
      value ?? '',
    )
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .trim()
      .toUpperCase();
  }

  // =========================================================
  // CONVERTER QUALQUER VALOR NUMÉRICO
  // =========================================================

  private number(
    value: unknown,
  ): number {
    if (
      value === null ||
      value === undefined
    ) {
      return 0;
    }

    if (
      typeof value ===
      'number'
    ) {
      return Number.isFinite(
        value,
      )
        ? value
        : 0;
    }

    if (
      typeof value ===
        'object' &&
      value !== null &&
      'toNumber' in value &&
      typeof (
        value as any
      ).toNumber ===
        'function'
    ) {
      const result =
        Number(
          (
            value as any
          ).toNumber(),
        );

      return Number.isFinite(
        result,
      )
        ? result
        : 0;
    }

    const parsed =
      Number(value);

    return Number.isFinite(
      parsed,
    )
      ? parsed
      : 0;
  }

  // =========================================================
  // ARREDONDAMENTO MONETÁRIO
  // =========================================================

  private round(
    value: number,
  ): number {
    return (
      Math.round(
        (
          value +
          Number.EPSILON
        ) *
          100,
      ) / 100
    );
  }
}