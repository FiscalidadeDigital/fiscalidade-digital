import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ObligationStatus,
  TaxType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================
  // CRIAR FOLHA
  // =========================================================

  async create(
    tenantId: string,
    month: number,
    year: number,
  ) {
    this.validatePeriod(month, year);

    const period =
      `${year}-${String(month).padStart(2, '0')}`;

    const existing =
      await this.prisma.payroll.findUnique({
        where: {
          tenantId_period: {
            tenantId,
            period,
          },
        },
      });

    if (existing) {
      throw new BadRequestException(
        `Já existe uma folha para ${period}.`,
      );
    }

    const employees =
      await this.prisma.employee.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
        },

        include: {
          salaries: {
            where: {
              active: true,
            },

            orderBy: {
              effectiveFrom: 'desc',
            },

            take: 1,
          },

          dependents: {
            where: {
              taxDependent: true,
            },
          },
        },

        orderBy: {
          name: 'asc',
        },
      });

    const payroll =
      await this.prisma.payroll.create({
        data: {
          tenantId,
          period,
          month,
          year,

          employeeCount:
            employees.length,

          grossAmount: 0,
          socialSecurityAmount: 0,
          irtAmount: 0,
          otherDeductionsAmount: 0,
          netAmount: 0,

          items: {
            create: employees.map(
              (employee) => {
                const salary =
                  employee.salaries[0];

                const baseSalary =
                  this.toNumber(
                    salary?.baseSalary,
                  );

                const foodAllowance =
                  this.toNumber(
                    salary?.foodAllowance,
                  );

                const transportAllowance =
                  this.toNumber(
                    salary?.transportAllowance,
                  );

                const otherAllowances =
                  this.toNumber(
                    salary?.otherAllowances,
                  );

                const bonuses =
                  this.toNumber(
                    salary?.bonuses,
                  );

                const commissions =
                  this.toNumber(
                    salary?.commissions,
                  );

                const otherIncome =
                  this.toNumber(
                    salary?.otherIncome,
                  );

                const gross =
                  baseSalary +
                  foodAllowance +
                  transportAllowance +
                  otherAllowances +
                  bonuses +
                  commissions +
                  otherIncome;

                return {
                  employeeId:
                    employee.id,

                  employeeName:
                    employee.name,

                  employeeNif:
                    employee.nif ??
                    null,

                  socialSecurityNumber:
                    employee.socialSecurityNumber ??
                    null,

                  dependentCount:
                    employee.dependentCount ??
                    0,

                  baseSalary:
                    this.round(
                      baseSalary,
                    ),

                  foodAllowance:
                    this.round(
                      foodAllowance,
                    ),

                  transportAllowance:
                    this.round(
                      transportAllowance,
                    ),

                  otherAllowances:
                    this.round(
                      otherAllowances,
                    ),

                  bonuses:
                    this.round(
                      bonuses,
                    ),

                  commissions:
                    this.round(
                      commissions,
                    ),

                  otherIncome:
                    this.round(
                      otherIncome,
                    ),

                  grossAmount:
                    this.round(
                      gross,
                    ),

                  socialSecurityBase:
                    this.round(
                      gross,
                    ),

                  socialSecurityAmount:
                    0,

                  irtTaxableAmount:
                    0,

                  irtAmount:
                    0,

                  otherDeductions:
                    0,

                  netAmount:
                    this.round(
                      gross,
                    ),
                };
              },
            ),
          },
        },

        include: {
          items: {
            orderBy: {
              employeeName: 'asc',
            },
          },
        },
      });

    return this.calculate(
      tenantId,
      payroll.id,
    );
  }

  // =========================================================
  // LISTAR FOLHAS
  // =========================================================

  async findAll(
    tenantId: string,
  ) {
    return this.prisma.payroll.findMany({
      where: {
        tenantId,
      },

      include: {
        items: {
          orderBy: {
            employeeName: 'asc',
          },
        },
      },

      orderBy: [
        {
          year: 'desc',
        },
        {
          month: 'desc',
        },
      ],
    });
  }

  // =========================================================
  // FOLHA POR PERÍODO
  // =========================================================

  async findByPeriod(
    tenantId: string,
    year: number,
    month: number,
  ) {
    this.validatePeriod(
      month,
      year,
    );

    const period =
      `${year}-${String(month).padStart(2, '0')}`;

    const payroll =
      await this.prisma.payroll.findUnique({
        where: {
          tenantId_period: {
            tenantId,
            period,
          },
        },

        include: {
          items: {
            orderBy: {
              employeeName: 'asc',
            },
          },
        },
      });

    if (!payroll) {
      throw new NotFoundException(
        'Folha salarial não encontrada.',
      );
    }

    return payroll;
  }

  // =========================================================
  // CALCULAR / RECONCILIAR FOLHA
  // =========================================================

  async calculate(
    tenantId: string,
    payrollId: string,
  ) {
    const payroll =
      await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          tenantId,
        },

        include: {
          items: true,
        },
      });

    if (!payroll) {
      throw new NotFoundException(
        'Folha salarial não encontrada.',
      );
    }

    // =======================================================
    // FOLHA JÁ PAGA / FECHADA
    // =======================================================
    //
    // Não recalcular.
    //
    // Os valores já gravados continuam a ser a fonte oficial.
    //
    // Apenas reconciliamos as obrigações.
    // =======================================================

    if (
      payroll.status === 'PAID' ||
      payroll.status === 'CLOSED'
    ) {
      await this.updatePayrollObligations(
        tenantId,
        payroll,
        this.toNumber(
          payroll.socialSecurityAmount,
        ),
        this.toNumber(
          payroll.irtAmount,
        ),
      );

      const reconciledPayroll =
        await this.prisma.payroll.findFirst({
          where: {
            id: payroll.id,
            tenantId,
          },

          include: {
            items: {
              orderBy: {
                employeeName: 'asc',
              },
            },
          },
        });

      return (
        reconciledPayroll ??
        payroll
      );
    }

    const taxRules =
      await this.getTaxRules(
        tenantId,
      );

    const socialSecurityRate =
      this.findRate(
        taxRules,
        [
          'SS',
          'SEGURANCA_SOCIAL',
          'SEGURANÇA_SOCIAL',
          'SOCIAL_SECURITY',
        ],
      ) || 3;

    let grossTotal = 0;
    let socialSecurityTotal = 0;
    let irtTotal = 0;
    let otherDeductionsTotal = 0;
    let netTotal = 0;

    for (
      const item of payroll.items
    ) {
      const gross =
        this.toNumber(
          item.grossAmount,
        );

      const foodAllowance =
        this.toNumber(
          item.foodAllowance,
        );

      const transportAllowance =
        this.toNumber(
          item.transportAllowance,
        );

      const otherDeductions =
        this.toNumber(
          item.otherDeductions,
        );

      // =====================================================
      // SEGURANÇA SOCIAL
      // =====================================================

      const socialSecurityBase =
        Math.max(
          0,
          gross,
        );

      const socialSecurity =
        this.percentage(
          socialSecurityBase,
          socialSecurityRate,
        );

      // =====================================================
      // ALIMENTAÇÃO
      // =====================================================

      const exemptFood =
        Math.min(
          Math.max(
            0,
            foodAllowance,
          ),
          30000,
        );

      // =====================================================
      // TRANSPORTE
      // =====================================================

      const exemptTransport =
        Math.min(
          Math.max(
            0,
            transportAllowance,
          ),
          30000,
        );

      // =====================================================
      // MATÉRIA COLECTÁVEL IRT
      // =====================================================

      const irtTaxableAmount =
        Math.max(
          0,
          gross -
            socialSecurity -
            exemptFood -
            exemptTransport,
        );

      // =====================================================
      // IRT 2026
      // =====================================================

      const irt =
        this.calculateIRT2026(
          irtTaxableAmount,
        );

      // =====================================================
      // LÍQUIDO
      // =====================================================

      const net =
        gross -
        socialSecurity -
        irt -
        otherDeductions;

      await this.prisma.payrollItem.update({
        where: {
          id: item.id,
        },

        data: {
          grossAmount:
            this.round(
              gross,
            ),

          socialSecurityBase:
            this.round(
              socialSecurityBase,
            ),

          socialSecurityAmount:
            this.round(
              socialSecurity,
            ),

          irtTaxableAmount:
            this.round(
              irtTaxableAmount,
            ),

          irtAmount:
            this.round(
              irt,
            ),

          otherDeductions:
            this.round(
              otherDeductions,
            ),

          netAmount:
            this.round(
              net,
            ),
        },
      });

      grossTotal += gross;

      socialSecurityTotal +=
        socialSecurity;

      irtTotal += irt;

      otherDeductionsTotal +=
        otherDeductions;

      netTotal += net;
    }

    const updatedPayroll =
      await this.prisma.payroll.update({
        where: {
          id: payroll.id,
        },

        data: {
          status:
            'CALCULATED',

          grossAmount:
            this.round(
              grossTotal,
            ),

          socialSecurityAmount:
            this.round(
              socialSecurityTotal,
            ),

          irtAmount:
            this.round(
              irtTotal,
            ),

          otherDeductionsAmount:
            this.round(
              otherDeductionsTotal,
            ),

          netAmount:
            this.round(
              netTotal,
            ),

          processedAt:
            new Date(),
        },

        include: {
          items: {
            orderBy: {
              employeeName: 'asc',
            },
          },
        },
      });

    // =======================================================
    // SINCRONIZAR OBRIGAÇÕES
    // =======================================================

    await this.updatePayrollObligations(
      tenantId,
      updatedPayroll,
      socialSecurityTotal,
      irtTotal,
    );

    return updatedPayroll;
  }

  // =========================================================
  // IRT 2026 — GRUPO A
  // =========================================================

  private calculateIRT2026(
    taxableAmount: number,
  ): number {
    const amount =
      this.round(
        Math.max(
          0,
          taxableAmount,
        ),
      );

    if (
      amount <= 150000
    ) {
      return 0;
    }

    if (
      amount <= 200000
    ) {
      return this.round(
        12500 +
          (
            amount -
            150000
          ) *
            0.16,
      );
    }

    if (
      amount <= 300000
    ) {
      return this.round(
        31250 +
          (
            amount -
            200000
          ) *
            0.18,
      );
    }

    if (
      amount <= 500000
    ) {
      return this.round(
        49250 +
          (
            amount -
            300000
          ) *
            0.19,
      );
    }

    if (
      amount <= 1000000
    ) {
      return this.round(
        87250 +
          (
            amount -
            500000
          ) *
            0.20,
      );
    }

    if (
      amount <= 1500000
    ) {
      return this.round(
        187250 +
          (
            amount -
            1000000
          ) *
            0.21,
      );
    }

    if (
      amount <= 2000000
    ) {
      return this.round(
        292250 +
          (
            amount -
            1500000
          ) *
            0.22,
      );
    }

    if (
      amount <= 2500000
    ) {
      return this.round(
        402250 +
          (
            amount -
            2000000
          ) *
            0.23,
      );
    }

    if (
      amount <= 5000000
    ) {
      return this.round(
        517250 +
          (
            amount -
            2500000
          ) *
            0.24,
      );
    }

    if (
      amount <= 10000000
    ) {
      return this.round(
        1117250 +
          (
            amount -
            5000000
          ) *
            0.245,
      );
    }

    return this.round(
      2342250 +
        (
          amount -
          10000000
        ) *
          0.25,
    );
  }

  // =========================================================
  // APROVAR
  // =========================================================

  async approve(
    tenantId: string,
    payrollId: string,
  ) {
    const payroll =
      await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          tenantId,
        },
      });

    if (!payroll) {
      throw new NotFoundException(
        'Folha salarial não encontrada.',
      );
    }

    if (
      payroll.status !==
      'CALCULATED'
    ) {
      throw new BadRequestException(
        'A folha precisa ser calculada antes de ser aprovada.',
      );
    }

    return this.prisma.payroll.update({
      where: {
        id: payroll.id,
      },

      data: {
        status:
          'APPROVED',
      },

      include: {
        items: {
          orderBy: {
            employeeName: 'asc',
          },
        },
      },
    });
  }

  // =========================================================
  // PAGAR
  // =========================================================

  async pay(
    tenantId: string,
    payrollId: string,
  ) {
    const payroll =
      await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          tenantId,
        },
      });

    if (!payroll) {
      throw new NotFoundException(
        'Folha salarial não encontrada.',
      );
    }

    if (
      payroll.status !==
      'APPROVED'
    ) {
      throw new BadRequestException(
        'A folha precisa ser aprovada antes de ser marcada como paga.',
      );
    }

    // =======================================================
    // MARCAR COMO PAGA
    // =======================================================

    const paidPayroll =
      await this.prisma.payroll.update({
        where: {
          id: payroll.id,
        },

        data: {
          status:
            'PAID',
        },

        include: {
          items: {
            orderBy: {
              employeeName: 'asc',
            },
          },
        },
      });

    // =======================================================
    // RECONCILIAR OBRIGAÇÕES APÓS PAGAMENTO
    // =======================================================
    //
    // Isto garante que uma folha que passou por
    // CALCULATED → APPROVED → PAID não deixa a obrigação
    // em 0 Kz.
    // =======================================================

    await this.updatePayrollObligations(
      tenantId,
      paidPayroll,
      this.toNumber(
        paidPayroll.socialSecurityAmount,
      ),
      this.toNumber(
        paidPayroll.irtAmount,
      ),
    );

    return paidPayroll;
  }

  // =========================================================
  // REGRAS FISCAIS
  // =========================================================

  private async getTaxRules(
    tenantId: string,
  ): Promise<any[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
      select: {
        regime: true,
        sector: true,
        companyType: true,
      },
    });

    if (!tenant) {
      return [];
    }

    const rules = await this.prisma.taxRule.findMany({
      where: {
        active: true,
      },
      orderBy: [
        { validFrom: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const now = new Date();

    return rules.filter((rule) => {
      if (rule.validFrom && rule.validFrom > now) {
        return false;
      }

      if (rule.validTo && rule.validTo < now) {
        return false;
      }

      if (
        rule.regime &&
        String(rule.regime).toUpperCase() !==
          String(tenant.regime).toUpperCase()
      ) {
        return false;
      }

      if (
        rule.sector &&
        tenant.sector &&
        this.normalizeText(rule.sector) !==
          this.normalizeText(tenant.sector)
      ) {
        return false;
      }

      if (
        rule.companyType &&
        tenant.companyType &&
        this.normalizeText(rule.companyType) !==
          this.normalizeText(tenant.companyType)
      ) {
        return false;
      }

      return true;
    });
  }

  // =========================================================
  // TAXA
  // =========================================================

  private findRate(
    rules: any[],
    names: string[],
  ): number {
    for (
      const rule of rules
    ) {
      const type =
        String(
          rule.taxType ??
            rule.type ??
            rule.code ??
            '',
        )
          .trim()
          .toUpperCase();

      if (
        names.includes(type)
      ) {
        return this.toNumber(
          rule.rate ??
            rule.value ??
            rule.percentage ??
            0,
        );
      }
    }

    return 0;
  }

  // =========================================================
  // NORMALIZAR TEXTO
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
      .toUpperCase()
      .replace(
        /[–—−]/g,
        '-',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim();
  }

  // =========================================================
  // MÊS
  // =========================================================

  private getMonthName(
    month: number,
  ): string {
    const months = [
      'JANEIRO',
      'FEVEREIRO',
      'MARCO',
      'ABRIL',
      'MAIO',
      'JUNHO',
      'JULHO',
      'AGOSTO',
      'SETEMBRO',
      'OUTUBRO',
      'NOVEMBRO',
      'DEZEMBRO',
    ];

    return (
      months[month - 1] ??
      ''
    );
  }

  // =========================================================
  // MÊS SEGUINTE
  // =========================================================

  private getNextMonth(
    month: number,
    year: number,
  ) {
    if (
      month === 12
    ) {
      return {
        month: 1,
        year: year + 1,
      };
    }

    return {
      month: month + 1,
      year,
    };
  }

  // =========================================================
  // ENCONTRAR REGRA DO MÊS DE ENTREGA
  // =========================================================

  private async findPayrollCalendarRule(
    tenantId: string,
    taxType: TaxType,
    payrollMonth: number,
    payrollYear: number,
  ): Promise<any | null> {
    const tenant =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },

        select: {
          regime: true,
        },
      });

    if (!tenant) {
      return null;
    }

    // =======================================================
    // A OBRIGAÇÃO É DO MÊS SEGUINTE À FOLHA
    // =======================================================

    const next =
      this.getNextMonth(
        payrollMonth,
        payrollYear,
      );

    const calendarYear =
      next.year;

    const rules =
      await this.prisma.fiscalCalendar.findMany({
        where: {
          active: true,

          referenceYear:
            calendarYear,

          taxType,

          regimes: {
            some: {
              regime:
                tenant.regime,
            },
          },
        },

        include: {
          regimes: true,
        },

        orderBy: {
          dueDate: 'asc',
        },
      });

    if (
      rules.length === 0
    ) {
      console.warn(
        `[Payroll] Nenhuma regra ${taxType} encontrada para ${tenant.regime}, ${next.month}/${next.year}.`,
      );

      return null;
    }

    const expectedMonth =
      this.getMonthName(
        next.month,
      );

    const scored =
      rules
        .map(
          (rule) => {
            const title =
              this.normalizeText(
                rule.title,
              );

            const description =
              this.normalizeText(
                rule.description,
              );

            const period =
              this.normalizeText(
                rule.period,
              );

            const text =
              `${title} ${description}`;

            const dueDate =
              new Date(
                rule.dueDate,
              );

            /*
             * A regra da AGT pode indicar:
             * - o mês do vencimento (ex.: OUTUBRO); ou
             * - o mês de referência da folha (ex.: SETEMBRO),
             *   quando o texto indica "mês anterior".
             *
             * Por isso, não podemos exigir apenas o mês seguinte.
             */
            const referenceMonth =
              this.getMonthName(payrollMonth);

            const normalizedText =
              this.normalizeText(text);

            const mentionsPreviousMonth =
              normalizedText.includes('MES ANTERIOR') ||
              normalizedText.includes('MES DE REFERENCIA') ||
              normalizedText.includes('REFERENTE AO MES');
            const correctPeriod =
              period === expectedMonth ||
              period === String(next.month) ||
              period === String(next.month).padStart(2, '0') ||
              (
                mentionsPreviousMonth &&
                (
                  period === referenceMonth ||
                  period === String(payrollMonth) ||
                  period === String(payrollMonth).padStart(2, '0')
                )
              );

            const correctDueDate =
              !Number.isNaN(
                dueDate.getTime(),
              ) &&
              dueDate.getFullYear() ===
                next.year &&
              dueDate.getMonth() + 1 ===
                next.month;

            let score = 0;

            // ===============================================
            // IRT
            // ===============================================

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
                  'MES ANTERIOR',
                )
              ) {
                score += 200;
              }

              if (
                text.includes(
                  'GRUPOS B E C',
                ) ||
                text.includes(
                  'GRUPO B',
                ) ||
                text.includes(
                  'GRUPO C',
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

              if (
                text.includes(
                  'ANUAL',
                )
              ) {
                score -= 5000;
              }
            }

            // ===============================================
            // SEGURANÇA SOCIAL
            // ===============================================

            if (
              taxType ===
              TaxType.SS
            ) {
              if (
                text.includes(
                  'SEGURANCA SOCIAL',
                )
              ) {
                score += 500;
              }

              if (
                text.includes(
                  'SEGURANCA',
                )
              ) {
                score += 200;
              }

              if (
                text.includes(
                  'MES ANTERIOR',
                )
              ) {
                score += 200;
              }

              if (
                text.includes(
                  'ANUAL',
                )
              ) {
                score -= 5000;
              }
            }

            // ===============================================
            // MÊS CORRETO
            // ===============================================

            if (
              correctPeriod
            ) {
              score += 1000;
            } else {
              score -= 1000;
            }

            // ===============================================
            // DATA CORRETA
            // ===============================================

            if (
              correctDueDate
            ) {
              score += 1500;
            } else {
              score -= 1500;
            }

            return {
              rule,
              score,
              correctPeriod,
              correctDueDate,
              text,
            };
          },
        )
        .sort(
          (a, b) =>
            b.score -
            a.score,
        );

    const best =
      scored[0];

    if (!best) {
      return null;
    }

    // =======================================================
    // VALIDAÇÃO IRT
    // =======================================================

    if (
      taxType ===
      TaxType.IRT
    ) {
      const text =
        best.text;

      const isGroupA =
        text.includes(
          'GRUPO A',
        );

      const isPayrollMap =
        text.includes(
          'MAPA DE REMUNERACOES',
        );

      const isGroupBC =
        text.includes(
          'GRUPOS B E C',
        ) ||
        text.includes(
          'GRUPO B',
        ) ||
        text.includes(
          'GRUPO C',
        );

      if (
        !isGroupA ||
        !isPayrollMap ||
        isGroupBC ||
        !best.correctPeriod ||
        !best.correctDueDate
      ) {
        console.warn(
          `[Payroll] Regra IRT rejeitada para folha ${payrollYear}-${String(payrollMonth).padStart(2, '0')}.`,
        );

        return null;
      }
    }

    // =======================================================
    // VALIDAÇÃO SS
    // =======================================================

    if (
      taxType ===
      TaxType.SS
    ) {
      if (
        !best.correctPeriod ||
        !best.correctDueDate
      ) {
        return null;
      }
    }

    return best.rule;
  }

  // =========================================================
  // SINCRONIZAR OBRIGAÇÃO DA FOLHA
  // =========================================================

  private async syncPayrollTaxObligation(
    tenantId: string,
    payroll: any,
    taxType: TaxType,
    amount: number,
  ) {
    const payrollMonth =
      Number(
        payroll.month,
      );

    const payrollYear =
      Number(
        payroll.year,
      );

    // =======================================================
    // ENCONTRAR A REGRA DO MÊS SEGUINTE
    // =======================================================

    const rule =
      await this.findPayrollCalendarRule(
        tenantId,
        taxType,
        payrollMonth,
        payrollYear,
      );

    if (!rule) {
      console.warn(
        `[Payroll] Calendário fiscal não encontrado para ${taxType} - folha ${payroll.period}.`,
      );

      return null;
    }

    // =======================================================
    // IMPORTANTE:
    //
    // O PERÍODO DA OBRIGAÇÃO É O PERÍODO DA REGRA AGT,
    // NÃO O PERÍODO DA FOLHA.
    //
    // Exemplo:
    //
    // Folha Setembro
    //     ↓
    // Obrigação Outubro
    // =======================================================

    const obligationPeriod =
      String(
        rule.period ??
          this.getMonthName(
            this.getNextMonth(
              payrollMonth,
              payrollYear,
            ).month,
          ),
      ).trim();

    const normalizedRuleTitle =
      this.normalizeText(
        rule.title,
      );

    const normalizedRuleDescription =
      this.normalizeText(
        rule.description,
      );

    // =======================================================
    // PROCURAR OBRIGAÇÃO CORRESPONDENTE
    // =======================================================
    //
    // Primeiro procuramos pelo calendário + período.
    // Isso evita confundir obrigações de meses diferentes.
    // =======================================================

    let existing =
      await this.prisma.fiscalObligation.findFirst({
        where: {
          tenantId,

          fiscalCalendarId:
            rule.id,

          period:
            obligationPeriod,

          type:
            rule.obligationType,
        },
      });

    // =======================================================
    // FALLBACK:
    //
    // Procurar obrigação equivalente do mesmo período.
    // =======================================================

    if (!existing) {
      const obligations =
        await this.prisma.fiscalObligation.findMany({
          where: {
            tenantId,

            period:
              obligationPeriod,

            type:
              rule.obligationType,
          },

          orderBy: {
            createdAt: 'asc',
          },
        });

      for (
        const obligation of obligations
      ) {
        const title =
          this.normalizeText(
            obligation.title,
          );

        const description =
          this.normalizeText(
            obligation.description,
          );

        const text =
          `${title} ${description}`;

        // =====================================================
        // IRT — GRUPO A
        // =====================================================

        if (
          taxType ===
          TaxType.IRT
        ) {
          const isGroupA =
            text.includes(
              'GRUPO A',
            );

          const isPayrollMap =
            text.includes(
              'MAPA DE REMUNERACOES',
            );

          const isGroupBC =
            text.includes(
              'GRUPOS B E C',
            ) ||
            text.includes(
              'GRUPO B',
            ) ||
            text.includes(
              'GRUPO C',
            );

          if (
            isGroupA &&
            isPayrollMap &&
            !isGroupBC
          ) {
            existing =
              obligation;

            break;
          }
        }

        // =====================================================
        // SS
        // =====================================================

        if (
          taxType ===
          TaxType.SS
        ) {
          if (
            text.includes(
              'SEGURANCA SOCIAL',
            ) ||
            text.includes(
              'SEGURANCA',
            )
          ) {
            existing =
              obligation;

            break;
          }
        }
      }
    }

    // =======================================================
    // DATA DO CALENDÁRIO
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
      console.warn(
        `[Payroll] Data inválida na regra ${rule.id}.`,
      );

      return null;
    }

    const now =
      new Date();

    const calculatedStatus =
      dueDate < now
        ? ObligationStatus.LATE
        : ObligationStatus.PENDING;

    // =======================================================
    // OBRIGAÇÃO JÁ PAGA
    // =======================================================
    //
    // Nunca alteramos o valor ou estado de uma obrigação
    // que já foi paga.
    // =======================================================

    if (
      existing &&
      existing.status ===
        ObligationStatus.PAID
    ) {
      console.log(
        `[Payroll] ${taxType} ${obligationPeriod}: obrigação já paga. Nenhuma alteração realizada.`,
      );

      return existing;
    }

    // =======================================================
    // ACTUALIZAR
    // =======================================================

    if (existing) {
      const updated =
        await this.prisma.fiscalObligation.update({
          where: {
            id: existing.id,
          },

          data: {
            fiscalCalendarId:
              rule.id,

            title:
              normalizedRuleTitle
                ? rule.title
                : existing.title,

            description:
              normalizedRuleDescription
                ? rule.description
                : existing.description,

            type:
              rule.obligationType,

            dueDate:
              rule.dueDate,

            period:
              obligationPeriod,

            amount:
              this.round(
                amount,
              ),

            status:
              calculatedStatus,

            alertEnabled:
              existing.alertEnabled ??
              true,

            alertDaysBefore:
              existing.alertDaysBefore ??
              7,
          },
        });

      console.log(
        `[Payroll] ${taxType}: obrigação actualizada.`,
      );

      console.log(
        `[Payroll] Folha=${payroll.period} → Obrigação=${obligationPeriod}`,
      );

      console.log(
        `[Payroll] Valor=${this.round(amount)} Kz`,
      );

      console.log(
        `[Payroll] Vencimento=${dueDate.toISOString()}`,
      );

      return updated;
    }

    // =======================================================
    // CRIAR
    // =======================================================

    const created =
      await this.prisma.fiscalObligation.create({
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

          amount:
            this.round(
              amount,
            ),

          dueDate:
            rule.dueDate,

          period:
            obligationPeriod,

          status:
            calculatedStatus,

          alertEnabled:
            true,

          alertDaysBefore:
            7,

          reminderSent:
            false,
        },
      });

    console.log(
      `[Payroll] ${taxType}: nova obrigação criada.`,
    );

    console.log(
      `[Payroll] Folha=${payroll.period} → Obrigação=${obligationPeriod}`,
    );

    console.log(
      `[Payroll] Valor=${this.round(amount)} Kz`,
    );

    console.log(
      `[Payroll] Vencimento=${dueDate.toISOString()}`,
    );

    return created;
  }

  // =========================================================
  // ACTUALIZAR OBRIGAÇÕES
  // =========================================================

  private async updatePayrollObligations(
    tenantId: string,
    payroll: any,
    socialSecurityAmount: number,
    irtAmount: number,
  ) {
    // =======================================================
    // IRT GRUPO A
    // =======================================================

    try {
      await this.syncPayrollTaxObligation(
        tenantId,
        payroll,
        TaxType.IRT,
        irtAmount,
      );
    } catch (error) {
      console.error(
        '[Payroll] Erro ao sincronizar obrigação IRT:',
        error,
      );
    }

    // =======================================================
    // SEGURANÇA SOCIAL
    // =======================================================

    try {
      await this.syncPayrollTaxObligation(
        tenantId,
        payroll,
        TaxType.SS,
        socialSecurityAmount,
      );
    } catch (error) {
      console.error(
        '[Payroll] Erro ao sincronizar obrigação SS:',
        error,
      );
    }
  }

  // =========================================================
  // VALIDAR PERÍODO
  // =========================================================

  private validatePeriod(
    month: number,
    year: number,
  ) {
    if (
      !Number.isInteger(
        month,
      ) ||
      month < 1 ||
      month > 12
    ) {
      throw new BadRequestException(
        'Mês inválido.',
      );
    }

    if (
      !Number.isInteger(
        year,
      ) ||
      year < 2000 ||
      year > 2100
    ) {
      throw new BadRequestException(
        'Ano inválido.',
      );
    }
  }

  // =========================================================
  // NUMBER
  // =========================================================

  private toNumber(
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
      return Number(
        (
          value as any
        ).toNumber(),
      );
    }

    if (
      typeof value ===
        'object' &&
      value !== null &&
      'toString' in value
    ) {
      const parsed =
        Number(
          String(value),
        );

      return Number.isFinite(
        parsed,
      )
        ? parsed
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
  // PERCENTAGEM
  // =========================================================

  private percentage(
    amount: number,
    rate: number,
  ): number {
    if (
      amount <= 0 ||
      rate <= 0
    ) {
      return 0;
    }

    return this.round(
      amount *
        (rate / 100),
    );
  }

  // =========================================================
  // ROUND
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