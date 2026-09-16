import {
  BadRequestException,
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

    /*
     * ========================================================
     * DECLARAÇÃO
     * ========================================================
     */

    let declaration:
      | {
          id: string;
          tenantId: string;
          taxType: TaxType;
          period: string;
          declaredAmount: number;
          paidAmount: number;
          status: DeclarationStatus;
        }
      | null = null;

    if (dto.declarationId) {
      declaration =
        await this.prisma.taxDeclaration.findFirst(
          {
            where: {
              id: dto.declarationId,
              tenantId,
            },
          },
        );

      if (!declaration) {
        throw new NotFoundException(
          'Declaração fiscal não encontrada.',
        );
      }

      /*
       * Evita associar um pagamento de IVA,
       * por exemplo, a uma declaração de IRT.
       */

      if (
        declaration.taxType !==
        dto.taxType
      ) {
        throw new BadRequestException(
          'O tipo de imposto do pagamento não corresponde à declaração.',
        );
      }

      /*
       * Não permite pagar acima do valor
       * declarado.
       */

      const remaining =
        Math.max(
          declaration.declaredAmount -
            declaration.paidAmount,
          0,
        );

      if (
        dto.amount >
        remaining
      ) {
        throw new BadRequestException(
          `O valor do pagamento (${dto.amount}) excede o saldo da declaração (${remaining}).`,
        );
      }
    }

    /*
     * ========================================================
     * TRANSACTION
     * ========================================================
     */

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const payment =
            await tx.taxPayment.create(
              {
                data: {
                  tenantId,

                  declarationId:
                    dto.declarationId ??
                    null,

                  taxType:
                    dto.taxType,

                  amount:
                    dto.amount,

                  reference:
                    dto.reference ??
                    null,

                  paymentMethod:
                    dto.paymentMethod ??
                    null,

                  paidAt:
                    dto.paidAt
                      ? new Date(
                          dto.paidAt,
                        )
                      : new Date(),
                },

                include: {
                  declaration: true,
                },
              },
            );

          /*
           * ==================================================
           * ATUALIZAR DECLARAÇÃO
           * ==================================================
           */

          if (
            dto.declarationId
          ) {
            const current =
              declaration!;

            const newPaidAmount =
              current.paidAmount +
              dto.amount;

            let status:
              | DeclarationStatus =
              DeclarationStatus.PARTIAL;

            if (
              newPaidAmount >=
              current.declaredAmount
            ) {
              status =
                DeclarationStatus.PAID;
            } else {
              status =
                DeclarationStatus.PARTIAL;
            }

            await tx.taxDeclaration.update(
              {
                where: {
                  id:
                    dto.declarationId,
                },

                data: {
                  paidAmount:
                    newPaidAmount,

                  status,

                  paymentDate:
                    new Date(),
                },
              },
            );
          }

          return payment;
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
          index,
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
}