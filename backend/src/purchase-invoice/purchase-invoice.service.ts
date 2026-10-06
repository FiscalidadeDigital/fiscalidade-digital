import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InvoiceStatus,
  PurchaseInvoiceDocumentStatus,
  PurchaseInvoicePaymentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ObligationsService } from '../obligations/obligations.service';
import { FiscalEngineService } from '../fiscal-engine/fiscal-engine.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import {
  PurchaseVatDeductibilityStatus,
  UpdatePurchaseInvoiceVatDeductibilityDto,
} from './dto/update-purchase-invoice-vat-deductibility.dto';
import { CreatePurchaseInvoicePaymentDto } from './dto/create-purchase-invoice-payment.dto';

@Injectable()
export class PurchaseInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly obligationsService: ObligationsService,
    private readonly fiscalEngineService: FiscalEngineService,
  ) {}

  // ============================================================
  // CRIAR FACTURA DE COMPRA
  // ============================================================

  async create(
    tenantId: string,
    _createdById: string,
    dto: CreatePurchaseInvoiceDto,
  ) {
    const tenant =
      await this.prisma.tenant.findUnique({
        where: {
          id: tenantId,
        },

        select: {
          id: true,
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

    const productIds = [
      ...new Set(
        dto.items
          .map((item) => item.productId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { tenantId, id: { in: productIds }, isActive: true },
          select: { id: true, name: true, price: true, priceAmount: true, unit: true },
        })
      : [];
    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Um dos produtos não existe, está inactivo ou pertence a outra empresa.',
      );
    }
    const productsById = new Map(products.map((product) => [product.id, product]));
    const items = dto.items.map((item) => {
      const product = item.productId ? productsById.get(item.productId) : undefined;
      return {
        productId: product?.id ?? null,
        productName: product?.name ?? item.productName.trim(),
        quantity: new Prisma.Decimal(item.quantity),
        unitPrice: new Prisma.Decimal(
          product?.priceAmount?.toString() ?? product?.price ?? item.unitPrice,
        ),
        unit: product?.unit ?? item.unit ?? 'UN',
      };
    });

    const originalDocumentId = dto.originalDocumentId?.trim() || null;
    if (originalDocumentId) {
      const originalDocument = await this.prisma.document.findFirst({
        where: { id: originalDocumentId, tenantId },
        select: { id: true },
      });
      if (!originalDocument) {
        throw new NotFoundException('O documento original não pertence à empresa.');
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

    const subtotalAmount = items.reduce(
      (total, item) => total.plus(item.quantity.mul(item.unitPrice)),
      new Prisma.Decimal(0),
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const subtotal = subtotalAmount.toNumber();

    if (subtotal < 0) {
      throw new BadRequestException(
        'O subtotal não pode ser negativo.',
      );
    }

    // Os montantes fiscais são transcritos da factura de origem.
    // Este serviço não infere taxas a partir do regime da empresa.
    const ivaAmount = new Prisma.Decimal(dto.iva)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const withholdingTaxAmount = new Prisma.Decimal(dto.withholdingTax)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const iva = ivaAmount.toNumber();
    const withholdingTax = withholdingTaxAmount.toNumber();

    if (
      !Number.isFinite(iva) ||
      iva < 0 ||
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

    const totalAmount = subtotalAmount
      .plus(ivaAmount)
      .minus(withholdingTaxAmount)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const total = totalAmount.toNumber();
    const currency = (dto.currency ?? 'AOA').trim().toUpperCase();

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
          supplierId: supplier.id,
          invoiceNumber,
        },

        select: {
          id: true,
        },
      });

    if (existing) {
      throw new BadRequestException(
        `A factura ${invoiceNumber} deste fornecedor já está registada.`,
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
                subtotalAmount,

                iva,
                ivaAmount,

                withholdingTax,
                withholdingTaxAmount,

                total,
                totalAmount,

                currency,

                reference: dto.reference?.trim() || null,

                createdById: _createdById,

                originalDocumentId,

                status:
                  InvoiceStatus.PENDING,
                documentStatus: originalDocumentId
                  ? PurchaseInvoiceDocumentStatus.REVIEW_REQUIRED
                  : PurchaseInvoiceDocumentStatus.PENDING,
                paymentStatus: PurchaseInvoicePaymentStatus.UNPAID,

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
            const item of items
          ) {
            await tx.purchaseInvoiceItem.create({
              data: {
                purchaseInvoiceId:
                  created.id,

                productId: item.productId,

                productName: item.productName,

                quantity: item.quantity.toNumber(),
                quantityAmount: item.quantity,

                unitPrice: item.unitPrice.toNumber(),
                unitPriceAmount: item.unitPrice,

                total: item.quantity
                  .mul(item.unitPrice)
                  .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
                  .toNumber(),
                totalAmount: item.quantity
                  .mul(item.unitPrice)
                  .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),

                unit: item.unit,
              },
            });
          }

          return created;
        },
      ).catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            `A factura ${invoiceNumber} deste fornecedor já está registada.`,
          );
        }
        throw error;
      });

    // ==========================================================
    // SINCRONIZAR FISCALIDADE
    //
    // A compra é IVA indicado pendente por omissão. O motor fiscal preserva
    // essa separação e só deduz depois de revisão humana explícita.
    // ==========================================================

    await this.fiscalEngineService.syncTenant(tenantId, issuedAt.getUTCFullYear());
    await this.obligationsService.syncCompany(tenantId);

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
    const purchases = await this.prisma.purchaseInvoice.findMany({
      where: { tenantId },
      include: {
        supplier: { select: { id: true, name: true, nif: true } },
        items: { orderBy: { id: 'asc' } },
        confirmedImport: { select: { extractionProvider: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
    return purchases.map((purchase) => this.withBalance(purchase));
  }

  // ============================================================
  // CONSULTAR
  // ============================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const purchase = await this.prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: {
        supplier: { select: { id: true, name: true, nif: true } },
        items: { include: { product: { select: { id: true, name: true } } }, orderBy: { id: 'asc' } },
        payments: {
          include: { createdBy: { select: { id: true, name: true } } },
          orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
        },
        createdBy: { select: { id: true, name: true } },
        validatedBy: { select: { id: true, name: true } },
        rejectedBy: { select: { id: true, name: true } },
        confirmedImport: { select: { extractionProvider: true } },
      },
    });

    if (!purchase) {
      throw new NotFoundException(
        'Factura de compra não encontrada.',
      );
    }

    return this.withBalance(purchase);
  }

  async validate(tenantId: string, userId: string, id: string) {
    const purchase = await this.prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: { items: true, supplier: { select: { id: true } } },
    });
    if (!purchase) throw new NotFoundException('Factura de compra não encontrada.');
    if (purchase.documentStatus !== PurchaseInvoiceDocumentStatus.PENDING && purchase.documentStatus !== PurchaseInvoiceDocumentStatus.REVIEW_REQUIRED) {
      throw new BadRequestException('A factura não está num estado que permita validação.');
    }
    if (!purchase.invoiceNumber.trim() || !purchase.supplier || !purchase.items.length) {
      throw new BadRequestException('A factura não possui todos os dados obrigatórios.');
    }
    const authoritativeSubtotal = purchase.items.reduce(
      (sum, item) => sum.plus(new Prisma.Decimal(item.quantityAmount?.toString() ?? item.quantity).mul(item.unitPriceAmount?.toString() ?? item.unitPrice)),
      new Prisma.Decimal(0),
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const iva = new Prisma.Decimal(purchase.ivaAmount?.toString() ?? purchase.iva);
    const withholding = new Prisma.Decimal(purchase.withholdingTaxAmount?.toString() ?? purchase.withholdingTax);
    const total = authoritativeSubtotal.plus(iva).minus(withholding).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    await this.prisma.purchaseInvoice.update({
      where: { id: purchase.id },
      data: {
        subtotal: authoritativeSubtotal.toNumber(), subtotalAmount: authoritativeSubtotal,
        total: total.toNumber(), totalAmount: total,
        documentStatus: PurchaseInvoiceDocumentStatus.VALIDATED,
        validatedAt: new Date(), validatedById: userId,
        rejectedAt: null, rejectedById: null, rejectionReason: null,
      },
    });
    await this.syncFiscal(tenantId, purchase.issuedAt);
    return this.findOne(tenantId, purchase.id);
  }

  async reject(tenantId: string, userId: string, id: string, reason: string) {
    const purchase = await this.prisma.purchaseInvoice.findFirst({ where: { id, tenantId } });
    if (!purchase) throw new NotFoundException('Factura de compra não encontrada.');
    if (purchase.documentStatus !== PurchaseInvoiceDocumentStatus.PENDING && purchase.documentStatus !== PurchaseInvoiceDocumentStatus.REVIEW_REQUIRED) {
      throw new BadRequestException('A factura não está num estado que permita rejeição.');
    }
    const normalizedReason = reason.trim();
    if (!normalizedReason) throw new BadRequestException('Indique o motivo da rejeição.');
    await this.prisma.purchaseInvoice.update({
      where: { id: purchase.id },
      data: { documentStatus: PurchaseInvoiceDocumentStatus.REJECTED, rejectedAt: new Date(), rejectedById: userId, rejectionReason: normalizedReason },
    });
    await this.syncFiscal(tenantId, purchase.issuedAt);
    return this.findOne(tenantId, purchase.id);
  }

  async addPayment(tenantId: string, userId: string, id: string, dto: CreatePurchaseInvoicePaymentDto) {
    const paymentDate = new Date(dto.paymentDate);
    if (Number.isNaN(paymentDate.getTime())) throw new BadRequestException('A data do pagamento é inválida.');
    const amount = new Prisma.Decimal(dto.amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    if (amount.lte(0)) throw new BadRequestException('O pagamento deve ser superior a zero.');

    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "PurchaseInvoice" WHERE "id" = ${id} AND "tenantId" = ${tenantId} FOR UPDATE`;
      if (!rows.length) throw new NotFoundException('Factura de compra não encontrada.');
      const purchase = await tx.purchaseInvoice.findFirst({ where: { id, tenantId } });
      if (!purchase) throw new NotFoundException('Factura de compra não encontrada.');
      if (purchase.documentStatus !== PurchaseInvoiceDocumentStatus.VALIDATED) {
        throw new BadRequestException('Só é possível pagar uma factura validada.');
      }
      const total = new Prisma.Decimal(purchase.totalAmount?.toString() ?? purchase.total);
      const paid = new Prisma.Decimal(purchase.paidAmount);
      const balance = total.minus(paid);
      if (amount.gt(balance)) throw new BadRequestException('O pagamento não pode exceder o saldo por pagar.');
      const newPaid = paid.plus(amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      const paymentStatus = newPaid.eq(total) ? PurchaseInvoicePaymentStatus.PAID : PurchaseInvoicePaymentStatus.PARTIALLY_PAID;
      await tx.purchaseInvoicePayment.create({
        data: { tenantId, purchaseInvoiceId: id, amount, paymentDate, method: dto.method, reference: dto.reference?.trim() || null, notes: dto.notes?.trim() || null, createdById: userId },
      });
      await tx.purchaseInvoice.update({ where: { id }, data: { paidAmount: newPaid, paymentStatus, status: paymentStatus === PurchaseInvoicePaymentStatus.PAID ? InvoiceStatus.PAID : InvoiceStatus.PENDING } });
    });
    return this.findOne(tenantId, id);
  }

  /**
   * A reviewed purchase may become a deduction candidate. OCR/imports cannot
   * call this method; the authenticated tenant and reviewer are always passed
   * by the protected controller.
   */
  async updateVatDeductibility(
    tenantId: string,
    reviewerId: string,
    id: string,
    dto: UpdatePurchaseInvoiceVatDeductibilityDto,
  ) {
    const purchase = await this.prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      select: { id: true, status: true, issuedAt: true },
    });
    if (!purchase) {
      throw new NotFoundException('Factura de compra não encontrada.');
    }
    if (purchase.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Uma factura cancelada não pode gerar IVA dedutível.');
    }

    const reviewed = dto.status === 'DEDUCTIBLE' || dto.status === 'NON_DEDUCTIBLE';
    await this.prisma.purchaseInvoice.update({
      where: { id: purchase.id },
      data: {
        vatDeductibilityStatus: dto.status as PurchaseVatDeductibilityStatus,
        vatDeductibilityReason: dto.reason?.trim() || null,
        vatReviewedAt: reviewed ? new Date() : null,
        vatReviewedById: reviewed ? reviewerId : null,
      },
    });

    await this.fiscalEngineService.syncTenant(
      tenantId,
      purchase.issuedAt.getUTCFullYear(),
    );
    await this.obligationsService.syncCompany(tenantId);

    return this.findOne(tenantId, purchase.id);
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
      new Prisma.Decimal(purchase.paidAmount).gt(0)
    ) {
      throw new BadRequestException(
        'Uma factura de compra paga não pode ser cancelada directamente.',
      );
    }

    if (
      purchase.documentStatus === PurchaseInvoiceDocumentStatus.CANCELLED
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
        documentStatus: PurchaseInvoiceDocumentStatus.CANCELLED,
      },
    });

    await this.fiscalEngineService.syncTenant(
      tenantId,
      purchase.issuedAt.getUTCFullYear(),
    );
    await this.obligationsService.syncCompany(tenantId);

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
    dto: UpdatePurchaseInvoiceDto,
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
      purchase.documentStatus === PurchaseInvoiceDocumentStatus.VALIDATED ||
      purchase.documentStatus === PurchaseInvoiceDocumentStatus.CANCELLED ||
      new Prisma.Decimal(purchase.paidAmount).gt(0)
    ) {
      throw new BadRequestException(
        'Uma factura validada, cancelada ou com pagamentos não pode ser editada.',
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

    const subtotalAmount = items.reduce(
      (sum, item) => sum.plus(
        new Prisma.Decimal('quantityAmount' in item && item.quantityAmount ? item.quantityAmount.toString() : item.quantity)
          .mul('unitPriceAmount' in item && item.unitPriceAmount ? item.unitPriceAmount.toString() : item.unitPrice),
      ),
      new Prisma.Decimal(0),
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const ivaAmount =
      dto.iva !== undefined
        ? new Prisma.Decimal(dto.iva).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(purchase.ivaAmount?.toString() ?? purchase.iva);

    const withholdingTaxAmount =
      dto.withholdingTax !==
      undefined
        ? new Prisma.Decimal(dto.withholdingTax).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(purchase.withholdingTaxAmount?.toString() ?? purchase.withholdingTax);

    if (
      ivaAmount.lt(0) ||
      withholdingTaxAmount.lt(0) ||
      withholdingTaxAmount.gt(subtotalAmount)
    ) {
      throw new BadRequestException(
        'Os valores documentais de IVA/retenção são inválidos para o subtotal.',
      );
    }

    const requestedProductIds = Array.isArray(dto.items)
      ? [...new Set(dto.items.map((item) => item.productId).filter((value): value is string => Boolean(value)))]
      : [];
    if (requestedProductIds.length) {
      const ownedProducts = await this.prisma.product.count({
        where: { tenantId, id: { in: requestedProductIds }, isActive: true },
      });
      if (ownedProducts !== requestedProductIds.length) {
        throw new NotFoundException('Um dos produtos não existe, está inactivo ou pertence a outra empresa.');
      }
    }

    const totalAmount = subtotalAmount.plus(ivaAmount).minus(withholdingTaxAmount)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

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

            subtotal: subtotalAmount.toNumber(),
            subtotalAmount,
            iva: ivaAmount.toNumber(),
            ivaAmount,
            withholdingTax: withholdingTaxAmount.toNumber(),
            withholdingTaxAmount,
            total: totalAmount.toNumber(),
            totalAmount,

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

                quantity: new Prisma.Decimal(item.quantity).toNumber(),
                quantityAmount: new Prisma.Decimal(item.quantity),
                unitPrice: new Prisma.Decimal(item.unitPrice).toNumber(),
                unitPriceAmount: new Prisma.Decimal(item.unitPrice),
                total: new Prisma.Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber(),
                totalAmount: new Prisma.Decimal(item.quantity).mul(item.unitPrice).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
                productId: item.productId ?? null,
                unit: item.unit ?? 'UN',
              },
            });
          }
        }
      },
    );

    await this.fiscalEngineService.syncTenant(
      tenantId,
      purchase.issuedAt.getUTCFullYear(),
    );
    await this.obligationsService.syncCompany(tenantId);

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
      purchase.documentStatus === PurchaseInvoiceDocumentStatus.VALIDATED ||
      purchase.documentStatus === PurchaseInvoiceDocumentStatus.CANCELLED ||
      new Prisma.Decimal(purchase.paidAmount).gt(0)
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

    await this.fiscalEngineService.syncTenant(
      tenantId,
      purchase.issuedAt.getUTCFullYear(),
    );
    await this.obligationsService.syncCompany(tenantId);

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
          totalAmount: true,
          paidAmount: true,
          documentStatus: true,
        },
      });

    const active =
      purchases.filter(
        (item) =>
          item.documentStatus !== PurchaseInvoiceDocumentStatus.CANCELLED &&
          item.documentStatus !== PurchaseInvoiceDocumentStatus.REJECTED,
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
      totalOutstanding: active.reduce(
        (sum, item) => sum.plus(
          new Prisma.Decimal(item.totalAmount?.toString() ?? item.total)
            .minus(item.paidAmount),
        ),
        new Prisma.Decimal(0),
      ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber(),
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

  private withBalance<T extends {
    total: number;
    totalAmount: Prisma.Decimal | null;
    paidAmount: Prisma.Decimal;
    confirmedImport?: { extractionProvider: string } | null;
  }>(purchase: T) {
    const total = new Prisma.Decimal(purchase.totalAmount?.toString() ?? purchase.total);
    const paidAmount = new Prisma.Decimal(purchase.paidAmount);
    return {
      ...purchase,
      paidAmount: paidAmount.toFixed(2),
      balance: Prisma.Decimal.max(total.minus(paidAmount), 0).toFixed(2),
      origin: purchase.confirmedImport
        ? purchase.confirmedImport.extractionProvider === 'MANUAL' ? 'IMPORT' : 'OCR'
        : 'MANUAL',
    };
  }

  private async syncFiscal(tenantId: string, issuedAt: Date) {
    await this.fiscalEngineService.syncTenant(tenantId, issuedAt.getUTCFullYear());
    await this.obligationsService.syncCompany(tenantId);
  }
}
