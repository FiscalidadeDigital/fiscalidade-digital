import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ObligationStatus,
  TaxType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================
  // DASHBOARD
  // ============================================================

  async getDashboard(tenantId: string) {
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    const currentYear =
      today.getFullYear();

    const currentMonth =
      today.getMonth() + 1;

    // ==========================================================
    // INTERVALO DO ANO
    // ==========================================================

    const yearStart =
      new Date(
        currentYear,
        0,
        1,
      );

    const nextYearStart =
      new Date(
        currentYear + 1,
        0,
        1,
      );

    // ==========================================================
    // BUSCAR DADOS REAIS DA EMPRESA
    // ==========================================================

    const [
      tenant,
      invoiceCount,
      pendingInvoiceCount,
      clientCount,
      productCount,
      paidInvoiceRevenue,
      obligations,
      declarations,
      revenues,
      payments,
    ] = await Promise.all([
      // ========================================================
      // EMPRESA
      // ========================================================

      this.prisma.tenant.findUnique({
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
          status: true,
          createdAt: true,
        },
      }),

      // ========================================================
      // FACTURAS
      // ========================================================

      this.prisma.invoice.count({
        where: {
          tenantId,
        },
      }),

      // ========================================================
      // FACTURAS PENDENTES
      // ========================================================

      this.prisma.invoice.count({
        where: {
          tenantId,

          status: 'PENDING',
        },
      }),

      // ========================================================
      // CLIENTES
      // ========================================================

      this.prisma.client.count({
        where: {
          tenantId,
        },
      }),

      // ========================================================
      // PRODUTOS
      // ========================================================

      this.prisma.product.count({
        where: {
          tenantId,
        },
      }),

      // ========================================================
      // FACTURAÇÃO REAL DAS FACTURAS PAGAS
      // ========================================================

      this.prisma.invoice.aggregate({
        where: {
          tenantId,

          status: 'PAID',
        },

        _sum: {
          total: true,
        },
      }),

      // ========================================================
      // OBRIGAÇÕES REAIS
      // ========================================================

      this.prisma.fiscalObligation.findMany({
        where: {
          tenantId,
        },

        include: {
          fiscalCalendar: {
            select: {
              taxType: true,
              obligationType: true,
              title: true,
              dueDate: true,
              period: true,
            },
          },
        },

        orderBy: {
          dueDate: 'asc',
        },
      }),

      // ========================================================
      // DECLARAÇÕES REAIS
      // ========================================================

      this.prisma.taxDeclaration.findMany({
        where: {
          tenantId,
        },

        select: {
          id: true,
          taxType: true,
          period: true,
          declaredAmount: true,
          paidAmount: true,
          declarationDate: true,
        },

        orderBy: {
          declarationDate: 'desc',
        },
      }),

      // ========================================================
      // RECEITAS REAIS
      // ========================================================

      this.prisma.revenue.findMany({
        where: {
          tenantId,
        },

        select: {
          year: true,
          month: true,
          amount: true,
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

      // ========================================================
      // PAGAMENTOS FISCAIS REAIS
      // ========================================================

      this.prisma.taxPayment.findMany({
        where: {
          tenantId,

          paidAt: {
            gte: yearStart,
            lt: nextYearStart,
          },
        },

        select: {
          id: true,
          taxType: true,
          amount: true,
          reference: true,
          paymentMethod: true,
          paidAt: true,
        },

        orderBy: {
          paidAt: 'asc',
        },
      }),
    ]);

    // ==========================================================
    // VALIDAR EMPRESA
    // ==========================================================

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    // ==========================================================
    // ACTUALIZAR ESTADOS DAS OBRIGAÇÕES
    // ==========================================================
    //
    // Não alteramos obrigações PAGAS.
    // Apenas tratamos PENDING vencidas como LATE para a
    // informação apresentada no Dashboard.
    //
    // A persistência dos estados continua a cargo do
    // ObligationsService / processo fiscal.
    // ==========================================================

    const activeObligations =
      obligations.map(
        (obligation) => {
          const dueDate =
            new Date(
              obligation.dueDate,
            );

          dueDate.setHours(
            0,
            0,
            0,
            0,
          );

          const difference =
            dueDate.getTime() -
            today.getTime();

          const daysLeft =
            Math.ceil(
              difference /
                (1000 *
                  60 *
                  60 *
                  24),
            );

          let displayStatus:
            | 'today'
            | 'warning'
            | 'normal'
            | 'success';

          if (
            obligation.status ===
            ObligationStatus.PAID
          ) {
            displayStatus = 'success';
          } else if (
            daysLeft < 0
          ) {
            displayStatus = 'normal';
          } else if (
            daysLeft === 0
          ) {
            displayStatus = 'today';
          } else if (
            daysLeft <= 3
          ) {
            displayStatus = 'warning';
          } else {
            displayStatus = 'success';
          }

          return {
            ...obligation,

            daysLeft,

            displayStatus,
          };
        },
      );

    // ==========================================================
    // OBRIGAÇÕES PENDENTES
    // ==========================================================

    const pendingObligations =
      activeObligations.filter(
        (obligation) =>
          obligation.status !==
          ObligationStatus.PAID,
      );

    // ==========================================================
    // OBRIGAÇÕES VENCIDAS
    // ==========================================================

    const overdueObligations =
      activeObligations.filter(
        (obligation) =>
          obligation.status ===
            ObligationStatus.LATE ||
          (
            obligation.status ===
              ObligationStatus.PENDING &&
            obligation.dueDate <
              today
          ),
      );

    // ==========================================================
    // PRÓXIMOS PRAZOS
    // ==========================================================

    const upcomingObligations =
      activeObligations
        .filter(
          (obligation) =>
            obligation.status !==
              ObligationStatus.PAID &&
            obligation.dueDate >=
              today,
        )
        .sort(
          (a, b) =>
            new Date(
              a.dueDate,
            ).getTime() -
            new Date(
              b.dueDate,
            ).getTime(),
        );

    // ==========================================================
    // OBRIGAÇÕES PAGAS
    // ==========================================================

    const paidObligations =
      activeObligations.filter(
        (obligation) =>
          obligation.status ===
          ObligationStatus.PAID,
      );

    // ==========================================================
    // TAXAS / IMPOSTOS DAS OBRIGAÇÕES
    // ==========================================================

    const taxMap: Record<
      string,
      {
        value: number;
        paid: number;
        pending: number;
        declared: number;
      }
    > = {};

    const ensureTax =
      (taxType: string) => {
        if (!taxMap[taxType]) {
          taxMap[taxType] = {
            value: 0,
            paid: 0,
            pending: 0,
            declared: 0,
          };
        }

        return taxMap[taxType];
      };

    // ==========================================================
    // VALORES DAS OBRIGAÇÕES
    // ==========================================================

    for (
      const obligation of activeObligations
    ) {
      const taxType =
        obligation.fiscalCalendar
          ?.taxType;

      if (!taxType) {
        continue;
      }

      const value =
        this.number(
          obligation.amount,
        );

      const tax =
        ensureTax(
          String(taxType),
        );

      tax.value += value;

      if (
        obligation.status ===
        ObligationStatus.PAID
      ) {
        tax.paid += value;
      } else {
        tax.pending += value;
      }
    }

    // ==========================================================
    // DECLARAÇÕES FISCAIS
    // ==========================================================

    for (
      const declaration of declarations
    ) {
      const taxType =
        String(
          declaration.taxType,
        );

      const tax =
        ensureTax(
          taxType,
        );

      tax.declared +=
        this.number(
          declaration.declaredAmount,
        );
    }

    // ==========================================================
    // PAGAMENTOS REAIS
    // ==========================================================

    for (
      const payment of payments
    ) {
      const taxType =
        String(
          payment.taxType,
        );

      const tax =
        ensureTax(
          taxType,
        );

      const amount =
        this.number(
          payment.amount,
        );

      /*
       * O pagamento já pode estar representado
       * por uma obrigação paga.
       *
       * Não somamos novamente ao campo `value`.
       * O TaxPayment serve para:
       *
       * 1. evolução dos pagamentos;
       * 2. valor efectivamente pago;
       * 3. histórico financeiro fiscal.
       */

      tax.paid =
        Math.max(
          tax.paid,
          amount,
        );
    }

    // ==========================================================
    // NOMES DOS IMPOSTOS
    // ==========================================================

    const taxNames: Record<
      string,
      string
    > = {
      IVA:
        'IVA',

      IRT:
        'IRT',

      INDUSTRIAL:
        'Imposto Industrial',

      II:
        'Imposto Industrial',

      SELO:
        'Imposto de Selo',

      SS:
        'Segurança Social',

      IAC:
        'Imposto sobre Aplicação de Capitais',

      IP:
        'Imposto Predial',

      IEC:
        'Imposto Especial de Consumo',

      IVM:
        'Imposto sobre Veículos Motorizados',

      IS:
        'Imposto do Selo',

      RETENCAO:
        'Retenção na Fonte',
    };

    // ==========================================================
    // IMPOSTOS PARA O DASHBOARD
    // ==========================================================

    const taxes = Object.entries(
      taxMap,
    )
      .map(
        ([type, tax]) => ({
          name:
            taxNames[type] ||
            type,

          value:
            this.round(
              tax.value,
            ),

          paid:
            this.round(
              tax.paid,
            ),

          pending:
            this.round(
              tax.pending,
            ),

          declared:
            this.round(
              tax.declared,
            ),
        }),
      )
      .filter(
        (tax) =>
          tax.value > 0 ||
          tax.paid > 0 ||
          tax.declared > 0,
      );

    // ==========================================================
    // TOTAL DOS IMPOSTOS REGISTADOS
    // ==========================================================

    const totalTaxes =
      taxes.reduce(
        (total, tax) =>
          total +
          this.number(
            tax.value,
          ),
        0,
      );

    // ==========================================================
    // RECEITA REAL
    // ==========================================================

    const totalRevenue =
      this.number(
        paidInvoiceRevenue
          ._sum.total,
      );

    // ==========================================================
    // RECEITAS MENSAIS
    // ==========================================================

    const monthlyRevenue =
      revenues.map(
        (item) => ({
          month:
            item.month,

          year:
            item.year,

          amount:
            this.number(
              item.amount,
            ),

          label:
            `${String(
              item.month,
            ).padStart(2, '0')}/${item.year}`,
        }),
      );

    // ==========================================================
    // GRÁFICO DE RECEITAS — ÚLTIMOS 12 MESES
    // ==========================================================

    const chartData: Array<{
      month: number;
      year: number;
      label: string;
      value: number;
    }> = [];

    for (
      let index = 11;
      index >= 0;
      index--
    ) {
      const date =
        new Date(
          currentYear,
          currentMonth -
            1 -
            index,
          1,
        );

      const year =
        date.getFullYear();

      const month =
        date.getMonth() + 1;

      const found =
        revenues.find(
          (item) =>
            item.year ===
              year &&
            item.month ===
              month,
        );

      chartData.push({
        month,

        year,

        label:
          `${String(
            month,
          ).padStart(2, '0')}/${year}`,

        value:
          found
            ? this.number(
                found.amount,
              )
            : 0,
      });
    }

    // ==========================================================
    // EVOLUÇÃO DOS PAGAMENTOS FISCAIS
    // ==========================================================

    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];

    const paymentMap =
      new Map<number, number>();

    for (
      const payment of payments
    ) {
      const date =
        new Date(
          payment.paidAt,
        );

      const month =
        date.getMonth() + 1;

      const current =
        paymentMap.get(
          month,
        ) || 0;

      paymentMap.set(
        month,
        current +
          this.number(
            payment.amount,
          ),
      );
    }

    const paymentEvolution =
      monthNames.map(
        (month, index) => ({
          month,

          value:
            this.round(
              paymentMap.get(
                index + 1,
              ) || 0,
            ),
        }),
      );

    // ==========================================================
    // PAGAMENTOS TOTAIS DO ANO
    // ==========================================================

    const totalPayments =
      payments.reduce(
        (total, payment) =>
          total +
          this.number(
            payment.amount,
          ),
        0,
      );

    // ==========================================================
    // PAGAMENTOS EM DIA
    // ==========================================================
    //
    // Calculado somente com obrigações reais.
    //
    // Não usamos uma percentagem fixa.
    // ==========================================================

    const obligationsWithPaymentDate =
      await this.prisma.taxPayment.findMany({
        where: {
          tenantId,

          reference: {
            startsWith:
              'OBL-',
          },
        },

        select: {
          reference: true,
          paidAt: true,
        },
      });

    let paidOnTimeCount = 0;

    for (
      const payment of obligationsWithPaymentDate
    ) {
      const obligationId =
        payment.reference.replace(
          'OBL-',
          '',
        );

      const obligation =
        activeObligations.find(
          (item) =>
            item.id ===
            obligationId,
        );

      if (
        !obligation
      ) {
        continue;
      }

      const paymentDate =
        new Date(
          payment.paidAt,
        );

      if (
        paymentDate <=
        new Date(
          obligation.dueDate,
        )
      ) {
        paidOnTimeCount++;
      }
    }

    const paymentsOnTime =
      paidOnTimeCount +
        overdueObligations.length ===
      0
        ? 0
        : Math.round(
            (
              paidOnTimeCount /
              (
                paidOnTimeCount +
                overdueObligations.length
              )
            ) *
              100,
          );

    // ==========================================================
    // MULTAS EVITADAS
    // ==========================================================
    //
    // Não inventamos valores.
    //
    // Para já, mostramos apenas o valor das obrigações que
    // foram pagas antes do vencimento.
    //
    // Isto representa o valor fiscal pago atempadamente,
    // não uma estimativa de multa.
    // ==========================================================

    const timelyPaidAmount =
      paidObligations
        .filter(
          (obligation) => {
            const payment =
              obligationsWithPaymentDate.find(
                (item) =>
                  item.reference ===
                  `OBL-${obligation.id}`,
              );

            if (!payment) {
              return false;
            }

            return (
              new Date(
                payment.paidAt,
              ) <=
              new Date(
                obligation.dueDate,
              )
            );
          },
        )
        .reduce(
          (sum, obligation) =>
            sum +
            this.number(
              obligation.amount,
            ),
          0,
        );

    // ==========================================================
    // PRAZOS
    // ==========================================================

    const deadlines =
      activeObligations
        .filter(
          (obligation) =>
            obligation.status !==
            ObligationStatus.PAID,
        )
        .map(
          (obligation) => ({
            id:
              obligation.id,

            date:
              obligation.dueDate.toISOString(),

            title:
              obligation.title,

            description:
              obligation.description,

            amount:
              this.number(
                obligation.amount,
              ),

            type:
              obligation.type,

            daysLeft:
              obligation.daysLeft,

            status:
              obligation.displayStatus,

            obligationStatus:
              obligation.status,
          }),
        );

    // ==========================================================
    // PRÓXIMOS PRAZOS
    // ==========================================================

    const upcomingDeadlines =
      upcomingObligations.length;

    // ==========================================================
    // ALERTAS
    // ==========================================================

    const alerts =
      deadlines
        .filter(
          (deadline) =>
            deadline.daysLeft <= 3,
        )
        .map(
          (deadline) => {
            if (
              deadline.daysLeft <
              0
            ) {
              return {
                id:
                  deadline.id,

                title:
                  'Obrigação vencida',

                description:
                  deadline.title,

                type:
                  'danger',

                date:
                  deadline.date,
              };
            }

            if (
              deadline.daysLeft ===
              0
            ) {
              return {
                id:
                  deadline.id,

                title:
                  'Prazo vence hoje',

                description:
                  deadline.title,

                type:
                  'danger',

                date:
                  deadline.date,
              };
            }

            return {
              id:
                deadline.id,

              title:
                `Prazo vence em ${deadline.daysLeft} dias`,

              description:
                deadline.title,

              type:
                'warning',

              date:
                deadline.date,
            };
          },
        );

    // ==========================================================
    // FACTURAS RECENTES
    // ==========================================================

    const recentInvoices =
      await this.prisma.invoice.findMany({
        where: {
          tenantId,
        },

        orderBy: {
          createdAt:
            'desc',
        },

        take: 10,

        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          total: true,
          iva: true,
          withholdingTax: true,
          issuedAt: true,
          createdAt: true,
          clientId: true,
        },
      });

    // ==========================================================
    // OBRIGAÇÕES PENDENTES — FORMATO DO FRONTEND
    // ==========================================================

    const pendingObligationsResponse =
      pendingObligations
        .slice(0, 10)
        .map(
          (obligation) => ({
            id:
              obligation.id,

            title:
              obligation.title,

            description:
              obligation.description,

            amount:
              this.number(
                obligation.amount,
              ),

            dueDate:
              obligation.dueDate,

            period:
              obligation.period,

            status:
              obligation.status,

            type:
              obligation.type,

            taxType:
              obligation.fiscalCalendar
                ?.taxType ??
              null,

            daysLeft:
              obligation.daysLeft,
          }),
        );

    // ==========================================================
    // MÉTRICAS REAIS
    // ==========================================================

    const totalFiscalObligations =
      activeObligations.length;

    const paidFiscalObligations =
      paidObligations.length;

    const lateFiscalObligations =
      overdueObligations.length;

    const pendingFiscalObligations =
      pendingObligations.length;

    // ==========================================================
    // DASHBOARD
    // ==========================================================

    return {
      // ========================================================
      // EMPRESA REAL
      // ========================================================

      company: {
        id:
          tenant.id,

        name:
          tenant.name,

        nif:
          tenant.nif,

        regime:
          tenant.regime,

        sector:
          tenant.sector ||
          null,

        companyType:
          tenant.companyType,

        status:
          tenant.status,

        createdAt:
          tenant.createdAt,
      },

      // ========================================================
      // INDICADORES
      // ========================================================

      pendingObligations:
        pendingObligationsResponse,

      pendingObligationsCount:
        pendingFiscalObligations,

      upcomingDeadlines,

      overdueObligations:
        lateFiscalObligations,

      paymentsOnTime,

      finesAvoided:
        timelyPaidAmount,

      // ========================================================
      // MÉTRICAS
      // ========================================================

      metrics: {
        totalRevenue,

        pendingObligations:
          pendingFiscalObligations,

        totalObligations:
          totalFiscalObligations,

        paidObligations:
          paidFiscalObligations,

        overdueObligations:
          lateFiscalObligations,

        invoices:
          invoiceCount,

        pendingInvoices:
          pendingInvoiceCount,

        clients:
          clientCount,

        products:
          productCount,

        iva:
          this.round(
            taxMap.IVA?.value ||
              0,
          ),

        irt:
          this.round(
            taxMap.IRT?.value ||
              0,
          ),

        totalTaxes:
          this.round(
            totalTaxes,
          ),

        totalPayments:
          this.round(
            totalPayments,
          ),

        /*
         * Estes campos deixam de ter números fictícios.
         *
         * O frontend pode verificar null e simplesmente
         * não apresentar um "score" artificial.
         */

        fiscalScore:
          null,

        healthScore:
          null,
      },

      // ========================================================
      // PRAZOS
      // ========================================================

      deadlines,

      // ========================================================
      // ALERTAS
      // ========================================================

      alerts,

      // ========================================================
      // IMPOSTOS
      // ========================================================

      taxes,

      // ========================================================
      // PAGAMENTOS REAIS
      // ========================================================

      payments:
        paymentEvolution,

      paymentHistory:
        payments.map(
          (payment) => ({
            id:
              payment.id,

            taxType:
              payment.taxType,

            amount:
              this.number(
                payment.amount,
              ),

            reference:
              payment.reference,

            paymentMethod:
              payment.paymentMethod,

            paidAt:
              payment.paidAt,
          }),
        ),

      // ========================================================
      // FATURAS
      // ========================================================

      recentInvoices,

      // ========================================================
      // RECEITA
      // ========================================================

      monthlyRevenue,

      // ========================================================
      // GRÁFICO DE RECEITA
      // ========================================================

      chartData,

      // ========================================================
      // INFORMAÇÃO FINANCEIRA FISCAL
      // ========================================================

      financial: {
        totalRevenue:
          this.round(
            totalRevenue,
          ),

        totalTaxes:
          this.round(
            totalTaxes,
          ),

        totalPayments:
          this.round(
            totalPayments,
          ),

        timelyPaidAmount:
          this.round(
            timelyPaidAmount,
          ),
      },

      // ========================================================
      // METADADOS
      // ========================================================

      source: {
        type:
          'database',

        companySpecific:
          true,

        tenantId:
          tenant.id,

        generatedAt:
          new Date(),
      },

      synchronizedAt:
        new Date(),
    };
  }

  // ============================================================
  // NUMBER
  // ============================================================

  private number(
    value: unknown,
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
  // ROUND
  // ============================================================

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