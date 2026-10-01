import api from './api';

export type PurchaseInvoiceItemInput = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit?: 'UN' | 'SERVICO' | 'HORA' | 'KG' | 'L' | 'M';
};

export type CreatePurchaseInvoiceInput = {
  supplierId: string;
  invoiceNumber: string;
  issuedAt: string;
  dueDate?: string;
  currency?: string;
  reference?: string;
  originalDocumentId?: string;
  iva?: number;
  withholdingTax?: number;
  notes?: string;
  items: PurchaseInvoiceItemInput[];
};

export async function getPurchaseInvoices() {
  const response = await api.get('/purchase-invoice');
  return response.data;
}

export async function createPurchaseInvoice(
  data: CreatePurchaseInvoiceInput,
) {
  const response = await api.post('/purchase-invoice', data);
  return response.data;
}
