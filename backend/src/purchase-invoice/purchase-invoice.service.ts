import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InvoiceStatus,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ObligationsService } from '../obligations/obligations.service';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly obligationsService: ObligationsService,
  ) {}

  // ============================================================
  // CRIAR FACTURA DE COMPRA
  // ============================================================

  async create(
    tenantId: string,
    dto: any,
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
          retentionRate: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    // ==========================================================
    // FORNECEDOR
    // ==========================================================

    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id: dto.supplierId,
          tenantId,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Fornecedor não encontrado.',
      );
    }

    // ==========================================================
    // ITENS
    // ==========================================================

    if (
      !Array.isArray(dto.items) ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'A factura de compra deve possuir pelo menos um item.',
      );
    }

    for (const item of dto.items) {
      if (
        !item.productName ||
        !String(item.productName).trim()
      ) {
        throw new BadRequestException(
          'O nome do produto/serviço é obrigatório.',
        );
      }

      if (
        !Number.isFinite(
          Number(item.quantity),
        ) ||
        Number(item.quantity) <= 0
      ) {
        throw new BadRequestException(
          'A quantidade do item é inválida.',
        );
      }

      if (
        !Number.isFinite(
          Number(item.unitPrice),
        ) ||
        Number(item.unitPrice) < 0
      ) {
        throw new BadRequestException(
          'O preço unitário do item é inválido.',
        );
      }
    }

    // ==========================================================
    // DATA
    // ==========================================================

    const issuedAt =
      dto.issuedAt
        ? new Date(dto.issuedAt)
        : new Date();

    if (
      Number.isNaN(
        issuedAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'A data da factura é inválida.',
      );
    }

    let dueDate:
      Date | null = null;

    if (dto.dueDate) {
      dueDate =
        new Date(dto.dueDate);

      if (
        Number.isNaN(
          dueDate.getTime(),
        )
      ) {
        throw new BadRequestException(
          'A data de vencimento é inválida.',
        );
      }
    }

    // ==========================================================
    // SUBTOTAL
    // ==========================================================

    const subtotal =
      this.round(
        dto.items.reduce(
          (
            total: number,
            item: any,
          ) => {
            return (
              total +
              Number(item.quantity) *
                Number(item.unitPrice)
            );
          },
          0,
        ),
      );

    if (subtotal < 0) {
      throw new BadRequestException(
        'O subtotal não pode ser negativo.',
      );
    }

    // ==========================================================
    // IVA
    //
    // REGIME GERAL:
    // 14%
    //
    // REGIME SIMPLIFICADO:
    // a obrigação fiscal será calculada
    // pelo regime simplificado no
    // ObligationsService.
    //
    // A factura continua a guardar
    // o IVA documental quando existir.
    // ==========================================================

    const providedIva =
      dto.iva !== undefined &&
      dto.iva !== null
        ? Number(dto.iva)
        : null;

    let iva = 0;

    if (
      providedIva !== null
    ) {
      if (
        !Number.isFinite(
          providedIva,
        ) ||
        providedIva < 0
      ) {
        throw new BadRequestException(
          'O IVA informado é inválido.',
        );
      }

      iva =
        this.round(
          providedIva,
        );
    } else {
      /*
       * No Regime Geral usamos a taxa
       * normal de 14%.
       *
       * No Simplificado não usamos a
       * factura como obrigação de IVA
       * simplificado; o cálculo da obrigação
       * será feito sobre a facturação
       * efectivamente recebida.
       */

      if (
        tenant.regime ===
        'GERAL'
      ) {
        iva =
          this.round(
            subtotal * 0.14,
          );
      } else {
        iva = 0;
      }
    }

    // ==========================================================
    // RETENÇÃO
    // ==========================================================

    const configuredRetentionRate =
      Number(
        tenant.retentionRate ?? 0,
      );

    const retentionRate =
      configuredRetentionRate > 0
        ? configuredRetentionRate /
          100
        : 0;

    const withholdingTax =
      dto.withholdingTax !== undefined &&
      dto.withholdingTax !== null
        ? this.round(
            Number(
              dto.withholdingTax,
            ),
          )
        : this.round(
            subtotal *
              retentionRate,
          );

    if (
      !Number.isFinite(
        withholdingTax,
      ) ||
      withholdingTax < 0
    ) {
      throw new BadRequestException(
        'A retenção informada é inválida.',
      );
    }

    if (
      withholdingTax >
      subtotal
    ) {
      throw new BadRequestException(
        'A retenção não pode ser superior ao subtotal.',
      );
    }

    // ==========================================================
    // TOTAL
    // ==========================================================

    const total =
      this.round(
        subtotal +
          iva -
          withholdingTax,
      );

    // ==========================================================
    // NÚMERO DA FACTURA
    // ==========================================================

    const invoiceNumber =
      String(
        dto.invoiceNumber ||
          '',
      ).trim();

    if (!invoiceNumber) {
      throw new BadRequestException(
        'O número da factura do fornecedor é obrigatório.',
      );
    }

    const existing =
      await this.prisma.purchaseInvoice.findFirst({
        where: {
          tenantId,
          invoiceNumber,
        },

        select: {
          id: true,
        },
      });

    if (existing) {
      throw new BadRequestException(
        `A factura ${invoiceNumber} já está registada.`,
      );
    }

    // ==========================================================
    // CRIAR FACTURA
    // ==========================================================

    const purchase =
      await this.prisma.$transaction(
        async (tx) => {
          const created =
            await tx.purchaseInvoice.create({
              data: {
                tenantId,

                supplierId:
                  supplier.id,

                invoiceNumber,

                subtotal,

                iva,

                withholdingTax,

                total,

                status:
                  InvoiceStatus.PENDING,

                notes:
                  dto.notes || null,

                issuedAt,

                dueDate,
              },
            });

          // ====================================================
          // ITENS
          //
          // O schema actual não possui relação
          // Prisma directa PurchaseInvoice -> items.
          // Por isso criamos os itens separadamente.
          // ====================================================

          for (
            const item of dto.items
          ) {
            await tx.purchaseInvoiceItem.create({
              data: {
                purchaseInvoiceId:
                  created.id,

                productName:
                  String(
                    item.productName,
                  ).trim(),

                quantity:
                  Number(
                    item.quantity,
                  ),

                unitPrice:
                  Number(
                    item.unitPrice,
                  ),

                total:
                  this.round(
                    Number(
                      item.quantity,
                    ) *
                      Number(
                        item.unitPrice,
                      ),
                  ),
              },
            });
          }

          return created;
        },
      );

    // ==========================================================
    // SINCRONIZAR FISCALIDADE
    //
    // A compra passa imediatamente a poder
    // alimentar:
    //
    // - IVA dedutível
    // - retenções
    // - transacções fiscais
    // - avaliações fiscais
    // - obrigações
    // ==========================================================

    await this.obligationsService.syncCompany(
      tenantId,
    );

    return this.findOne(
      tenantId,
      purchase.id,
    );
  }

  // ============================================================
  // LISTAR
  // ============================================================

  async findAll(
    tenantId: string,
  ) {
    const purchases =
      await this.prisma.purchaseInvoice.findMany({
        where: {
          tenantId,
        },

        orderBy: {
          issuedAt: 'desc',
        },
      });

    const result = [];

    for (
      const purchase of purchases
    ) {
      const items =
        await this.prisma.purchaseInvoiceItem.findMany({
          where: {
            purchaseInvoiceId:
              purchase.id,
          },

          orderBy: {
            id: 'asc',
          },
        });

      result.push({
        ...purchase,
        items,
      });
    }

    return result;
  }

  // ============================================================
  // CONSULTAR
  // ============================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const purchase =
      await this.prisma.purchaseInvoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Factura de compra não encontrada.',
      );
    }

    const items =
      await this.prisma.purchaseInvoiceItem.findMany({
        where: {
          purchaseInvoiceId:
            purchase.id,
        },

        orderBy: {
          id: 'asc',
        },
      });

    return {
      ...purchase,
      items,
    };
  }

  // ============================================================
  // MARCAR COMO PAGA
  // ============================================================

  async markAsPaid(
    tenantId: string,
    id: string,
  ) {
    const purchase =
      await this.prisma.purchaseInvoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Factura de compra não encontrada.',
      );
    }

    if (
      purchase.status ===
      InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Uma factura cancelada não pode ser marcada como paga.',
      );
    }

    if (
      purchase.status ===
      InvoiceStatus.PAID
    ) {
      return this.findOne(
        tenantId,
        id,
      );
    }

    await this.prisma.purchaseInvoice.update({
      where: {
        id:
          purchase.id,
      },

      data: {
        status:
          InvoiceStatus.PAID,
      },
    });

    await this.obligationsService.syncCompany(
      tenantId,
    );

    return this.findOne(
      tenantId,
      id,
    );
  }

  // ============================================================
  // CANCELAR
  // ============================================================

  async cancel(
    tenantId: string,
    id: string,
  ) {
    const purchase =
      await this.prisma.purchaseInvoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Factura de compra não encontrada.',
      );
    }

    if (
      purchase.status ===
      InvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        'Uma factura de compra paga não pode ser cancelada directamente.',
      );
    }

    if (
      purchase.status ===
      InvoiceStatus.CANCELLED
    ) {
      return this.findOne(
        tenantId,
        id,
      );
    }

    await this.prisma.purchaseInvoice.update({
      where: {
        id:
          purchase.id,
      },

      data: {
        status:
          InvoiceStatus.CANCELLED,
      },
    });

    await this.obligationsService.syncCompany(
      tenantId,
    );

    return this.findOne(
      tenantId,
      id,
    );
  }

  // ============================================================
  // ACTUALIZAR
  // ============================================================

  async update(
    tenantId: string,
    id: string,
    dto: any,
  ) {
    const purchase =
      await this.prisma.purchaseInvoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Factura de compra não encontrada.',
      );
    }

    if (
      purchase.status ===
      InvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        'Uma factura de compra paga não pode ser editada.',
      );
    }

    if (
      purchase.status ===
      InvoiceStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Uma factura de compra cancelada não pode ser editada.',
      );
    }

    const supplierId =
      dto.supplierId ||
      purchase.supplierId;

    const supplier =
      await this.prisma.supplier.findFirst({
        where: {
          id: supplierId,
          tenantId,
        },
      });

    if (!supplier) {
      throw new NotFoundException(
        'Fornecedor não encontrado.',
      );
    }

    const items =
      Array.isArray(dto.items)
        ? dto.items
        : await this.prisma.purchaseInvoiceItem.findMany({
            where: {
              purchaseInvoiceId:
                purchase.id,
            },
          });

    if (
      !items.length
    ) {
      throw new BadRequestException(
        'A factura deve possuir pelo menos um item.',
      );
    }

    const subtotal =
      this.round(
        items.reduce(
          (
            total: number,
            item: any,
          ) =>
            total +
            Number(
              item.quantity,
            ) *
              Number(
                item.unitPrice,
              ),
          0,
        ),
      );

    const tenant =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },

        select: {
          regime: true,
          retentionRate: true,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada.',
      );
    }

    const iva =
      dto.iva !== undefined
        ? this.round(
            Number(dto.iva),
          )
        : tenant.regime ===
            'GERAL'
          ? this.round(
              subtotal * 0.14,
            )
          : this.round(
              Number(
                purchase.iva,
              ),
            );

    const configuredRetention =
      Number(
        tenant.retentionRate ?? 0,
      );

    const withholdingTax =
      dto.withholdingTax !==
      undefined
        ? this.round(
            Number(
              dto.withholdingTax,
            ),
          )
        : this.round(
            subtotal *
              (configuredRetention >
              0
                ? configuredRetention /
                  100
                : 0),
          );

    const total =
      this.round(
        subtotal +
          iva -
          withholdingTax,
      );

    await this.prisma.$transaction(
      async (tx) => {
        await tx.purchaseInvoice.update({
          where: {
            id:
              purchase.id,
          },

          data: {
            supplierId,

            invoiceNumber:
              dto.invoiceNumber ||
              purchase.invoiceNumber,

            subtotal,

            iva,

            withholdingTax,

            total,

            notes:
              dto.notes ??
              purchase.notes,

            issuedAt:
              dto.issuedAt
                ? new Date(
                    dto.issuedAt,
                  )
                : purchase.issuedAt,

            dueDate:
              dto.dueDate
                ? new Date(
                    dto.dueDate,
                  )
                : purchase.dueDate,
          },
        });

        if (
          Array.isArray(
            dto.items,
          )
        ) {
          await tx.purchaseInvoiceItem.deleteMany({
            where: {
              purchaseInvoiceId:
                purchase.id,
            },
          });

          for (
            const item of dto.items
          ) {
            await tx.purchaseInvoiceItem.create({
              data: {
                purchaseInvoiceId:
                  purchase.id,

                productName:
                  String(
                    item.productName,
                  ).trim(),

                quantity:
                  Number(
                    item.quantity,
                  ),

                unitPrice:
                  Number(
                    item.unitPrice,
                  ),

                total:
                  this.round(
                    Number(
                      item.quantity,
                    ) *
                      Number(
                        item.unitPrice,
                      ),
                  ),
              },
            });
          }
        }
      },
    );

    await this.obligationsService.syncCompany(
      tenantId,
    );

    return this.findOne(
      tenantId,
      id,
    );
  }

  // ============================================================
  // REMOVER
  // ============================================================

  async remove(
    tenantId: string,
    id: string,
  ) {
    const purchase =
      await this.prisma.purchaseInvoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!purchase) {
      throw new NotFoundException(
        'Factura de compra não encontrada.',
      );
    }

    if (
      purchase.status ===
      InvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        'Uma factura de compra paga não deve ser apagada. Cancele-a.',
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.purchaseInvoiceItem.deleteMany({
          where: {
            purchaseInvoiceId:
              purchase.id,
          },
        });

        await tx.purchaseInvoice.delete({
          where: {
            id:
              purchase.id,
          },
        });
      },
    );

    await this.obligationsService.syncCompany(
      tenantId,
    );

    return {
      success: true,
      message:
        'Factura de compra removida com sucesso.',
    };
  }

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  async getStats(
    tenantId: string,
  ) {
    const purchases =
      await this.prisma.purchaseInvoice.findMany({
        where: {
          tenantId,
        },

        select: {
          subtotal: true,
          iva: true,
          withholdingTax: true,
          total: true,
          status: true,
        },
      });

    const active =
      purchases.filter(
        (item) =>
          item.status !==
          InvoiceStatus.CANCELLED,
      );

    return {
      totalInvoices:
        purchases.length,

      activeInvoices:
        active.length,

      cancelledInvoices:
        purchases.length -
        active.length,

      totalSubtotal:
        this.round(
          active.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.subtotal,
              ),
            0,
          ),
        ),

      totalIva:
        this.round(
          active.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.iva,
              ),
            0,
          ),
        ),

      totalWithholding:
        this.round(
          active.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.withholdingTax,
              ),
            0,
          ),
        ),

      total:
        this.round(
          active.reduce(
            (
              sum,
              item,
            ) =>
              sum +
              this.number(
                item.total,
              ),
            0,
          ),
        ),
    };
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private number(
    value:
      | number
      | string
      | null
      | undefined,
  ) {
    const result =
      Number(value);

    return Number.isFinite(
      result,
    )
      ? result
      : 0;
  }

  private round(
    value: number,
  ) {
    return Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100;
  }
}