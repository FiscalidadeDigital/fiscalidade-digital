import PDFDocument from 'pdfkit';
import {
  documentPresentation,
  formatLineVatRate,
  formatPaymentStatus,
  InvoicePdfData,
  measureInvoiceItemRowHeight,
  renderInvoicePdf,
  resolveLineVatRate,
} from './invoice-pdf.renderer';

const fixture = (overrides: Partial<InvoicePdfData> = {}): InvoicePdfData => ({
  invoiceNumber: 'FT-2026-00001',
  documentType: 'NORMAL',
  status: 'PENDING',
  issuedAt: new Date('2026-10-01T10:00:00Z'),
  dueDate: new Date('2026-10-31T10:00:00Z'),
  notes: null,
  subtotal: '1000.00',
  subtotalAmount: '1000.00',
  iva: '140.00',
  ivaAmount: '140.00',
  withholdingTax: '0.00',
  withholdingTaxAmount: '0.00',
  total: '1140.00',
  totalAmount: '1140.00',
  tenant: {
    name: 'Empresa Emissora, Lda.',
    nif: '5000000000',
    address: 'Luanda, Angola',
    phone: '+244 900 000 000',
  },
  client: {
    name: 'Cliente Empresarial',
    nif: '5400000000',
    address: 'Talatona, Luanda',
  },
  items: [
    {
      productName: 'Serviço de consultoria',
      quantity: '1',
      unitPrice: '1000.00',
      total: '1000.00',
      unit: 'SERV',
      product: { code: 'SRV-01', ivaRate: 14 },
    },
  ],
  ...overrides,
});

async function createPdf(data: InvoicePdfData) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 38,
    bufferPages: true,
    compress: false,
  });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  renderInvoicePdf(doc, data);
  doc.end();
  return completed;
}

async function createPdfWithPageText(data: InvoicePdfData) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 38,
    bufferPages: true,
    compress: false,
  });
  const chunks: Buffer[] = [];
  const pageText: string[][] = [[]];
  let activePage = 0;
  const capturedDocument = doc as unknown as {
    text: (
      text: string,
      x?: number,
      y?: number,
      options?: PDFKit.Mixins.TextOptions,
    ) => PDFKit.PDFDocument;
    switchToPage: (index: number) => PDFKit.PDFDocument;
  };
  const originalText = capturedDocument.text;
  const originalSwitchToPage = capturedDocument.switchToPage;

  capturedDocument.text = (text, x, y, options) => {
    pageText[activePage]?.push(String(text));
    return originalText.call(doc, text, x, y, options) as PDFKit.PDFDocument;
  };
  capturedDocument.switchToPage = (index) => {
    activePage = index;
    return originalSwitchToPage.call(doc, index) as PDFKit.PDFDocument;
  };
  doc.on('pageAdded', () => {
    pageText.push([]);
    activePage = pageText.length - 1;
  });
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  renderInvoicePdf(doc, data);
  doc.end();

  return { pdf: await completed, pageText };
}

