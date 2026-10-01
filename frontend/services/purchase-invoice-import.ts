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
  candidateData: unknown | null;
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
