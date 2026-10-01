import PDFDocument from 'pdfkit';
import { InvoicePdfData, renderInvoicePdf } from './invoice-pdf.renderer';

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
  tenant: { name: 'Empresa Emissora, Lda.', nif: '5000000000', address: 'Luanda, Angola', phone: '+244 900 000 000' },
  client: { name: 'Cliente Empresarial', nif: '5400000000', address: 'Talatona, Luanda' },
  items: [{ productName: 'Serviço de consultoria', quantity: '1', unitPrice: '1000.00', total: '1000.00', unit: 'SERV', product: { code: 'SRV-01', ivaRate: 14 } }],
  ...overrides,
});

async function createPdf(data: InvoicePdfData) {
  const doc = new PDFDocument({ size: 'A4', margin: 38, bufferPages: true, compress: false });
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

const pageCount = (pdf: Buffer) => (pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length;

describe('invoice PDF renderer', () => {
  it.each([
    ['IVA normal, cliente com NIF e factura pendente', fixture()],
    ['IVA zero e cliente sem NIF', fixture({ iva: '0', ivaAmount: '0', total: '1000', totalAmount: '1000', client: { name: 'Consumidor final' } })],
    ['factura paga', fixture({ status: 'PAID' })],
    ['descrição longa', fixture({ items: [{ productName: 'Prestação de serviços técnicos especializados com descrição extensa e verificável no documento emitido ao adquirente', quantity: '2', unitPrice: '500', total: '1000', unit: 'SERV', product: { code: 'SRV-LONGO', ivaRate: 14 } }] })],
  ])('renders one A4 page for %s', async (_case, data) => {
    const pdf = await createPdf(data);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(1);
  });

  it('paginates many items without adding an empty trailing page', async () => {
    const items = Array.from({ length: 38 }, (_, index) => ({
      productName: `Linha ${index + 1} — serviço documentado`, quantity: '1', unitPrice: '100', total: '100', unit: 'UN', product: { code: `P-${index + 1}`, ivaRate: index % 2 ? 14 : 0 },
    }));
    const pdf = await createPdf(fixture({ items, subtotal: '3800', subtotalAmount: '3800', iva: '0', ivaAmount: '0', total: '3800', totalAmount: '3800' }));
    expect(pageCount(pdf)).toBeGreaterThan(1);
    expect(pageCount(pdf)).toBeLessThan(5);
  });
});
