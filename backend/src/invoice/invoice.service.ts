
const PDFDocument = require('pdfkit');
import { Response } from 'express';

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PrismaService,
} from '../prisma/prisma.service';

import {
  CreateInvoiceDto,
} from './dto/create-invoice.dto';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    dto: CreateInvoiceDto,
  ) {
    console.log('========================');
    console.log('FACTURA RECEBIDA');
    console.log(dto);
    console.log('========================');

    const tenant =
      await this.prisma.tenant.findUnique({
        where: {
          id: dto.tenantId,
        },
      });

    if (!tenant) {
      throw new NotFoundException(
        'Empresa não encontrada',
      );
    }

    const client =
      await this.prisma.client.findUnique({
        where: {
          id: dto.clientId,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Cliente não encontrado',
      );
    }

    const iva =
      dto.subtotal * 0.14;

    const withholdingTax =
      tenant.regime === 'GERAL'
        ? dto.subtotal * 0.065
        : 0;

    const total =
      dto.subtotal +
      iva -
      withholdingTax;

    const count =
      await this.prisma.invoice.count();

    const invoiceNumber =
      `FT-${new Date().getFullYear()}-${String(
        count + 1,
      ).padStart(5, '0')}`;

    const invoice =
      await this.prisma.invoice.create({
        data: {
          tenantId: dto.tenantId,

          clientId: dto.clientId,

          invoiceNumber,

          subtotal: dto.subtotal,

          iva,

          withholdingTax,

          total,

          notes: dto.notes,

          status: 'PENDING',

          items: {
            create: dto.items.map(
              (item) => ({
                productName:
                  item.productName,

                quantity:
                  item.quantity,

                unitPrice:
                  item.unitPrice,

                total:
                  item.quantity *
                  item.unitPrice,
              }),
            ),
          },
        },

        include: {
          client: true,
          items: true,
        },
      });

    return invoice;
  }

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
      createdAt: 'desc',
    },

    });
  }
async generatePdf(
  id: string,
  res: Response,
) {
  const invoice =
    await this.prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        client: true,
        items: true,
        tenant: true,
      },
    });

  if (!invoice) {
    throw new NotFoundException(
      'Factura não encontrada',
    );
  }

  const doc = new PDFDocument({
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

  // ==========================
  // CABEÇALHO
  // ==========================

  doc
    .rect(0, 0, 595, 110)
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
      'Sistema Inteligente de Gestão Fiscal',
      {
        align: 'center',
      },
    );

  doc.fillColor('black');

  // ==========================
  // EMPRESA
  // ==========================

  doc
    .roundedRect(
      40,
      130,
      240,
      90,
      5,
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

  // ==========================
  // FACTURA
  // ==========================

  doc
    .roundedRect(
      310,
      130,
      245,
      90,
      5,
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
      `Número: ${invoice.invoiceNumber}`,
      320,
      165,
    );

  doc.text(
    `Data: ${new Date(
      invoice.createdAt,
    ).toLocaleDateString('pt-PT')}`,
    320,
    185,
  );

  doc.text(
    `Estado: ${invoice.status}`,
    320,
    205,
  );

  // ==========================
  // CLIENTE
  // ==========================

  doc
    .roundedRect(
      40,
      245,
      515,
      95,
      5,
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

  if (invoice.client.nif) {
    doc.text(
      `NIF: ${invoice.client.nif}`,
      50,
      305,
    );
  }

  if (invoice.client.email) {
    doc.text(
      `Email: ${invoice.client.email}`,
      250,
      285,
    );
  }

  if (invoice.client.phone) {
    doc.text(
      `Telefone: ${invoice.client.phone}`,
      250,
      305,
    );
  }

  // ==========================
  // TABELA
  // ==========================

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
    'Descrição',
    50,
    y + 8,
  );

  doc.text(
    'Qtd',
    290,
    y + 8,
  );

  doc.text(
    'Preço Unit.',
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
        String(item.quantity),
        290,
        y,
      );

      doc.text(
        `${item.unitPrice.toLocaleString()} AOA`,
        350,
        y,
      );

      doc.text(
        `${item.total.toLocaleString()} AOA`,
        470,
        y,
      );

      y += 25;
    },
  );

  // ==========================
  // RESUMO FINANCEIRO
  // ==========================

  y += 40;

  doc
    .roundedRect(
      320,
      y,
      235,
      140,
      5,
    )
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(12);

  doc.text(
    `Subtotal: ${invoice.subtotal.toLocaleString()} AOA`,
    340,
    y + 20,
  );

  doc.text(
    `IVA (14%): ${invoice.iva.toLocaleString()} AOA`,
    340,
    y + 45,
  );

  doc.text(
    `Retenção: ${invoice.withholdingTax.toLocaleString()} AOA`,
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
      `${invoice.total.toLocaleString()} AOA`,
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

  // ==========================
  // OBSERVAÇÕES
  // ==========================

  if (invoice.notes) {
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(
        'OBSERVAÇÕES',
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

  // ==========================
  // ASSINATURA
  // ==========================

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

  // ==========================
  // RODAPÉ
  // ==========================

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
      'Factura não encontrada',
    );
  }

  return invoice;
}

      

  async markAsPaid(
    id: string,
  ) {
    return this.prisma.invoice.update({
      where: {
        id,
      },

      data: {
        status: 'PAID',
      },
    });
  }

  async cancel(
    id: string,
  ) {
    return this.prisma.invoice.update({
      where: {
        id,
      },

      data: {
        status: 'CANCELLED',
      },
    });
  }

  async getDashboardStats() {
    const invoices =
      await this.prisma.invoice.findMany();

    const totalInvoices =
      invoices.length;

    const paidInvoices =
      invoices.filter(
        (invoice) =>
          invoice.status ===
          'PAID',
      ).length;

    const pendingInvoices =
      invoices.filter(
        (invoice) =>
          invoice.status ===
          'PENDING',
      ).length;

    const cancelledInvoices =
      invoices.filter(
        (invoice) =>
          invoice.status ===
          'CANCELLED',
      ).length;

    const revenueReceived =
      invoices
        .filter(
          (invoice) =>
            invoice.status ===
            'PAID',
        )
        .reduce(
          (
            total,
            invoice,
          ) =>
            total +
            invoice.total,
          0,
        );

    const revenuePending =
      invoices
        .filter(
          (invoice) =>
            invoice.status ===
            'PENDING',
        )
        .reduce(
          (
            total,
            invoice,
          ) =>
            total +
            invoice.total,
          0,
        );

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      cancelledInvoices,
      revenueReceived,
      revenuePending,
    };
    
  }
}