const pageCount = (pdf: Buffer) =>
  (pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;

describe('invoice PDF renderer', () => {
  it('shows only a VAT rate actually available on the line', () => {
    expect(formatLineVatRate(14)).toBe('14%');
    expect(formatLineVatRate(0)).toBe('0%');
    expect(formatLineVatRate(null)).toBe('—');
    expect(formatLineVatRate(undefined)).toBe('—');
  });

  it('derives 14% only for an unambiguous single taxable base', () => {
    const invoice = fixture({
      subtotal: '2000000.00',
      subtotalAmount: '2000000.00',
      iva: '280000.00',
      ivaAmount: '280000.00',
      total: '2280000.00',
      totalAmount: '2280000.00',
      items: [
        {
          productName: 'Annn',
          quantity: '4',
          unitPrice: '500000.00',
          total: '2000000.00',
          unit: 'UN',
        },
      ],
    });

    expect(resolveLineVatRate(invoice, invoice.items[0])).toBe(14);
    expect(
      formatLineVatRate(resolveLineVatRate(invoice, invoice.items[0])),
    ).toBe('14%');
  });

  it('does not derive a line rate from global VAT when several lines make it ambiguous', () => {
    const invoice = fixture({
      items: [
        {
          productName: 'Linha A',
          quantity: '1',
          unitPrice: '500',
          total: '500',
          unit: 'UN',
        },
        {
          productName: 'Linha B',
          quantity: '1',
          unitPrice: '500',
          total: '500',
          unit: 'UN',
        },
      ],
    });

    expect(resolveLineVatRate(invoice, invoice.items[0])).toBeNull();
  });

  it('keeps the fiscal type independent from Portuguese payment states', () => {
    expect(formatPaymentStatus('PAID')).toBe('Paga');
    expect(formatPaymentStatus('PENDING')).toBe('Pendente');
    expect(formatPaymentStatus('CANCELLED')).toBe('Cancelada');
  });

  it('labels adjustment documents and preserves the persisted line VAT rate', () => {
    const creditNote = fixture({
      fiscalDocumentType: 'NC',
      rectifiedInvoiceNumber: 'FT-2026-00001',
      items: [
        {
          productName: 'Linha rectificada',
          quantity: '1',
          unitPrice: '100',
          total: '100',
          taxRate: '14',
          unit: 'UN',
          product: { code: 'L-1', ivaRate: 0 },
        },
      ],
    });

    expect(documentPresentation(creditNote)).toMatchObject({
      code: 'NC',
      title: 'NOTA DE CRÉDITO',
    });
    expect(resolveLineVatRate(creditNote, creditNote.items[0])).toBe(14);
  });

  it.each([
    ['IVA normal, cliente com NIF e factura pendente', fixture()],
    [
      'IVA zero e cliente sem NIF',
      fixture({
        iva: '0',
        ivaAmount: '0',
        total: '1000',
        totalAmount: '1000',
        client: { name: 'Consumidor final' },
      }),
    ],
    ['factura paga', fixture({ status: 'PAID' })],
    [
      'descrição longa',
      fixture({
        items: [
          {
            productName:
              'Prestação de serviços técnicos especializados com descrição extensa e verificável no documento emitido ao adquirente',
            quantity: '2',
            unitPrice: '500',
            total: '1000',
            unit: 'SERV',
            product: { code: 'SRV-LONGO', ivaRate: 14 },
          },
        ],
      }),
    ],
  ])('renders one A4 page for %s', async (_case, data) => {
    const pdf = await createPdf(data);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(1);
  });

  it('paginates many items without adding an empty trailing page', async () => {
    const items = Array.from({ length: 38 }, (_, index) => ({
      productName: `Linha ${index + 1} — serviço documentado`,
      quantity: '1',
      unitPrice: '100',
      total: '100',
      unit: 'UN',
      product: { code: `P-${index + 1}`, ivaRate: index % 2 ? 14 : 0 },
    }));
    const pdf = await createPdf(
      fixture({
        items,
        subtotal: '3800',
        subtotalAmount: '3800',
        iva: '0',
        ivaAmount: '0',
        total: '3800',
        totalAmount: '3800',
      }),
    );
    expect(pageCount(pdf)).toBeGreaterThan(1);
    expect(pageCount(pdf)).toBeLessThan(5);
  });

  it('measures long descriptions using the same font used to render them', () => {
    const doc = new PDFDocument({ size: 'A4', margin: 38 });
    const description =
      'Serviço técnico especializado com especificação detalhada '.repeat(4);

    doc.font('Helvetica-Bold').fontSize(7);
    const rowHeight = measureInvoiceItemRowHeight(doc, description);
    doc.font('Helvetica').fontSize(8.5);
    const renderedHeight = doc.heightOfString(description, {
      width: 190,
      lineGap: 1,
    });
    doc.end();

    expect(rowHeight).toBeGreaterThanOrEqual(Math.ceil(renderedHeight + 18));
  });

  it('paginates long observations with a header and footer on every page', async () => {
    const notes = Array.from(
      { length: 80 },
      (_, index) => `Observação ${index + 1}: detalhe comercial registado.`,
    ).join('\n');
    const { pdf, pageText } = await createPdfWithPageText(fixture({ notes }));
    const pages = pageCount(pdf);

    expect(pages).toBeGreaterThan(2);
    expect(pageText).toHaveLength(pages);
    expect(pageText[0]).toContain('FT-2026-00001');
    pageText.slice(1).forEach((text) => {
      expect(text).toContain('FT-2026-00001 · continuação');
      expect(text).toContain('Documento gerado através da Fiscalidade Digital');
    });
    expect(pageText[0]).toContain(
      'Documento gerado através da Fiscalidade Digital',
    );
  });
});
