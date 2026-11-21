import { HistoryService } from './history.service';

describe('HistoryService fiscal document totals', () => {
  const prisma = {
    invoice: { findMany: jest.fn() },
    purchaseInvoice: { findMany: jest.fn() },
    revenue: { findMany: jest.fn() },
    taxTransaction: { findMany: jest.fn() },
    taxAssessment: { findMany: jest.fn() },
    fiscalObligation: { findMany: jest.fn() },
    taxDeclaration: { findMany: jest.fn() },
    taxPayment: { findMany: jest.fn() },
  } as any;
  const service = new HistoryService(prisma);

  function invoice(
    id: string,
    fiscalDocumentType: 'FT' | 'NC' | 'ND',
    status: string,
    total: number,
    day: number,
  ) {
    return {
      id,
      invoiceNumber: `${fiscalDocumentType}-2026-${id}`,
      fiscalDocumentType,
      status,
      total,
      iva: 0,
      withholdingTax: 0,
      issuedAt: new Date(`2026-09-${String(day).padStart(2, '0')}T10:00:00Z`),
      rectifiesInvoiceId:
        fiscalDocumentType === 'FT' ? null : 'ft-active',
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.purchaseInvoice.findMany.mockResolvedValue([]);
    prisma.revenue.findMany.mockResolvedValue([]);
    prisma.taxTransaction.findMany.mockResolvedValue([]);
    prisma.taxAssessment.findMany.mockResolvedValue([]);
    prisma.fiscalObligation.findMany.mockResolvedValue([]);
    prisma.taxDeclaration.findMany.mockResolvedValue([]);
    prisma.taxPayment.findMany.mockResolvedValue([]);
  });

  it('exclui documentos anulados dos totais e conserva-os no historico', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      invoice('ft-active', 'FT', 'PAID', 100, 1),
      invoice('ft-cancelled', 'FT', 'CANCELLED', 900, 2),
      invoice('nc-active', 'NC', 'PAID', 20, 3),
      invoice('nd-active', 'ND', 'PENDING', 15, 4),
      invoice('nc-cancelled', 'NC', 'CANCELLED', 90, 5),
      invoice('nd-cancelled', 'ND', 'CANCELLED', 80, 6),
    ]);
    prisma.revenue.findMany.mockResolvedValue([
      {
        id: 'revenue-1',
        year: 2026,
        month: 9,
        notes: 'Receita complementar',
        amount: 30,
      },
    ]);

    const result = await service.findAll('tenant-a');

    expect(result.totals).toMatchObject({
      income: 130,
      fiscalAdjustments: -5,
      netFiscalDocuments: 125,
      balance: 130,
    });
    expect(result.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reference: 'FT-2026-ft-cancelled',
          status: 'CANCELLED',
          amount: 900,
        }),
        expect.objectContaining({
          reference: 'NC-2026-nc-cancelled',
          status: 'CANCELLED',
          amount: -90,
        }),
      ]),
    );
  });
});
