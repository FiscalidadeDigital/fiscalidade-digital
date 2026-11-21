import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DeclarationStatus,
  Prisma,
  TaxType,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /*
   * ==========================================================
   * LISTAR PAGAMENTOS
   * ==========================================================
   */

  async findAll(
    tenantId: string,
    filters?: {
      taxType?: TaxType;
      startDate?: string;
      endDate?: string;
    },
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado.',
      );
    }

    const where: Prisma.TaxPaymentWhereInput = {
      tenantId,
    };

    if (filters?.taxType) {
      where.taxType =
        filters.taxType;
    }

    if (
      filters?.startDate ||
      filters?.endDate
    ) {
      where.paidAt = {};

      if (filters.startDate) {
        where.paidAt.gte =
          new Date(
            filters.startDate,
          );
      }

      if (filters.endDate) {
        const endDate =
          new Date(
            filters.endDate,
          );

        /*
         * Inclui o dia inteiro.
         */

        endDate.setHours(
          23,
          59,
          59,
          999,
        );

        where.paidAt.lte =
          endDate;
      }
    }

    const payments =
      await this.prisma.taxPayment.findMany(
        {
          where,

          orderBy: {
            paidAt: 'desc',
          },

          include: {
            declaration: {
              select: {
                id: true,
                taxType: true,
                period: true,
                declaredAmount: true,
                paidAmount: true,
                status: true,
                declarationDate: true,
                paymentDate: true,
              },
            },
          },
        },
      );

    return payments.map(
      (payment) => ({
        id: payment.id,

        tenantId:
          payment.tenantId,

        declarationId:
          payment.declarationId,

        taxType:
          payment.taxType,

        amount:
          payment.amount,

        reference:
          payment.reference,

        paymentMethod:
          payment.paymentMethod,

        paidAt:
          payment.paidAt,

        status: 'PAID',

        description:
          this.getTaxDescription(
            payment.taxType,
          ),

        tax:
          this.getTaxDescription(
            payment.taxType,
          ),

        declaration:
          payment.declaration,
      }),
    );
  }

  /*
   * ==========================================================
   * OBTER PAGAMENTO
   * ==========================================================
   */

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const payment =
      await this.prisma.taxPayment.findFirst(
        {
          where: {
            id,
            tenantId,
          },

          include: {
            declaration: true,
          },
        },
      );

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    return {
      ...payment,

      status: 'PAID',

      description:
        this.getTaxDescription(
          payment.taxType,
        ),

      tax:
        this.getTaxDescription(
          payment.taxType,
        ),
    };
  }

  /*
   * ==========================================================
   * CRIAR PAGAMENTO
   * ==========================================================
   */

  async create(
    tenantId: string,
    dto: CreatePaymentDto,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado.',
      );
    }

    const amount =
      this.normalizePaymentAmount(
        dto.amount,
      );

    const reference =
      dto.reference?.trim() ||
      null;

    const paidAt =
      this.resolvePaymentDate(
        dto.paidAt,
      );

    /*
     * ========================================================
     * TRANSACTION
     * ========================================================
     */

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          /*
           * O saldo é sempre relido dentro da transação. O bloqueio
           * serializa pagamentos concorrentes para a mesma declaração e
           * protege tentativas repetidas com a mesma referência.
           */
          const lockScopes = [
            dto.declarationId
              ? `tax-declaration:${tenantId}:${dto.declarationId}`
              : null,
            reference
              ? `tax-payment-reference:${tenantId}:${reference}`
              : null,
          ]
            .filter((scope): scope is string => Boolean(scope))
            .sort();

          for (const lockScope of lockScopes) {
            await tx.$queryRaw`
              SELECT pg_advisory_xact_lock(
                hashtextextended(${lockScope}, 0)
              )::text AS lock
            `;
          }

          /*
           * A referência identifica o comprovativo externo. Uma repetição
           * exacta devolve o pagamento já confirmado; uma referência usada
           * com outros valores é recusada antes de afectar os totais.
           */
          if (reference) {
            const existing =
              await tx.taxPayment.findFirst({
                where: {
                  tenantId,
                  reference,
                },
                include: {
                  declaration: true,
                },
              });

            if (existing) {
              if (
                existing.taxType !==
                  dto.taxType ||
                existing.declarationId !==
                  (dto.declarationId ?? null) ||
                this.normalizeStoredAmount(
                  existing.amount,
                ) !== amount
              ) {
                throw new ConflictException(
                  'A referência de pagamento já está associada a outro registo.',
                );
              }

              return existing;
            }
          }

          let declaration:
            | {
                id: string;
                taxType: TaxType;
                declaredAmount: number;
                paidAmount: number;
              }
            | null = null;

          if (dto.declarationId) {
            declaration =
              await tx.taxDeclaration.findFirst({
                where: {
                  id: dto.declarationId,
                  tenantId,
                },
              });

            if (!declaration) {
              throw new NotFoundException(
                'Declaração fiscal não encontrada.',
              );
            }

            if (
              declaration.taxType !==
              dto.taxType
            ) {
              throw new BadRequestException(
                'O tipo de imposto do pagamento não corresponde à declaração.',
              );
            }

            const declaredAmount =
              this.normalizeStoredAmount(
                declaration.declaredAmount,
              );
            const paidAmount =
              this.normalizeStoredAmount(
                declaration.paidAmount,
              );
            const remaining =
              this.normalizeStoredAmount(
                Math.max(
                  declaredAmount - paidAmount,
                  0,
                ),
              );

            if (amount > remaining) {
              throw new BadRequestException(
                `O valor do pagamento (${amount}) excede o saldo da declaração (${remaining}).`,
              );
            }

            const newPaidAmount =
              this.normalizeStoredAmount(
                paidAmount + amount,
              );
            const settled =
              newPaidAmount >=
              declaredAmount;

            const payment =
              await tx.taxPayment.create({
                data: {
                  tenantId,
                  declarationId: dto.declarationId,
                  taxType: dto.taxType,
                  amount,
                  reference,
                  paymentMethod:
                    dto.paymentMethod ??
                    null,
                  paidAt,
                },
                include: {
                  declaration: true,
                },
              });

            await tx.taxDeclaration.update({
              where: {
                id: declaration.id,
              },
              data: {
                paidAmount: settled
                  ? declaredAmount
                  : newPaidAmount,
                status: settled
                  ? DeclarationStatus.PAID
                  : DeclarationStatus.PARTIAL,
                paymentDate: paidAt,
              },
            });

            return payment;
          }

          return tx.taxPayment.create({
            data: {
              tenantId,
              declarationId: null,
              taxType: dto.taxType,
              amount,
              reference,
              paymentMethod:
                dto.paymentMethod ??
                null,
              paidAt,
            },
            include: {
              declaration: true,
            },
          });
        },
      );

    return {
      ...result,

      status: 'PAID',

      description:
        this.getTaxDescription(
          result.taxType,
        ),

      tax:
        this.getTaxDescription(
          result.taxType,
        ),
    };
  }

  /*
   * ==========================================================
   * RESUMO
   * ==========================================================
   *
   * Total pago:
   * TaxPayment
   *
   * Pendente:
   * saldo das TaxDeclaration
   *
   * Em atraso:
   * TaxDeclaration.status = LATE
   * ==========================================================
   */

  async getSummary(
    tenantId: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado.',
      );
    }

    const [
      payments,
      declarations,
    ] =
      await Promise.all([
        this.prisma.taxPayment.findMany(
          {
            where: {
              tenantId,
            },

            select: {
              amount: true,
            },
          },
        ),

        this.prisma.taxDeclaration.findMany(
          {
            where: {
              tenantId,
            },

            select: {
              declaredAmount: true,
              paidAmount: true,
              status: true,
            },
          },
        ),
      ]);

    const totalPaid =
      payments.reduce(
        (sum, payment) =>
          sum +
          Number(payment.amount),
        0,
      );

    const pendingValue =
      declarations.reduce(
        (sum, declaration) => {
          const remaining =
            Math.max(
              Number(
                declaration.declaredAmount,
              ) -
                Number(
                  declaration.paidAmount,
                ),
              0,
            );

          if (
            declaration.status ===
            DeclarationStatus.PAID
          ) {
            return sum;
          }

          return (
            sum +
            remaining
          );
        },
        0,
      );

    const overdueValue =
      declarations.reduce(
        (sum, declaration) => {
          if (
            declaration.status !==
            DeclarationStatus.LATE
          ) {
            return sum;
          }

          const remaining =
            Math.max(
              Number(
                declaration.declaredAmount,
              ) -
                Number(
                  declaration.paidAmount,
                ),
              0,
            );

          return (
            sum +
            remaining
          );
        },
        0,
      );

    const paidCount =
      payments.length;

    const pendingCount =
      declarations.filter(
        (declaration) =>
          declaration.status ===
            DeclarationStatus.PENDING ||
          declaration.status ===
            DeclarationStatus.PARTIAL,
      ).length;

    const overdueCount =
      declarations.filter(
        (declaration) =>
          declaration.status ===
          DeclarationStatus.LATE,
      ).length;

    const totalItems =
      paidCount +
      pendingCount +
      overdueCount;

    const onTimePercentage =
      totalItems > 0
        ? Math.round(
            (paidCount /
              totalItems) *
              100,
          )
        : 0;

    return {
      totalPaid,

      pendingValue,

      overdueValue,

      paidCount,

      pendingCount,

      overdueCount,

      onTimePercentage,
    };
  }

  /*
   * ==========================================================
   * EVOLUÇÃO MENSAL
   * ==========================================================
   */

  async getEvolution(
    tenantId: string,
    year?: number,
  ) {
    if (!tenantId) {
      throw new BadRequestException(
        'Tenant não identificado.',
      );
    }

    const referenceYear =
      year ??
      new Date().getFullYear();

    const startDate =
      new Date(
        referenceYear,
        0,
        1,
      );

    const endDate =
      new Date(
        referenceYear + 1,
        0,
        1,
      );

    const payments =
      await this.prisma.taxPayment.findMany(
        {
          where: {
            tenantId,

            paidAt: {
              gte: startDate,
              lt: endDate,
            },
          },

          select: {
            amount: true,
            paidAt: true,
            taxType: true,
          },

          orderBy: {
            paidAt: 'asc',
          },
        },
      );

    const months = [
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

    const evolution =
      months.map(
        (
          month,
        ) => ({
          month,
          value: 0,
        }),
      );

    for (
      const payment of payments
    ) {
      const month =
        payment.paidAt.getMonth();

      evolution[month].value +=
        Number(
          payment.amount,
        );
    }

    return {
      year: referenceYear,

      payments: evolution,
    };
  }

  /*
   * ==========================================================
   * ATUALIZAR ESTADO
   * ==========================================================
   *
   * TaxPayment representa um pagamento efetuado.
   * Portanto, o único estado válido neste modelo é PAID.
   *
   * Estados PENDING/LATE pertencem à declaração/obrigação.
   * ==========================================================
   */

  async updateStatus(
    tenantId: string,
    id: string,
    status: string,
  ) {
    const payment =
      await this.prisma.taxPayment.findFirst(
        {
          where: {
            id,
            tenantId,
          },
        },
      );

    if (!payment) {
      throw new NotFoundException(
        'Pagamento não encontrado.',
      );
    }

    if (
      status !== 'PAID'
    ) {
      throw new BadRequestException(
        'TaxPayment representa apenas pagamentos efetuados. Estados pendentes ou em atraso devem ser tratados na declaração fiscal.',
      );
    }

    return {
      ...payment,

      status: 'PAID',
    };
  }

  /*
   * ==========================================================
   * DESCRIÇÃO DO IMPOSTO
   * ==========================================================
   */

  private getTaxDescription(
    taxType: TaxType,
  ): string {
    const descriptions: Partial<
      Record<TaxType, string>
    > = {
      IVA: 'Imposto sobre o Valor Acrescentado',

      IRT: 'Imposto sobre o Rendimento do Trabalho',

      INDUSTRIAL:
        'Imposto Industrial',

      II: 'Imposto Industrial',

      SS: 'Segurança Social',

      SELO:
        'Imposto do Selo',

      IEC:
        'Imposto Especial de Consumo',

      IAC:
        'Imposto sobre Aplicação de Capitais',

      IP:
        'Imposto Predial',

      IVM:
        'Imposto sobre Veículos Motorizados',

      IEJ:
        'Imposto sobre Exploração de Jogos',

      IS:
        'Imposto de Selo',

      RETENCAO:
        'Retenção na Fonte',
    } as Partial<
      Record<TaxType, string>
    >;

    return (
      descriptions[taxType] ??
      taxType
    );
  }

  private normalizePaymentAmount(
    value: number,
  ): number {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      throw new BadRequestException(
        'Indique um valor de pagamento válido.',
      );
    }

    const normalized =
      this.normalizeStoredAmount(
        value,
      );

    if (normalized < 0.01) {
      throw new BadRequestException(
        'Indique um valor de pagamento válido.',
      );
    }

    return normalized;
  }

  private normalizeStoredAmount(
    value: number,
  ): number {
    return Math.round(
      (Number(value) + Number.EPSILON) *
        100,
    ) / 100;
  }

  private resolvePaymentDate(
    value?: string,
  ): Date {
    const paidAt = value
      ? new Date(value)
      : new Date();

    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException(
        'Indique uma data de pagamento válida.',
      );
    }

    return paidAt;
  }
}
