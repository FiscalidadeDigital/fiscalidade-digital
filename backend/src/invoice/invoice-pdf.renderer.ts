import PDFDocument from 'pdfkit';

type Money = { toString(): string } | number | string | null | undefined;

export interface InvoicePdfData {
  invoiceNumber: string;
  documentType: string;
  status: string;
  issuedAt: Date;
  dueDate?: Date | null;
  notes?: string | null;
  subtotal: Money;
  subtotalAmount?: Money;
  iva: Money;
  ivaAmount?: Money;
  withholdingTax: Money;
  withholdingTaxAmount?: Money;
  total: Money;
  totalAmount?: Money;
  taxCalculationStatus?: string | null;
  tenant: { name: string; nif: string; email?: string | null; phone?: string | null; address?: string | null };
  client: { name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null };
  items: Array<{
    productName: string;
    quantity: Money;
    quantityAmount?: Money;
    unitPrice: Money;
    unitPriceAmount?: Money;
    total: Money;
    totalAmount?: Money;
    unit?: string | null;
    product?: { code?: string | null; ivaRate?: number | null } | null;
  }>;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 38;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_TOP = 790;
const BLUE = '#123B68';
const TEXT = '#172033';
const MUTED = '#5F6B7A';
const LINE = '#D7DEE8';
const LIGHT = '#F3F6F9';

const money = (value: Money) => {
  const numeric = Number(value?.toString() ?? 0);
  return `${(Number.isFinite(numeric) ? numeric : 0).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
};

const quantity = (value: Money) => {
  const numeric = Number(value?.toString() ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString('pt-AO', { maximumFractionDigits: 4 }) : '0';
};

const date = (value?: Date | null) => value ? new Date(value).toLocaleDateString('pt-AO') : '—';

const paymentStatus = (status: string) => ({ PAID: 'Paga', PENDING: 'Pendente', CANCELLED: 'Cancelada' })[status] ?? status;

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(MUTED).text(text.toUpperCase(), x, y, { characterSpacing: 0.6 });
}

function value(doc: PDFKit.PDFDocument, text: string, x: number, y: number, width: number) {
  doc.font('Helvetica').fontSize(9.5).fillColor(TEXT).text(text, x, y, { width, lineGap: 1 });
}

function addPageHeader(doc: PDFKit.PDFDocument, invoice: InvoicePdfData, continued = false) {
  doc.fillColor(BLUE).rect(0, 0, 7, PAGE_HEIGHT).fill();
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text(invoice.tenant.name, MARGIN, 30, { width: 300 });
  doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(`NIF ${invoice.tenant.nif}`, MARGIN, 44);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BLUE).text(continued ? `${invoice.invoiceNumber} · continuação` : 'FT · FACTURA', 350, 34, { width: 207, align: 'right' });
  doc.moveTo(MARGIN, 63).lineTo(PAGE_WIDTH - MARGIN, 63).lineWidth(0.7).strokeColor(LINE).stroke();
}

function tableHeader(doc: PDFKit.PDFDocument, y: number) {
  doc.rect(MARGIN, y, CONTENT_WIDTH, 24).fill(LIGHT);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(MUTED);
  doc.text('CÓDIGO', 44, y + 8, { width: 52 });
  doc.text('DESCRIÇÃO', 100, y + 8, { width: 190 });
  doc.text('QTD. / UN.', 294, y + 8, { width: 60, align: 'right' });
  doc.text('PREÇO UNIT.', 358, y + 8, { width: 79, align: 'right' });
  doc.text('IVA', 441, y + 8, { width: 36, align: 'right' });
  doc.text('TOTAL', 481, y + 8, { width: 68, align: 'right' });
  return y + 24;
}

export function renderInvoicePdf(doc: PDFKit.PDFDocument, invoice: InvoicePdfData) {
  const isProForma = invoice.documentType === 'PRO_FORMA';
  addPageHeader(doc, invoice);

  doc.font('Helvetica-Bold').fontSize(24).fillColor(TEXT).text(isProForma ? 'PRO FORMA' : 'FACTURA', MARGIN, 86);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE).text(isProForma ? 'DOCUMENTO PRELIMINAR' : 'FT — FACTURA', MARGIN, 116);

  label(doc, 'Número do documento', 355, 86);
  value(doc, invoice.invoiceNumber, 355, 98, 202);
  label(doc, 'Data de emissão', 355, 120);
  value(doc, date(invoice.issuedAt), 355, 132, 90);
  label(doc, 'Vencimento', 458, 120);
  value(doc, date(invoice.dueDate), 458, 132, 99);

  const cardY = 166;
  doc.rect(MARGIN, cardY, 252, 112).lineWidth(0.7).strokeColor(LINE).stroke();
  doc.rect(305, cardY, 252, 112).stroke();
  label(doc, 'Emissor', 50, cardY + 14);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT).text(invoice.tenant.name, 50, cardY + 30, { width: 228 });
  value(doc, `NIF: ${invoice.tenant.nif}`, 50, cardY + 49, 228);
  let issuerY = cardY + 65;
  if (invoice.tenant.address) { value(doc, invoice.tenant.address, 50, issuerY, 228); issuerY += 15; }
  if (invoice.tenant.phone) value(doc, `Contacto: ${invoice.tenant.phone}`, 50, issuerY, 228);

  label(doc, 'Adquirente / Cliente', 317, cardY + 14);
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT).text(invoice.client.name, 317, cardY + 30, { width: 228 });
  value(doc, invoice.client.nif ? `NIF: ${invoice.client.nif}` : 'NIF: não informado', 317, cardY + 49, 228);
  let clientY = cardY + 65;
  if (invoice.client.address) { value(doc, invoice.client.address, 317, clientY, 228); clientY += 15; }
  if (invoice.client.phone) value(doc, `Contacto: ${invoice.client.phone}`, 317, clientY, 228);

  let y = 304;
  label(doc, 'Artigos e serviços', MARGIN, y);
  y = tableHeader(doc, y + 16);

  invoice.items.forEach((item) => {
    const descriptionHeight = doc.heightOfString(item.productName, { width: 190, lineGap: 1 });
    const rowHeight = Math.max(31, descriptionHeight + 14);
    if (y + rowHeight > 710) {
      doc.addPage();
      addPageHeader(doc, invoice, true);
      y = tableHeader(doc, 82);
    }
    doc.moveTo(MARGIN, y + rowHeight).lineTo(PAGE_WIDTH - MARGIN, y + rowHeight).lineWidth(0.5).strokeColor(LINE).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(item.product?.code || '—', 44, y + 9, { width: 52 });
    doc.font('Helvetica').fontSize(8.5).fillColor(TEXT).text(item.productName, 100, y + 9, { width: 190, lineGap: 1 });
    doc.text(`${quantity(item.quantityAmount ?? item.quantity)} ${item.unit || 'UN'}`, 294, y + 9, { width: 60, align: 'right' });
    doc.text(money(item.unitPriceAmount ?? item.unitPrice), 358, y + 9, { width: 79, align: 'right' });
    doc.text(item.product?.ivaRate == null ? '—' : `${quantity(item.product.ivaRate)}%`, 441, y + 9, { width: 36, align: 'right' });
    doc.font('Helvetica-Bold').text(money(item.totalAmount ?? item.total), 481, y + 9, { width: 68, align: 'right' });
    y += rowHeight;
  });

  const notesHeight = invoice.notes ? Math.min(55, doc.heightOfString(invoice.notes, { width: 270 })) : 0;
  const required = Math.max(160, notesHeight + 45);
  if (y + required > 710) {
    doc.addPage();
    addPageHeader(doc, invoice, true);
    y = 86;
  } else {
    y += 18;
  }

  if (invoice.notes) {
    label(doc, 'Observações', MARGIN, y);
    value(doc, invoice.notes, MARGIN, y + 15, 270);
  }

  const totalsX = 334;
  const totalsY = y;
  doc.rect(totalsX, totalsY, 223, 145).fill(LIGHT);
  label(doc, 'Resumo fiscal e totais', totalsX + 14, totalsY + 13);
  const rows: Array<[string, string]> = [
    ['Subtotal / base', money(invoice.subtotalAmount ?? invoice.subtotal)],
    ['IVA', money(invoice.ivaAmount ?? invoice.iva)],
  ];
  const withholding = Number((invoice.withholdingTaxAmount ?? invoice.withholdingTax)?.toString() ?? 0);
  if (withholding !== 0) rows.push(['Retenção', money(invoice.withholdingTaxAmount ?? invoice.withholdingTax)]);
  rows.forEach(([name, amount], index) => {
    const rowY = totalsY + 35 + index * 20;
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(name, totalsX + 14, rowY, { width: 90 });
    doc.font('Helvetica-Bold').fillColor(TEXT).text(amount, totalsX + 109, rowY, { width: 100, align: 'right' });
  });
  doc.moveTo(totalsX + 14, totalsY + 101).lineTo(totalsX + 209, totalsY + 101).strokeColor(LINE).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(MUTED).text('TOTAL', totalsX + 14, totalsY + 113);
  doc.font('Helvetica-Bold').fontSize(15).fillColor(BLUE).text(money(invoice.totalAmount ?? invoice.total), totalsX + 70, totalsY + 109, { width: 139, align: 'right' });

  label(doc, 'Tipo de documento', MARGIN, totalsY + 94);
  value(doc, isProForma ? 'Pro Forma · sem efeito fiscal definitivo' : 'FT — Factura', MARGIN, totalsY + 108, 260);
  label(doc, 'Estado de pagamento', MARGIN, totalsY + 132);
  value(doc, paymentStatus(invoice.status), MARGIN, totalsY + 146, 260);
  if (invoice.taxCalculationStatus === 'PAYMENT_BASIS_NOT_INVOICE_LIQUIDATION') {
    doc.font('Helvetica').fontSize(7.5).fillColor('#7C4A03').text(
      'IVA apurado segundo o regime fiscal registado para a empresa.',
      MARGIN,
      totalsY + 169,
      { width: 270 },
    );
  }

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc.moveTo(MARGIN, FOOTER_TOP - 8).lineTo(PAGE_WIDTH - MARGIN, FOOTER_TOP - 8).lineWidth(0.5).strokeColor(LINE).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text('Documento gerado através da Fiscalidade Digital', MARGIN, FOOTER_TOP, { width: 350 });
    doc.text(`Página ${index - range.start + 1} de ${range.count}`, 440, FOOTER_TOP, { width: 117, align: 'right' });
  }
}
