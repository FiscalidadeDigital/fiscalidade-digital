import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ObligationStatus,
  Prisma,
  TaxType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  assertSupportedPayrollYear,
  PAYROLL_CALCULATION_STATUS,
  PAYROLL_RULE_VERSION_2026,
  resolveSocialSecurityRates,
} from '../fiscal-rules/payroll-rules';
import { calculatePayrollItem } from './payroll-calculator';

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
    actorUserId?: string,
  ) {
    this.validatePeriod(month, year);

    try {
      assertSupportedPayrollYear(year);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'O período não tem regras fiscais validadas.',
      );
    }

    const period = year + '-' + String(month).padStart(2, '0');
    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    const payroll = await this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRawUnsafe(
        'SELECT pg_advisory_xact_lock(hashtext($1))',
        tenantId + ':' + period,
      );

      const existing = await transaction.payroll.findUnique({
        where: {
          tenantId_period: {
            tenantId,
            period,
          },
        },
      });

      if (existing) {
        throw new BadRequestException(
          'Já existe uma folha para ' + period + '.',
        );
      }

      const employees = await transaction.employee.findMany({
        where: {
          tenantId,
          status: {
            in: ['ACTIVE', 'TERMINATED'],
          },
          OR: [{ hireDate: null }, { hireDate: { lt: periodEnd } }],
          AND: [
            {
              OR: [
                { terminationDate: null },
                { terminationDate: { gte: periodStart } },
              ],
            },
          ],
        },
        include: {
          salaries: {
            where: {
              effectiveFrom: {
                lte: periodStart,
              },
              OR: [
                { effectiveTo: null },
                { effectiveTo: { gt: periodStart } },
              ],
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

      const partialPeriodEmployees = employees.filter(
        (employee) =>
          (employee.hireDate && employee.hireDate > periodStart) ||
          (employee.terminationDate && employee.terminationDate < periodEnd),
      );

      if (partialPeriodEmployees.length > 0) {
        throw new BadRequestException(
          'A folha de ' +
            period +
            ' inclui admissões ou cessações a meio do mês, ainda sem regra de proporcionalidade validada: ' +
            partialPeriodEmployees
              .map((employee) => employee.name)
              .join(', ') +
            '.',
        );
      }

      const employeeIds = employees.map((employee) => employee.id);
      const salaryChange =
        employeeIds.length > 0
          ? await transaction.employeeSalary.findFirst({
              where: {
                employeeId: {
                  in: employeeIds,
                },
                effectiveFrom: {
                  gt: periodStart,
                  lt: periodEnd,
                },
              },
              include: {
                employee: {
                  select: {
                    name: true,
                  },
                },
              },
            })
          : null;

      if (salaryChange) {
        throw new BadRequestException(
          'A folha de ' +
            period +
            ' tem uma alteração salarial a meio do mês para ' +
            salaryChange.employee.name +
            '; a proporcionalidade ainda não está validada.',
        );
      }

      const withoutSalary = employees.filter(
        (employee) => !employee.salaries[0],
      );

      if (withoutSalary.length > 0) {
        throw new BadRequestException(
          'Registe um salário vigente no início de ' +
            period +
            ' para: ' +
            withoutSalary.map((employee) => employee.name).join(', ') +
            '.',
        );
      }

      for (const employee of employees) {
        try {
          resolveSocialSecurityRates(employee.socialSecurityCategory);
        } catch (error) {
          throw new BadRequestException(
            employee.name +
              ': ' +
              (error instanceof Error
                ? error.message
                : 'enquadramento contributivo inválido'),
          );
        }
      }

      return transaction.payroll.create({
        data: {
          tenantId,
          period,
          month,
          year,
          employeeCount: employees.length,
          grossAmount: 0,
          socialSecurityAmount: 0,
          employerSocialSecurityAmount: 0,
          irtAmount: 0,
          otherDeductionsAmount: 0,
          netAmount: 0,
          taxRuleVersion: PAYROLL_RULE_VERSION_2026,
          calculationStatus: PAYROLL_CALCULATION_STATUS,
          items: {
            create: employees.map((employee) => {
              const salary = employee.salaries[0]!;
              const grossAmount = new Prisma.Decimal(salary.baseSalary)
                .add(salary.foodAllowance)
                .add(salary.transportAllowance)
                .add(salary.otherAllowances)
                .add(salary.bonuses)
                .add(salary.commissions)
                .add(salary.otherIncome)
                .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

              return {
                employeeId: employee.id,
                employeeName: employee.name,
                employeeNif: employee.nif ?? null,
                socialSecurityNumber:
                  employee.socialSecurityNumber ?? null,
                socialSecurityCategory:
                  employee.socialSecurityCategory,
                dependentCount: employee.dependentCount ?? 0,
                baseSalary: salary.baseSalary,
                foodAllowance: salary.foodAllowance,
                transportAllowance: salary.transportAllowance,
                otherAllowances: salary.otherAllowances,
                bonuses: salary.bonuses,
                commissions: salary.commissions,
                otherIncome: salary.otherIncome,
                grossAmount,
                socialSecurityBase: grossAmount,
                socialSecurityAmount: 0,
                employeeSocialSecurityRate: 0,
                employerSocialSecurityRate: 0,
                employerSocialSecurityAmount: 0,
                irtTaxableAmount: 0,
                irtAmount: 0,
                otherDeductions: 0,
                netAmount: grossAmount,
                taxRuleVersion: PAYROLL_RULE_VERSION_2026,
                calculationStatus: PAYROLL_CALCULATION_STATUS,
              };
            }),
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
    });

    return this.calculate(tenantId, payroll.id, actorUserId);
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
    actorUserId?: string,
  ) {
    const payroll = await this.prisma.payroll.findFirst({
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

    const socialSecurityObligationAmount =
      payroll.taxRuleVersion === PAYROLL_RULE_VERSION_2026
        ? payroll.socialSecurityAmount.add(
            payroll.employerSocialSecurityAmount,
          )
        : payroll.socialSecurityAmount;

    if (
      payroll.status === 'PAID' ||
      payroll.status === 'CLOSED'
    ) {
      await this.updatePayrollObligations(
        tenantId,
        payroll,
        socialSecurityObligationAmount,
        payroll.irtAmount,
      );

      return (
        (await this.prisma.payroll.findFirst({
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
        })) ?? payroll
      );
    }

    if (payroll.status === 'APPROVED') {
      throw new BadRequestException(
        'Uma folha aprovada não pode ser recalculada. Reverta a aprovação através de um fluxo auditável antes de alterar valores.',
      );
    }

    try {
      assertSupportedPayrollYear(payroll.year);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'O período não tem regras fiscais validadas.',
      );
    }

    const calculations = payroll.items.map((item) => {
      try {
        return {
          item,
          result: calculatePayrollItem({
            year: payroll.year,
            socialSecurityCategory:
              item.socialSecurityCategory,
            baseSalary: item.baseSalary,
            foodAllowance: item.foodAllowance,
            transportAllowance: item.transportAllowance,
            otherAllowances: item.otherAllowances,
            bonuses: item.bonuses,
            commissions: item.commissions,
            otherIncome: item.otherIncome,
            otherDeductions: item.otherDeductions,
          }),
        };
      } catch (error) {
        throw new BadRequestException(
          item.employeeName +
            ': ' +
            (error instanceof Error
              ? error.message
              : 'não foi possível calcular a folha'),
        );
      }
    });

    const zero = new Prisma.Decimal(0);
    const totals = calculations.reduce(
      (current, calculation) => ({
        gross: current.gross.add(
          calculation.result.grossAmount,
        ),
        socialSecurity: current.socialSecurity.add(
          calculation.result.socialSecurityAmount,
        ),
        employerSocialSecurity:
          current.employerSocialSecurity.add(
            calculation.result.employerSocialSecurityAmount,
          ),
        irt: current.irt.add(
          calculation.result.irtAmount,
        ),
        otherDeductions: current.otherDeductions.add(
          calculation.result.otherDeductions,
        ),
        net: current.net.add(
          calculation.result.netAmount,
        ),
      }),
      {
        gross: zero,
        socialSecurity: zero,
        employerSocialSecurity: zero,
        irt: zero,
        otherDeductions: zero,
        net: zero,
      },
    );

    const updatedPayroll = await this.prisma.$transaction(
      async (transaction) => {
        const claimed = await transaction.payroll.updateMany({
          where: {
            id: payroll.id,
            tenantId,
            status: {
              in: ['DRAFT', 'CALCULATED'],
            },
          },
          data: {
            processedAt: new Date(),
          },
        });

        if (claimed.count !== 1) {
          throw new BadRequestException(
            'O estado da folha foi alterado por outra operação. Actualize os dados antes de tentar novamente.',
          );
        }

        for (const calculation of calculations) {
          const result = calculation.result;

          await transaction.payrollItem.update({
            where: {
              id: calculation.item.id,
            },
            data: {
              grossAmount: result.grossAmount,
              socialSecurityBase: result.socialSecurityBase,
              employeeSocialSecurityRate:
                result.employeeSocialSecurityRate,
              socialSecurityAmount:
                result.socialSecurityAmount,
              employerSocialSecurityRate:
                result.employerSocialSecurityRate,
              employerSocialSecurityAmount:
                result.employerSocialSecurityAmount,
              irtTaxableAmount: result.irtTaxableAmount,
              irtAmount: result.irtAmount,
              otherDeductions: result.otherDeductions,
              netAmount: result.netAmount,
              taxRuleVersion: result.taxRuleVersion,
              calculationStatus: result.calculationStatus,
            },
          });
        }

        const result = await transaction.payroll.update({
          where: {
            id: payroll.id,
          },
          data: {
            status: 'CALCULATED',
            grossAmount: totals.gross,
            socialSecurityAmount: totals.socialSecurity,
            employerSocialSecurityAmount:
              totals.employerSocialSecurity,
            irtAmount: totals.irt,
            otherDeductionsAmount:
              totals.otherDeductions,
            netAmount: totals.net,
            taxRuleVersion: PAYROLL_RULE_VERSION_2026,
            calculationStatus: PAYROLL_CALCULATION_STATUS,
            processedAt: new Date(),
          },
          include: {
            items: {
              orderBy: {
                employeeName: 'asc',
              },
            },
          },
        });

        await transaction.auditLog.create({
          data: {
            tenantId,
            userId: actorUserId ?? null,
            action: 'PAYROLL_CALCULATED',
            entity: 'Payroll',
            entityId: payroll.id,
            oldData: {
              status: payroll.status,
            },
            newData: {
              status: 'CALCULATED',
              taxRuleVersion: PAYROLL_RULE_VERSION_2026,
              calculationStatus: PAYROLL_CALCULATION_STATUS,
            },
          },
        });

        return result;
      },
    );

    await this.updatePayrollObligations(
      tenantId,
      updatedPayroll,
      totals.socialSecurity.add(
        totals.employerSocialSecurity,
      ),
      totals.irt,
    );

    return updatedPayroll;
  }
  // =========================================================
  // APROVAR
  // =========================================================

  async approve(
    tenantId: string,
    payrollId: string,
    actorUserId?: string,
  ) {
    return this.transitionPayrollStatus(
      tenantId,
      payrollId,
      'CALCULATED',
      'APPROVED',
      'A folha precisa ser calculada antes de ser aprovada.',
      actorUserId,
    );
  }

  // =========================================================
  // PAGAR
  // =========================================================

  async pay(
    tenantId: string,
    payrollId: string,
    actorUserId?: string,
  ) {
    const paidPayroll = await this.transitionPayrollStatus(
      tenantId,
      payrollId,
      'APPROVED',
      'PAID',
      'A folha precisa ser aprovada antes de ser marcada como paga.',
      actorUserId,
    );

    await this.updatePayrollObligations(
      tenantId,
      paidPayroll,
      paidPayroll.taxRuleVersion === PAYROLL_RULE_VERSION_2026
        ? paidPayroll.socialSecurityAmount.add(
            paidPayroll.employerSocialSecurityAmount,
          )
        : paidPayroll.socialSecurityAmount,
      paidPayroll.irtAmount,
    );

    return paidPayroll;
  }

  // =========================================================
  // FECHAR
  // =========================================================

  async close(
    tenantId: string,
    payrollId: string,
    actorUserId?: string,
  ) {
    return this.transitionPayrollStatus(
      tenantId,
      payrollId,
      'PAID',
      'CLOSED',
      'A folha precisa estar paga antes de ser fechada.',
      actorUserId,
    );
  }

  private async transitionPayrollStatus(
    tenantId: string,
    payrollId: string,
    expectedStatus: 'CALCULATED' | 'APPROVED' | 'PAID',
    nextStatus: 'APPROVED' | 'PAID' | 'CLOSED',
    invalidStateMessage: string,
    actorUserId?: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const payroll = await transaction.payroll.findFirst({
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

      if (payroll.status !== expectedStatus) {
        throw new BadRequestException(invalidStateMessage);
      }

      const updated = await transaction.payroll.updateMany({
        where: {
          id: payrollId,
          tenantId,
          status: expectedStatus,
        },
        data: {
          status: nextStatus,
        },
      });

      if (updated.count !== 1) {
        throw new BadRequestException(
          'O estado da folha foi alterado por outra operação. Actualize os dados antes de tentar novamente.',
        );
      }

      await transaction.auditLog.create({
        data: {
          tenantId,
          userId: actorUserId ?? null,
          action: 'PAYROLL_STATUS_CHANGED',
          entity: 'Payroll',
          entityId: payrollId,
          oldData: {
            status: expectedStatus,
          },
          newData: {
            status: nextStatus,
          },
        },
      });

      const result = await transaction.payroll.findFirst({
        where: {
          id: payrollId,
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

      if (!result) {
        throw new NotFoundException(
          'Folha salarial não encontrada.',
        );
      }

      return result;
    });
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

            const mentionsPreviousMonth =
              text.includes('MES ANTERIOR') ||
              text.includes('MES DE REFERENCIA') ||
              text.includes('MES DE REFERÊNCIA') ||
              text.includes('REFERENTE AO MES') ||
              text.includes('REFERENTE AO MÊS');

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
    amount: Prisma.Decimal,
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

            amount: amount.toNumber(),
            amountValue: amount,

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
        `[Payroll] Valor=${amount.toFixed(2)} Kz`,
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

          amount: amount.toNumber(),
          amountValue: amount,

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
      `[Payroll] Valor=${amount.toFixed(2)} Kz`,
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
    socialSecurityAmount: Prisma.Decimal,
    irtAmount: Prisma.Decimal,
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


}
