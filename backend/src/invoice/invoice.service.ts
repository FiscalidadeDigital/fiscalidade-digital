import PDFDocument from 'pdfkit';

import { Response } from 'express';

import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ObligationsService } from '../obligations/obligations.service';

import { CreateInvoiceDto } from './dto/create-invoice.dto';

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

    if (
      !Array.isArray(dto.items) ||
      dto.items.length === 0
    ) {
      throw new BadRequestException(
        'A factura deve possuir pelo menos um item.',
      );
    }

    for (const item of dto.items) {
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

    const subtotal =
      this.round(
        dto.items.reduce(
          (sum, item) =>
            sum +
            this.number(item.quantity) *
              this.number(item.unitPrice),
          0,
        ),
      );

    if (subtotal <= 0) {
      throw new BadRequestException(
        'O subtotal da factura deve ser maior que zero.',
      );
    }

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

    const ivaRate =
      this.getInvoiceIvaRate(
        tenant.regime,
      );

    const iva =
      this.round(
        subtotal * ivaRate,
      );

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

    const withholdingTax =
      this.round(
        subtotal *
          retentionRate,
      );

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

    const year =
      new Date().getFullYear();

    const invoiceNumber =
      await this.getNextInvoiceNumber(
        tenantId,
        year,
      );

    const data = {
      tenantId,

      clientId:
        dto.clientId,

      invoiceNumber,

      subtotal,

      iva,

      withholdingTax,

      total,

      notes:
        dto.notes?.trim() ||
        null,

      status:
        'PENDING' as const,

      items: {
        create:
          dto.items.map(
            (item) => ({
              productName:
                item.productName.trim(),

              quantity:
                this.number(
                  item.quantity,
                ),

              unitPrice:
                this.round(
                  this.number(
                    item.unitPrice,
                  ),
                ),

              total:
                this.round(
                  this.number(
                    item.quantity,
                  ) *
                    this.number(
                      item.unitPrice,
                    ),
                ),
            }),
          ),
      },
    };

    // ==========================================================
    // CRIAR FACTURA
    // ==========================================================

    let invoice;

    try {
      invoice =
        await this.prisma.invoice.create({
          data,

          include: {
            client: true,
            items: true,
          },
        });
    } catch (error: any) {
      if (
        error?.code !==
        'P2002'
      ) {
        throw error;
      }

      // ========================================================
      // RETRY DA NUMERAÇÃO
      // ========================================================

      const retryNumber =
        await this.getNextInvoiceNumber(
          tenantId,
          year,
        );

      try {
        invoice =
          await this.prisma.invoice.create({
            data: {
              ...data,

              invoiceNumber:
                retryNumber,
            },

            include: {
              client: true,
              items: true,
            },
          });
      } catch (
        retryError: any
      ) {
        if (
          retryError?.code ===
          'P2002'
        ) {
          throw new ConflictException(
            'Não foi possível gerar uma numeração única para a factura. Tente novamente.',
          );
        }

        throw retryError;
      }
    }

    // ==========================================================
    // SINCRONIZAR OBRIGAÇÕES
    //
    // A factura já foi persistida.
    //
    // O ObligationsService passa a conseguir utilizar:
    //
    // invoice.iva
    // invoice.withholdingTax
    //
    // no cálculo das obrigações.
    // ==========================================================

    await this.syncFiscalObligations(
      tenantId,
    );

    return invoice;
  }

  // ============================================================
  // TAXA NORMAL DE IVA
  // ============================================================

  private getInvoiceIvaRate(
    regime: string,
  ): number {
    const normalized =
      String(
        regime ?? '',
      )
        .trim()
        .toUpperCase();

    /*
     * Regime Simplificado:
     * não liquidamos 14% na factura.
     *
     * O apuramento é feito no módulo de obrigações:
     * 7% × recebimentos efectivos do período.
     */
    if (
      normalized.includes(
        'SIMPLIFICADO',
      )
    ) {
      return 0;
    }

    /*
     * Regime Geral:
     * taxa normal de IVA = 14%.
     *
     * Taxas especiais (por exemplo, operações sujeitas
     * a taxa reduzida ou Cabinda) não podem ser inferidas
     * apenas pelo regime da empresa. O modelo actual não
     * possui classificação fiscal suficiente por item.
     */
    return 0.14;
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
    tenantId: string,
    year: number,
  ): Promise<string> {
    const prefix =
      `FT-${year}-`;

    const invoices =
      await this.prisma.invoice.findMany({
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

    const paid =
      await this.prisma.invoice.update({
        where: {
          id:
            invoice.id,
        },

        data: {
          status:
            'PAID',
        },

        include: {
          client: true,
          items: true,
        },
      });

    /*
     * A factura agora está PAID.
     *
     * Sincronizamos novamente para manter o estado fiscal
     * actualizado.
     */
    await this.syncFiscalObligations(
      tenantId,
    );

    return paid;
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

    const cancelled =
      await this.prisma.invoice.update({
        where: {
          id:
            invoice.id,
        },

        data: {
          status:
            'CANCELLED',
        },

        include: {
          client: true,
          items: true,
        },
      });

    // ==========================================================
    // RECALCULAR OBRIGAÇÕES
    //
    // A factura cancelada é excluída pelo ObligationsService.
    // ==========================================================

    await this.syncFiscalObligations(
      tenantId,
    );

    return cancelled;
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

    const revenueReceived =
      this.round(
        paid.reduce(
          (
            sum,
            invoice,
          ) =>
            sum +
            this.number(
              invoice.total,
            ),
          0,
        ),
      );

    const revenuePending =
      this.round(
        pending.reduce(
          (
            sum,
            invoice,
          ) =>
            sum +
            this.number(
              invoice.total,
            ),
          0,
        ),
      );

    const totalInvoiced =
      this.round(
        invoices
          .filter(
            (invoice) =>
              invoice.status !==
              'CANCELLED',
          )
          .reduce(
            (
              sum,
              invoice,
            ) =>
              sum +
              this.number(
                invoice.total,
              ),
            0,
          ),
      );

    return {
      totalInvoices,

      paidInvoices:
        paid.length,

      pendingInvoices:
        pending.length,

      cancelledInvoices:
        cancelled.length,

      revenueReceived,

      revenuePending,

      totalInvoiced,
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
            item.unitPrice,
          )} AOA`,
          350,
          y,
        );

        doc.text(
          `${this.formatMoney(
            item.total,
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
        invoice.subtotal,
      )} AOA`,
      340,
      y + 20,
    );

    const pdfIvaLabel =
      this.number(
        invoice.iva,
      ) > 0
        ? 'IVA'
        : 'IVA (apurado no regime)';

    doc.text(
      `${pdfIvaLabel}: ${this.formatMoney(
        invoice.iva,
      )} AOA`,
      340,
      y + 45,
    );

    doc.text(
      `Retencao: ${this.formatMoney(
        invoice.withholdingTax,
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
          invoice.total,
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

    doc
      .fontSize(9)
      .fillColor('gray')
      .text(
        'Documento emitido automaticamente pelo Sistema Fiscalidade Digital',
        40,
        800,
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