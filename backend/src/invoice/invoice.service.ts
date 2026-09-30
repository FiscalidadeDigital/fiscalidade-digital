import PDFDocument from 'pdfkit';

import { Response } from 'express';

import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { ObligationsService } from '../obligations/obligations.service';
import {
  resolveInvoiceVatPolicy,
  SIMPLIFIED_IVA_INVOICE_MENTION,
} from '../fiscal-rules/iva-rules';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { calculateInvoiceAmounts } from './invoice-calculator';

@Injectable()
export class InvoiceService {
  private readonly logger =
    new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly obligationsService: ObligationsService,
  ) {}

  // ============================================================
  // CRIAR FACTURA
  // ============================================================

  async create(
    tenantId: string,
    dto: CreateInvoiceDto,
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

    const client =
      await this.prisma.client.findFirst({
        where: {
          id: dto.clientId,
          tenantId,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado.',
      );
    }

    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException(
        'A factura deve possuir pelo menos um item.',
      );
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
          select: {
            id: true,
            name: true,
            price: true,
            priceAmount: true,
            unit: true,
          },
        })
      : [];

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Um dos produtos n\u00e3o existe, est\u00e1 inactivo ou pertence a outra empresa.',
      );
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = dto.items.map((item) => {
      const product = item.productId ? productsById.get(item.productId) : undefined;
      return {
        productId: product?.id ?? null,
        productName: product?.name ?? item.productName.trim(),
        quantity: item.quantity,
        unitPrice: product
          ? Number(product.priceAmount?.toString() ?? product.price)
          : item.unitPrice,
        unit: product?.unit ?? item.unit ?? 'UN',
      };
    });

    for (const item of normalizedItems) {
      if (
        !item.productName?.trim() ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0
      ) {
        throw new BadRequestException(
          'Existem itens de factura com dados inválidos.',
        );
      }
    }

    // ==========================================================
    // SUBTOTAL
    // ==========================================================

    // ==========================================================
    // IVA
    //
    // REGIME GERAL:
    //   taxa normal = 14%
    //
    // REGIME SIMPLIFICADO:
    //   o imposto não é acrescentado à factura como 14%.
    //   O IVA é apurado mensalmente pelo sistema sobre os
    //   recebimentos efectivos, à taxa de 7%, conforme o
    //   enquadramento fiscal.
    //
    // O cálculo é feito exclusivamente no backend.
    // ==========================================================

    const vatPolicy = resolveInvoiceVatPolicy(tenant.regime);
    const ivaRate = Number(vatPolicy.invoiceRate);

    // ==========================================================
    // RETENÇÃO
    //
    // IMPORTANTE:
    //
    // O regime Geral, por si só, NÃO significa que toda factura
    // tenha retenção.
    //
    // A retenção só será aplicada quando existir uma taxa
    // explicitamente configurada na empresa.
    //
    // Assim evitamos aplicar automaticamente 6,5% a qualquer
    // venda de produto/serviço sem que a operação esteja
    // configurada para retenção.
    // ==========================================================

    const configuredRetentionRate =
      this.number(
        tenant.retentionRate,
      );

    const retentionRate =
      configuredRetentionRate > 0
        ? configuredRetentionRate / 100
        : 0;

    const calculation = calculateInvoiceAmounts(
      normalizedItems,
      ivaRate,
      retentionRate,
    );

    if (calculation.subtotal.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        'O subtotal da factura deve ser maior que zero.',
      );
    }

    const subtotal = calculation.subtotal.toNumber();
    const iva = calculation.iva.toNumber();
    const withholdingTax = calculation.withholdingTax.toNumber();
    const total = calculation.total.toNumber();
    const issuedAt = new Date();

    // ==========================================================
    // NÚMERO DA FACTURA
    // ==========================================================

    const year = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Luanda',
        year: 'numeric',
      }).format(issuedAt),
    );

    const data = {
      tenantId,

      clientId:
        dto.clientId,

      subtotal,

      subtotalAmount:
        calculation.subtotal,

      iva,

      ivaAmount:
        calculation.iva,

      withholdingTax,

      withholdingTaxAmount:
        calculation.withholdingTax,

      total,

      totalAmount:
        calculation.total,

      taxRuleVersion:
        vatPolicy.ruleVersion,

      taxCalculationStatus:
        vatPolicy.calculationStatus,

      issuedAt,

      notes:
        dto.notes?.trim() ||
        null,

      status:
        'PENDING' as const,

      items: {
        create:
          normalizedItems.map(
            (item, index) => ({
              productId:
                item.productId,

              productName:
                item.productName.trim(),

              quantity:
                calculation.lines[index].quantity.toNumber(),

              quantityAmount:
                calculation.lines[index].quantity,

              unitPrice:
                calculation.lines[index].unitPrice.toNumber(),

              unitPriceAmount:
                calculation.lines[index].unitPrice,

              total:
                calculation.lines[index].total.toNumber(),

              totalAmount:
                calculation.lines[index].total,

              unit:
                item.unit,
            }),
          ),
      },
    };

    // ==========================================================
    // CRIAR FACTURA
    // ==========================================================

    try {
      const invoice = await this.prisma.$transaction(
        async (tx) => {
          const lockKey = `${tenantId}:${year}`;

          await tx.$queryRaw`
            SELECT pg_advisory_xact_lock(
              hashtextextended(${lockKey}, 0)
            )::text AS lock
          `;

          const invoiceNumber =
            await this.getNextInvoiceNumber(
              tx,
              tenantId,
              year,
            );

          return tx.invoice.create({
            data: {
              ...data,
              invoiceNumber,
            },

            include: {
              client: true,
              items: true,
            },
          });
        },
      );

      await this.syncFiscalObligations(
        tenantId,
      );

      return invoice;
    } catch (error: unknown) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Não foi possível gerar uma numeração única para a factura. Tente novamente.',
        );
      }

      throw error;
    }
  }

  // ============================================================
  // SINCRONIZAR OBRIGAÇÕES
  // ============================================================

  private async syncFiscalObligations(
    tenantId: string,
  ) {
    try {
      const result =
        await this.obligationsService.syncCompany(
          tenantId,
        );

      this.logger.log(
        `Obrigações fiscais sincronizadas após alteração de factura. Tenant: ${tenantId}`,
      );

      return result;
    } catch (error) {
      /*
       * A factura já foi criada.
       *
       * Não apagamos a factura se a sincronização fiscal falhar.
       *
       * O calendário/obrigações poderá ser sincronizado
       * novamente posteriormente.
       */

      this.logger.error(
        `Falha ao sincronizar obrigações após factura do tenant ${tenantId}.`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      return null;
    }
  }

  // ============================================================
  // PRÓXIMO NÚMERO
  // ============================================================

  private async getNextInvoiceNumber(
    tx: Prisma.TransactionClient,
    tenantId: string,
    year: number,
  ): Promise<string> {
    const prefix =
      `FT-${year}-`;

    const invoices =
      await tx.invoice.findMany({
        where: {
          tenantId,

          invoiceNumber: {
            startsWith:
              prefix,
          },
        },

        select: {
          invoiceNumber:
            true,
        },
      });

    let highest = 0;

    for (
      const invoice of invoices
    ) {
      const sequence =
        Number(
          invoice.invoiceNumber.slice(
            prefix.length,
          ),
        );

      if (
        Number.isInteger(
          sequence,
        ) &&
        sequence >
          highest
      ) {
        highest =
          sequence;
      }
    }

    return (
      `${prefix}` +
      `${String(
        highest + 1,
      ).padStart(5, '0')}`
    );
  }

  // ============================================================
  // LISTAR
  // ============================================================

  async findAll(
    tenantId: string,
  ) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
      },

      include: {
        client: true,
        items: true,
      },

      orderBy: {
        createdAt:
          'desc',
      },
    });
  }

  async findPage(tenantId: string, query: InvoiceQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: 'insensitive' } },
              { client: { name: { contains: search, mode: 'insensitive' } } },
              { client: { nif: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const orderBy = {
      [query.sortBy ?? 'issuedAt']: query.sortDirection ?? 'desc',
    } as Prisma.InvoiceOrderByWithRelationInput;

    const [total, invoices, pending, paid, cancelled, amounts] =
      await this.prisma.$transaction([
        this.prisma.invoice.count({ where }),
        this.prisma.invoice.findMany({
          where,
          include: { client: true, items: true },
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.invoice.count({ where: { tenantId, status: 'PENDING' } }),
        this.prisma.invoice.count({ where: { tenantId, status: 'PAID' } }),
        this.prisma.invoice.count({ where: { tenantId, status: 'CANCELLED' } }),
        this.prisma.invoice.aggregate({
          where: { tenantId, status: { not: 'CANCELLED' } },
          _sum: {
            total: true,
            iva: true,
            totalAmount: true,
            ivaAmount: true,
          },
        }),
      ]);

    const totalInvoicedAmount = this.decimal(
      amounts._sum.totalAmount,
      amounts._sum.total,
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const ivaInvoicedAmount = this.decimal(
      amounts._sum.ivaAmount,
      amounts._sum.iva,
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      data: invoices,
      summary: {
        total: pending + paid + cancelled,
        pending,
        paid,
        cancelled,
        totalInvoiced: totalInvoicedAmount.toNumber(),
        totalInvoicedAmount: totalInvoicedAmount.toFixed(2),
        ivaInvoiced: ivaInvoicedAmount.toNumber(),
        ivaInvoicedAmount: ivaInvoicedAmount.toFixed(2),
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  // ============================================================
  // BUSCAR UMA
  // ============================================================

  async findOne(
    tenantId: string,
    id: string,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },

        include: {
          client: true,
          items: true,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    return invoice;
  }

  // ============================================================
  // MARCAR COMO PAGA
  // ============================================================

  async markAsPaid(
    tenantId: string,
    id: string,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    if (
      invoice.status ===
      'CANCELLED'
    ) {
      throw new BadRequestException(
        'Uma factura cancelada não pode ser marcada como paga.',
      );
    }

    if (
      invoice.status ===
      'PAID'
    ) {
      return this.findOne(
        tenantId,
        id,
      );
    }

    const transition =
      await this.prisma.invoice.updateMany({
        where: {
          id: invoice.id,
          tenantId,
          status: 'PENDING',
        },

        data: {
          status: 'PAID',
        },
      });

    if (transition.count === 0) {
      const current = await this.findOne(
        tenantId,
        id,
      );

      if (current.status === 'CANCELLED') {
        throw new BadRequestException(
          'Uma factura cancelada não pode ser marcada como paga.',
        );
      }

      return current;
    }

    /*
     * A factura agora está PAID.
     *
     * Sincronizamos novamente para manter o estado fiscal
     * actualizado.
     */
    await this.syncFiscalObligations(
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
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    if (
      invoice.status ===
      'PAID'
    ) {
      throw new BadRequestException(
        'Uma factura paga não pode ser cancelada directamente.',
      );
    }

    if (
      invoice.status ===
      'CANCELLED'
    ) {
      return this.findOne(
        tenantId,
        id,
      );
    }

    const transition =
      await this.prisma.invoice.updateMany({
        where: {
          id: invoice.id,
          tenantId,
          status: 'PENDING',
        },

        data: {
          status: 'CANCELLED',
        },
      });

    if (transition.count === 0) {
      const current = await this.findOne(
        tenantId,
        id,
      );

      if (current.status === 'PAID') {
        throw new BadRequestException(
          'Uma factura paga não pode ser cancelada directamente.',
        );
      }

      return current;
    }

    // ==========================================================
    // RECALCULAR OBRIGAÇÕES
    //
    // A factura cancelada é excluída pelo ObligationsService.
    // ==========================================================

    await this.syncFiscalObligations(
      tenantId,
    );

    return this.findOne(
      tenantId,
      id,
    );
  }

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  async getDashboardStats(
    tenantId: string,
  ) {
    const invoices =
      await this.prisma.invoice.findMany({
        where: {
          tenantId,
        },

        select: {
          status: true,
          total: true,
          totalAmount: true,
        },
      });

    const totalInvoices =
      invoices.length;

    const paid =
      invoices.filter(
        (invoice) =>
          invoice.status ===
          'PAID',
      );

    const pending =
      invoices.filter(
        (invoice) =>
          invoice.status ===
          'PENDING',
      );

    const cancelled =
      invoices.filter(
        (invoice) =>
          invoice.status ===
          'CANCELLED',
      );

    const sumInvoices = (
      entries: typeof invoices,
    ) => entries.reduce(
      (sum, invoice) => sum.add(
        this.decimal(invoice.totalAmount, invoice.total),
      ),
      new Prisma.Decimal(0),
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const revenueReceivedAmount = sumInvoices(paid);
    const revenuePendingAmount = sumInvoices(pending);
    const totalInvoicedAmount = sumInvoices(
      invoices.filter((invoice) => invoice.status !== 'CANCELLED'),
    );

    return {
      totalInvoices,

      paidInvoices:
        paid.length,

      pendingInvoices:
        pending.length,

      cancelledInvoices:
        cancelled.length,

      revenueReceived:
        revenueReceivedAmount.toNumber(),

      revenueReceivedAmount:
        revenueReceivedAmount.toFixed(2),

      revenuePending:
        revenuePendingAmount.toNumber(),

      revenuePendingAmount:
        revenuePendingAmount.toFixed(2),

      totalInvoiced:
        totalInvoicedAmount.toNumber(),

      totalInvoicedAmount:
        totalInvoicedAmount.toFixed(2),
    };
  }

  // ============================================================
  // PDF
  // ============================================================

  async generatePdf(
    tenantId: string,
    id: string,
    res: Response,
  ) {
    const invoice =
      await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },

        include: {
          client: true,
          items: true,
          tenant: true,
        },
      });

    if (!invoice) {
      throw new NotFoundException(
        'Factura não encontrada.',
      );
    }

    const doc =
      new PDFDocument({
        size: 'A4',
        margin: 40,
      });

    res.setHeader(
      'Content-Type',
      'application/pdf',
    );

    res.setHeader(
      'Content-Disposition',
      `inline; filename=${invoice.invoiceNumber}.pdf`,
    );

    doc.pipe(res);

    // ==========================================================
    // CABEÇALHO
    // ==========================================================

    doc
      .rect(
        0,
        0,
        595,
        110,
      )
      .fill('#1E40AF');

    doc
      .fillColor('white')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text(
        'FISCALIDADE DIGITAL',
        40,
        30,
        {
          align: 'center',
        },
      );

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Sistema Inteligente de Gestao Fiscal',
        {
          align: 'center',
        },
      );

    doc.fillColor('black');

    // ==========================================================
    // EMISSOR
    // ==========================================================

    doc
      .roundedRect(
        40,
        130,
        240,
        90,
      )
      .stroke();

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(
        'EMISSOR',
        50,
        140,
      );

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        invoice.tenant.name,
        50,
        165,
      );

    doc.text(
      `NIF: ${invoice.tenant.nif}`,
      50,
      185,
    );

    // ==========================================================
    // FACTURA
    // ==========================================================

    doc
      .roundedRect(
        310,
        130,
        245,
        90,
      )
      .stroke();

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(
        'FACTURA',
        320,
        140,
      );

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Numero: ${invoice.invoiceNumber}`,
        320,
        165,
      );

    doc.text(
      `Data: ${new Date(
        invoice.createdAt,
      ).toLocaleDateString(
        'pt-PT',
      )}`,
      320,
      185,
    );

    doc.text(
      `Estado: ${invoice.status}`,
      320,
      205,
    );

    // ==========================================================
    // CLIENTE
    // ==========================================================

    doc
      .roundedRect(
        40,
        245,
        515,
        95,
      )
      .stroke();

    doc
      .fontSize(14)
      .fillColor('#1E40AF')
      .font('Helvetica-Bold')
      .text(
        'DADOS DO CLIENTE',
        50,
        255,
      );

    doc.fillColor('black');

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Nome: ${invoice.client.name}`,
        50,
        285,
      );

    if (
      invoice.client.nif
    ) {
      doc.text(
        `NIF: ${invoice.client.nif}`,
        50,
        305,
      );
    }

    if (
      invoice.client.email
    ) {
      doc.text(
        `Email: ${invoice.client.email}`,
        250,
        285,
      );
    }

    if (
      invoice.client.phone
    ) {
      doc.text(
        `Telefone: ${invoice.client.phone}`,
        250,
        305,
      );
    }

    // ==========================================================
    // TABELA
    // ==========================================================

    let y = 370;

    doc
      .rect(
        40,
        y,
        515,
        28,
      )
      .fill('#E5E7EB');

    doc.fillColor('black');

    doc
      .font('Helvetica-Bold')
      .fontSize(11);

    doc.text(
      'Descricao',
      50,
      y + 8,
    );

    doc.text(
      'Qtd',
      290,
      y + 8,
    );

    doc.text(
      'Preco Unit.',
      350,
      y + 8,
    );

    doc.text(
      'Total',
      470,
      y + 8,
    );

    y += 40;

    doc.font('Helvetica');

    invoice.items.forEach(
      (item) => {
        doc.text(
          item.productName,
          50,
          y,
        );

        doc.text(
          String(
            item.quantity,
          ),
          290,
          y,
        );

        doc.text(
          `${this.formatMoney(
            item.unitPriceAmount ?? item.unitPrice,
          )} AOA`,
          350,
          y,
        );

        doc.text(
          `${this.formatMoney(
            item.totalAmount ?? item.total,
          )} AOA`,
          470,
          y,
        );

        y += 25;
      },
    );

    // ==========================================================
    // RESUMO
    // ==========================================================

    y += 40;

    doc
      .roundedRect(
        320,
        y,
        235,
        140,
      )
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(12);

    doc.text(
      `Subtotal: ${this.formatMoney(
        invoice.subtotalAmount ?? invoice.subtotal,
      )} AOA`,
      340,
      y + 20,
    );

    const pdfIvaLabel =
      this.number(
        invoice.ivaAmount ?? invoice.iva,
      ) > 0
        ? 'IVA'
        : 'IVA (apurado no regime)';

    doc.text(
      `${pdfIvaLabel}: ${this.formatMoney(
        invoice.ivaAmount ?? invoice.iva,
      )} AOA`,
      340,
      y + 45,
    );

    doc.text(
      `Retencao: ${this.formatMoney(
        invoice.withholdingTaxAmount ?? invoice.withholdingTax,
      )} AOA`,
      340,
      y + 70,
    );

    doc
      .moveTo(
        330,
        y + 100,
      )
      .lineTo(
        545,
        y + 100,
      )
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fillColor('#059669')
      .fontSize(20)
      .text(
        `${this.formatMoney(
          invoice.totalAmount ?? invoice.total,
        )} AOA`,
        340,
        y + 110,
      );

    doc
      .fillColor('black')
      .fontSize(12)
      .text(
        'TOTAL A PAGAR',
        340,
        y + 90,
      );

    // ==========================================================
    // OBSERVAÇÕES
    // ==========================================================

    if (
      invoice.notes
    ) {
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(
          'OBSERVACOES',
          40,
          y,
        );

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(
          invoice.notes,
          40,
          y + 25,
          {
            width: 250,
          },
        );
    }

    // ==========================================================
    // ASSINATURA
    // ==========================================================

    doc
      .moveTo(
        40,
        740,
      )
      .lineTo(
        220,
        740,
      )
      .stroke();

    doc
      .fontSize(10)
      .text(
        'Assinatura Autorizada',
        70,
        745,
      );

    // ==========================================================
    // RODAPÉ
    // ==========================================================

    if (
      invoice.taxCalculationStatus ===
      'PAYMENT_BASIS_NOT_INVOICE_LIQUIDATION'
    ) {
      doc
        .fontSize(9)
        .fillColor('#92400E')
        .text(SIMPLIFIED_IVA_INVOICE_MENTION, 40, 775, {
          width: 515,
          align: 'center',
        });
    }

    doc
      .fontSize(8)
      .fillColor('gray')
      .text(
        'Documento interno. A emissão não representa certificação, validação ou submissão à AGT.',
        40,
        795,
        {
          width: 515,
          align: 'center',
        },
      );

    doc.end();
  }

  // ============================================================
  // NUMBER
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

  private decimal(
    exactValue: Prisma.Decimal | null | undefined,
    legacyValue: number | null | undefined,
  ): Prisma.Decimal {
    return new Prisma.Decimal(
      exactValue?.toString() ?? String(this.number(legacyValue)),
    );
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

  // ============================================================
  // FORMATAÇÃO DE DINHEIRO
  // ============================================================

  private formatMoney(
    value: any,
  ): string {
    return this.number(
      value,
    ).toLocaleString(
      'pt-AO',
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      },
    );
  }
}
