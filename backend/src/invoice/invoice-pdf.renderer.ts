import { Prisma } from '@prisma/client';

type Money = { toString(): string } | number | string | null | undefined;

export interface InvoicePdfData {
  invoiceNumber: string;
  documentType: string;
  fiscalDocumentType?: string | null;
  rectifiedInvoiceNumber?: string | null;
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
  tenant: {
    name: string;
    nif: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  client: {
    name: string;
    nif?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    productName: string;
    quantity: Money;
    quantityAmount?: Money;
    unitPrice: Money;
    unitPriceAmount?: Money;
    total: Money;
    totalAmount?: Money;
    taxRate?: Money;
    unit?: string | null;
    product?: { code?: string | null; ivaRate?: number | null } | null;
  }>;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 38;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_BOTTOM = 710;
const FOOTER_TOP = 790;
const BLUE = '#123B68';
const TEXT = '#172033';
const MUTED = '#5F6B7A';
const LINE = '#D7DEE8';
const LIGHT = '#F3F6F9';
const ITEM_DESCRIPTION_WIDTH = 190;
const ITEM_MIN_HEIGHT = 31;
const ITEM_VERTICAL_PADDING = 18;
const TOTALS_HEIGHT = 145;

const money = (value: Money) => {
  const numeric = Number(value?.toString() ?? 0);
  return `${(Number.isFinite(numeric) ? numeric : 0).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
};

const quantity = (value: Money) => {
  const numeric = Number(value?.toString() ?? 0);
  return Number.isFinite(numeric)
    ? numeric.toLocaleString('pt-AO', { maximumFractionDigits: 4 })
    : '0';
};

const date = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString('pt-AO') : '—';

export const formatPaymentStatus = (status: string) =>
  ({ PAID: 'Paga', PENDING: 'Pendente', CANCELLED: 'Cancelada' })[status] ??
  status;

export const formatLineVatRate = (rate: number | null | undefined) =>
  rate == null ? '—' : `${quantity(rate)}%`;

export function documentPresentation(invoice: InvoicePdfData) {
  if (invoice.documentType === 'PRO_FORMA') {
    return {
      code: 'PF',
      title: 'PRO FORMA',
      detail: 'Pro Forma · documento preliminar',
    };
  }

  if (invoice.fiscalDocumentType === 'NC') {
    return {
      code: 'NC',
      title: 'NOTA DE CRÉDITO',
      detail: 'NC — Nota de crédito',
    };
  }

  if (invoice.fiscalDocumentType === 'ND') {
    return {
      code: 'ND',
      title: 'NOTA DE DÉBITO',
      detail: 'ND — Nota de débito',
    };
  }

  return {
    code: 'FT',
    title: 'FACTURA',
    detail: 'FT — Factura',
  };
}

export function resolveLineVatRate(
  invoice: InvoicePdfData,
  item: InvoicePdfData['items'][number],
): number | null {
  const persistedRate = Number(item.taxRate?.toString() ?? Number.NaN);
  if (Number.isFinite(persistedRate)) {
    return persistedRate;
  }

  if (item.product?.ivaRate != null && Number.isFinite(item.product.ivaRate)) {
    return item.product.ivaRate;
  }

  if (invoice.items.length !== 1) return null;

  try {
    const base = new Prisma.Decimal(
      (invoice.subtotalAmount ?? invoice.subtotal)?.toString() ?? '0',
    );
    const lineBase = new Prisma.Decimal(
      (item.totalAmount ?? item.total)?.toString() ?? '0',
    );
    const vat = new Prisma.Decimal(
      (invoice.ivaAmount ?? invoice.iva)?.toString() ?? '0',
    );

    if (
      base.lessThanOrEqualTo(0) ||
      vat.lessThan(0) ||
      !lineBase.equals(base)
    ) {
      return null;
    }

    return vat.dividedBy(base).times(100).toDecimalPlaces(4).toNumber();
  } catch {
    return null;
  }
}

function label(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(MUTED)
    .text(text.toUpperCase(), x, y, { characterSpacing: 0.6 });
}

function value(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
) {
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(TEXT)
    .text(text, x, y, { width, lineGap: 1 });
}

function addPageHeader(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfData,
  continued = false,
) {
  const presentation = documentPresentation(invoice);
  doc.fillColor(BLUE).rect(0, 0, 7, PAGE_HEIGHT).fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(BLUE)
    .text(invoice.tenant.name, MARGIN, 30, { width: 300 });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(MUTED)
    .text(`NIF ${invoice.tenant.nif}`, MARGIN, 44);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(BLUE)
    .text(
      continued
        ? `${invoice.invoiceNumber} · continuação`
        : `${presentation.code} · ${presentation.title}`,
      350,
      34,
      { width: 207, align: 'right' },
    );
  doc
    .moveTo(MARGIN, 63)
    .lineTo(PAGE_WIDTH - MARGIN, 63)
    .lineWidth(0.7)
    .strokeColor(LINE)
    .stroke();
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

function setItemDescriptionFont(doc: PDFKit.PDFDocument) {
  doc.font('Helvetica').fontSize(8.5).fillColor(TEXT);
}

export function measureInvoiceItemRowHeight(
  doc: PDFKit.PDFDocument,
  description: string,
) {
  setItemDescriptionFont(doc);
  const descriptionHeight = doc.heightOfString(description, {
    width: ITEM_DESCRIPTION_WIDTH,
    lineGap: 1,
  });

  return Math.max(
    ITEM_MIN_HEIGHT,
    Math.ceil(descriptionHeight + ITEM_VERTICAL_PADDING),
  );
}

function notesTextHeight(doc: PDFKit.PDFDocument, text: string, width: number) {
  doc.font('Helvetica').fontSize(9.5).fillColor(TEXT);
  return doc.heightOfString(text, { width, lineGap: 1 });
}

function notesChunkForHeight(
  doc: PDFKit.PDFDocument,
  text: string,
  width: number,
  maxHeight: number,
) {
  if (notesTextHeight(doc, text, width) <= maxHeight) {
    return { text, remaining: '' };
  }

  const characters = Array.from(text);
  let low = 1;
  let high = characters.length;
  let end = 0;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = characters.slice(0, middle).join('');

    if (notesTextHeight(doc, candidate, width) <= maxHeight) {
      end = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  if (end === 0) {
    return {
      text: characters[0] ?? '',
      remaining: characters.slice(1).join(''),
    };
  }

  let preferredEnd = end;
  for (let index = end; index > 0; index -= 1) {
    if (
      /\s/.test(characters[index - 1] ?? '') &&
      characters.slice(0, index).join('').trim().length > 0
    ) {
      preferredEnd = index;
      break;
    }
  }

  return {
    text: characters.slice(0, preferredEnd).join(''),
    remaining: characters.slice(preferredEnd).join(''),
  };
}

function addContinuationPage(doc: PDFKit.PDFDocument, invoice: InvoicePdfData) {
  doc.addPage();
  addPageHeader(doc, invoice, true);
  return 86;
}

function renderObservations(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfData,
  startY: number,
) {
  const notes = invoice.notes?.trim();
  if (!notes) return startY;

  let y = startY;
  let remaining = notes;
  let heading = 'Observações';

  while (remaining) {
    const textY = y + 15;
    const availableHeight = CONTENT_BOTTOM - textY;

    if (availableHeight < 18) {
      y = addContinuationPage(doc, invoice);
      heading = 'Observações (continuação)';
      continue;
    }

    const chunk = notesChunkForHeight(
      doc,
      remaining,
      CONTENT_WIDTH,
      availableHeight,
    );
    const renderedHeight = notesTextHeight(doc, chunk.text, CONTENT_WIDTH);

    label(doc, heading, MARGIN, y);
    value(doc, chunk.text, MARGIN, textY, CONTENT_WIDTH);
    y = textY + renderedHeight;
    remaining = chunk.remaining;

    if (remaining) {
      y = addContinuationPage(doc, invoice);
      heading = 'Observações (continuação)';
    }
  }

  return y;
}

export function renderInvoicePdf(
  doc: PDFKit.PDFDocument,
  invoice: InvoicePdfData,
) {
  const presentation = documentPresentation(invoice);
  const isAdjustment = presentation.code === 'NC' || presentation.code === 'ND';
  addPageHeader(doc, invoice);

  doc
    .font('Helvetica-Bold')
    .fontSize(25)
    .fillColor(TEXT)
    .text(presentation.title, MARGIN, 82);
  label(doc, 'Tipo de documento', MARGIN, 119);
  value(doc, presentation.detail, MARGIN, 131, 180);
  if (isAdjustment && invoice.rectifiedInvoiceNumber) {
    label(doc, 'Documento rectificado', 225, 119);
    value(doc, invoice.rectifiedInvoiceNumber, 225, 131, 150);
  }
  const statusX = isAdjustment && invoice.rectifiedInvoiceNumber ? 400 : 225;
  label(doc, 'Estado de pagamento', statusX, 119);
  value(doc, formatPaymentStatus(invoice.status), statusX, 131, 105);

  label(doc, 'Número do documento', 355, 86);
  value(doc, invoice.invoiceNumber, 355, 98, 202);
  label(doc, 'Data de emissão', 355, 120);
  value(doc, date(invoice.issuedAt), 355, 132, 90);
  label(doc, 'Vencimento', 458, 120);
  value(doc, date(invoice.dueDate), 458, 132, 99);

  const cardY = 166;
  doc
    .roundedRect(MARGIN, cardY, 252, 112, 2)
    .lineWidth(0.7)
    .strokeColor(LINE)
    .stroke();
  doc.roundedRect(305, cardY, 252, 112, 2).stroke();
  label(doc, 'Emissor', 50, cardY + 14);
  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(TEXT)
    .text(invoice.tenant.name, 50, cardY + 30, { width: 228 });
  value(doc, `NIF: ${invoice.tenant.nif}`, 50, cardY + 49, 228);
  let issuerY = cardY + 65;
  if (invoice.tenant.address) {
    value(doc, invoice.tenant.address, 50, issuerY, 228);
    issuerY += 15;
  }
  if (invoice.tenant.phone)
    value(doc, `Contacto: ${invoice.tenant.phone}`, 50, issuerY, 228);

  label(doc, 'Adquirente / Cliente', 317, cardY + 14);
  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(TEXT)
    .text(invoice.client.name, 317, cardY + 30, { width: 228 });
  value(
    doc,
    invoice.client.nif ? `NIF: ${invoice.client.nif}` : 'NIF: Não indicado',
    317,
    cardY + 49,
    228,
  );
  let clientY = cardY + 65;
  if (invoice.client.address) {
    value(doc, invoice.client.address, 317, clientY, 228);
    clientY += 15;
  }
  if (invoice.client.phone)
    value(doc, `Contacto: ${invoice.client.phone}`, 317, clientY, 228);

  let y = 304;
  label(doc, 'Artigos e serviços', MARGIN, y);
  y = tableHeader(doc, y + 16);
  doc
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .lineWidth(0.5)
    .strokeColor(LINE)
    .stroke();

  invoice.items.forEach((item) => {
    const rowHeight = measureInvoiceItemRowHeight(doc, item.productName);
    if (y + rowHeight > CONTENT_BOTTOM) {
      doc.addPage();
      addPageHeader(doc, invoice, true);
      y = tableHeader(doc, 82);
    }
    doc
      .moveTo(MARGIN, y + rowHeight)
      .lineTo(PAGE_WIDTH - MARGIN, y + rowHeight)
      .lineWidth(0.5)
      .strokeColor(LINE)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(item.product?.code || '—', 44, y + 9, { width: 52 });
    setItemDescriptionFont(doc);
    doc.text(item.productName, 100, y + 9, {
      width: ITEM_DESCRIPTION_WIDTH,
      lineGap: 1,
    });
    doc.text(
      `${quantity(item.quantityAmount ?? item.quantity)} ${item.unit || 'UN'}`,
      294,
      y + 9,
      { width: 60, align: 'right' },
    );
    doc.text(money(item.unitPriceAmount ?? item.unitPrice), 358, y + 9, {
      width: 79,
      align: 'right',
    });
    doc.text(formatLineVatRate(resolveLineVatRate(invoice, item)), 441, y + 9, {
      width: 36,
      align: 'right',
    });
    doc
      .font('Helvetica-Bold')
      .text(money(item.totalAmount ?? item.total), 481, y + 9, {
        width: 68,
        align: 'right',
      });
    y += rowHeight;
  });

  y += 18;
  y = renderObservations(doc, invoice, y);

  if (y + 18 + TOTALS_HEIGHT > CONTENT_BOTTOM) {
    y = addContinuationPage(doc, invoice);
  } else {
    y += 18;
  }

  const totalsX = 326;
  const totalsY = y;
  doc.roundedRect(totalsX, totalsY, 231, TOTALS_HEIGHT, 2).fill(LIGHT);
  label(doc, 'Resumo fiscal e totais', totalsX + 14, totalsY + 13);
  const rows: Array<[string, string]> = [
    ['Subtotal / base', money(invoice.subtotalAmount ?? invoice.subtotal)],
    ['IVA', money(invoice.ivaAmount ?? invoice.iva)],
  ];
  const withholding = Number(
    (invoice.withholdingTaxAmount ?? invoice.withholdingTax)?.toString() ?? 0,
  );
  if (withholding !== 0)
    rows.push([
      'Retenção',
      money(invoice.withholdingTaxAmount ?? invoice.withholdingTax),
    ]);
  rows.forEach(([name, amount], index) => {
    const rowY = totalsY + 35 + index * 20;
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(MUTED)
      .text(name, totalsX + 14, rowY, { width: 90 });
    doc
      .font('Helvetica-Bold')
      .fillColor(TEXT)
      .text(amount, totalsX + 109, rowY, { width: 100, align: 'right' });
  });
  doc
    .moveTo(totalsX + 14, totalsY + 101)
    .lineTo(totalsX + 209, totalsY + 101)
    .strokeColor(LINE)
    .stroke();
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(MUTED)
    .text('TOTAL', totalsX + 14, totalsY + 113);
  doc
    .font('Helvetica-Bold')
    .fontSize(15)
    .fillColor(BLUE)
    .text(
      money(invoice.totalAmount ?? invoice.total),
      totalsX + 70,
      totalsY + 109,
      { width: 139, align: 'right' },
    );

  if (
    invoice.taxCalculationStatus === 'PAYMENT_BASIS_NOT_INVOICE_LIQUIDATION'
  ) {
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#7C4A03')
      .text(
        'IVA apurado segundo o regime fiscal registado para a empresa.',
        MARGIN,
        totalsY + 94,
        { width: 270 },
      );
  }

  const range = doc.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index);
    doc
      .moveTo(MARGIN, FOOTER_TOP - 8)
      .lineTo(PAGE_WIDTH - MARGIN, FOOTER_TOP - 8)
      .lineWidth(0.5)
      .strokeColor(LINE)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text(
        'Documento gerado através da Fiscalidade Digital',
        MARGIN,
        FOOTER_TOP,
        { width: 350 },
      );
    doc.text(
      `Página ${index - range.start + 1} de ${range.count}`,
      440,
      FOOTER_TOP,
      { width: 117, align: 'right' },
    );
  }
}
