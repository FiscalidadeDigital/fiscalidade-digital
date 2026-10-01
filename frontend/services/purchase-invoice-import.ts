import api from './api';
import type { CreatePurchaseInvoiceInput } from './purchase-invoice';

export type PurchaseInvoiceImportStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'REVIEW_REQUIRED'
  | 'READY'
  | 'CONFIRMED'
  | 'FAILED';

export type PurchaseInvoiceImport = {
  id: string;
  status: PurchaseInvoiceImportStatus;
  extractionProvider: string;
  candidateData: {
    supplierName?: string | null;
    supplierNif?: string | null;
    invoiceNumber?: string | null;
    issuedAt?: string | null;
    dueDate?: string | null;
    currency?: string | null;
    items?: Array<{ description?: string | null; quantity?: string | null; unitPrice?: string | null; lineTotal?: string | null; productCode?: string | null }>;
    subtotal?: string | null;
    vatSupported?: string | null;
    withholdingTax?: string | null;
    total?: string | null;
    confidence?: number | null;
    reconciliation?: {
      status: 'MATCHED' | 'MISMATCH' | 'INCOMPLETE';
      lineTotal: string | null;
      documentSubtotal: string | null;
      vatSupported: string | null;
      documentTotal: string | null;
      difference: string | null;
      documentTotalDifference: string | null;
    };
  } | null;
  document: { id: string; originalName: string; mimeType: string; size: number };
  confirmedPurchaseInvoiceId: string | null;
  confirmedPurchaseInvoice?: { id: string; invoiceNumber: string } | null;
};

export async function createPurchaseInvoiceImport(documentId: string): Promise<PurchaseInvoiceImport> {
  const response = await api.post<PurchaseInvoiceImport>('/purchase-invoice-imports', { documentId });
  return response.data;
}

export async function confirmPurchaseInvoiceImport(
  id: string,
  data: CreatePurchaseInvoiceInput,
) {
  const response = await api.post(`/purchase-invoice-imports/${id}/confirm`, data);
  return response.data;
}
