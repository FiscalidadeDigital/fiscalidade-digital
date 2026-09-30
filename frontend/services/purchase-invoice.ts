import api from './api';

export type PurchaseInvoiceItemInput = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type CreatePurchaseInvoiceInput = {
  supplierId: string;
  invoiceNumber: string;
  issuedAt: string;
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
