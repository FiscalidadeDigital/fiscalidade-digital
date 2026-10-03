import { Prisma } from '@prisma/client';
import { SaftInvoice } from '../model/audit-file.model';
import { productCode, ProductLineInput } from './products.builder';
import { formatSaftDate, formatSaftDateTime } from '../../fiscal-signature/fiscal-signature.service';

type FiscalLine = ProductLineInput & { quantityAmount?: Prisma.Decimal | null; quantity: number; unitPriceAmount?: Prisma.Decimal | null; unitPrice: number; totalAmount?: Prisma.Decimal | null; total: number; taxType?: string | null; taxCode?: string | null; taxRate?: Prisma.Decimal | null; taxAmount?: Prisma.Decimal | null; taxExemptionCode?: string | null; taxExemptionReason?: string | null };
export type SalesInvoiceInput = { invoiceNumber: string; fiscalDocumentType?: string | null; fiscalSeries?: string | null; status: string; cancellationReason?: string | null; issuedAt: Date; createdAt: Date; clientId: string; fiscalHash?: string | null; fiscalHashControl?: string | null; subtotalAmount?: Prisma.Decimal | null; subtotal: number; ivaAmount?: Prisma.Decimal | null; iva: number; totalAmount?: Prisma.Decimal | null; total: number; items: FiscalLine[] };
const decimal = (exact: Prisma.Decimal | null | undefined, legacy: number) => new Prisma.Decimal(exact?.toString() ?? String(legacy));
const money = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2);
const stamp = formatSaftDateTime;

export function buildSalesInvoices(invoices: SalesInvoiceInput[], sourceId: string): SaftInvoice[] {
  return invoices.map((invoice) => {
    if (!invoice.fiscalHash || !invoice.fiscalHashControl) throw new Error(`${invoice.invoiceNumber}: assinatura fiscal em falta.`);
    return ({
    invoiceNo: invoice.invoiceNumber,
    status: invoice.status === 'CANCELLED' ? 'A' : 'N',
    statusDate: stamp(invoice.createdAt),
    ...(invoice.status === 'CANCELLED' && invoice.cancellationReason ? { reason: invoice.cancellationReason } : {}),
    hash: invoice.fiscalHash, hashControl: invoice.fiscalHashControl,
    invoiceDate: formatSaftDate(invoice.issuedAt),
    invoiceType: invoice.fiscalDocumentType ?? 'FT', sourceId,
    systemEntryDate: stamp(invoice.createdAt), customerId: invoice.clientId,
    lines: invoice.items.map((line, index) => {
      if (!line.taxType || !line.taxCode || line.taxRate == null) throw new Error(`${invoice.invoiceNumber}: classificação fiscal em falta na linha ${index + 1}.`);
      if (line.taxRate.isZero() && (!line.taxExemptionCode || !line.taxExemptionReason)) throw new Error(`${invoice.invoiceNumber}: código e motivo fiscal em falta na linha ${index + 1}.`);
      return {
        lineNumber: index + 1, productCode: productCode(line), productDescription: line.productName,
        quantity: decimal(line.quantityAmount, line.quantity).toFixed(4), unitOfMeasure: line.unit ?? 'UN',
        unitPrice: money(decimal(line.unitPriceAmount, line.unitPrice)), taxPointDate: formatSaftDate(invoice.issuedAt),
        description: line.productName, creditAmount: money(decimal(line.totalAmount, line.total)),
        tax: { taxType: line.taxType, taxCode: line.taxCode, taxPercentage: line.taxRate.toFixed(4) },
        ...(line.taxExemptionCode && line.taxExemptionReason ? { taxExemptionCode: line.taxExemptionCode, taxExemptionReason: line.taxExemptionReason } : {}),
      };
    }),
    taxPayable: money(decimal(invoice.ivaAmount, invoice.iva)), netTotal: money(decimal(invoice.subtotalAmount, invoice.subtotal)), grossTotal: money(decimal(invoice.totalAmount, invoice.total)),
  }); });
}
