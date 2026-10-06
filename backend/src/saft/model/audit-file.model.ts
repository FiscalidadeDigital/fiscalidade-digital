export const SAFT_NAMESPACE = 'urn:OECD:StandardAuditFile-Tax:AO_1.01_01';
export const SAFT_SCHEMA_VERSION = '1.01_01';

export type SaftTax = {
  taxType: string;
  taxCode: string;
  taxPercentage: string;
};

export type SaftLine = {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  taxPointDate: string;
  description: string;
  creditAmount: string;
  tax: SaftTax;
  taxExemptionReason?: string;
  taxExemptionCode?: string;
};

export type SaftInvoice = {
  invoiceNo: string;
  status: 'N' | 'A';
  statusDate: string;
  reason?: string;
  hash: string;
  hashControl: string;
  invoiceDate: string;
  invoiceType: string;
  sourceId: string;
  systemEntryDate: string;
  customerId: string;
  lines: SaftLine[];
  taxPayable: string;
  netTotal: string;
  grossTotal: string;
};

export type SaftAuditFile = {
  header: Record<string, unknown>;
  customers: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  taxes: Array<Record<string, string>>;
  invoices: SaftInvoice[];
  totalDebit: string;
  totalCredit: string;
};
