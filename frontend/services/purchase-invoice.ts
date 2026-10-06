import api from './api';

export type PurchaseInvoiceDocumentStatus = 'PENDING' | 'REVIEW_REQUIRED' | 'VALIDATED' | 'REJECTED' | 'CANCELLED';
export type PurchaseInvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PurchaseInvoicePaymentMethod = 'BANK_TRANSFER' | 'MULTICAIXA_TPA' | 'CASH' | 'OTHER';

export type PurchaseInvoiceItemInput = { productId?: string; productName: string; quantity: number; unitPrice: number; unit?: 'UN' | 'SERVICO' | 'HORA' | 'KG' | 'L' | 'M' };
export type CreatePurchaseInvoiceInput = { supplierId: string; invoiceNumber: string; issuedAt: string; dueDate?: string; currency?: string; reference?: string; originalDocumentId?: string; iva?: number; withholdingTax?: number; notes?: string; items: PurchaseInvoiceItemInput[] };

export type PurchaseInvoice = {
  id: string; supplierId: string; invoiceNumber: string; issuedAt: string; dueDate?: string | null; createdAt: string;
  currency: string; subtotal: number | string; iva: number | string; withholdingTax: number | string; total: number | string;
  paidAmount: string; balance: string; documentStatus: PurchaseInvoiceDocumentStatus; paymentStatus: PurchaseInvoicePaymentStatus;
  rejectionReason?: string | null; validatedAt?: string | null; rejectedAt?: string | null; origin: 'MANUAL' | 'OCR' | 'IMPORT';
  supplier: { id: string; name: string; nif?: string | null };
  createdBy?: { id: string; name: string } | null; validatedBy?: { id: string; name: string } | null; rejectedBy?: { id: string; name: string } | null;
  items: Array<{ id: string; productId?: string | null; productName: string; quantity: number | string; unitPrice: number | string; total: number | string; unit: string; product?: { id: string; name: string } | null }>;
  payments?: Array<{ id: string; amount: string; paymentDate: string; method: PurchaseInvoicePaymentMethod; reference?: string | null; notes?: string | null; createdAt: string; createdBy?: { id: string; name: string } | null }>;
};

export async function getPurchaseInvoices(): Promise<PurchaseInvoice[]> { return (await api.get('/purchase-invoice')).data; }
export async function getPurchaseInvoice(id: string): Promise<PurchaseInvoice> { return (await api.get(`/purchase-invoice/${id}`)).data; }
export async function createPurchaseInvoice(data: CreatePurchaseInvoiceInput) { return (await api.post('/purchase-invoice', data)).data; }
export async function updatePurchaseInvoice(id: string, data: Partial<CreatePurchaseInvoiceInput>) { return (await api.patch(`/purchase-invoice/${id}`, data)).data; }
export async function validatePurchaseInvoice(id: string): Promise<PurchaseInvoice> { return (await api.post(`/purchase-invoice/${id}/validate`)).data; }
export async function rejectPurchaseInvoice(id: string, reason: string): Promise<PurchaseInvoice> { return (await api.post(`/purchase-invoice/${id}/reject`, { reason })).data; }
export async function cancelPurchaseInvoice(id: string): Promise<PurchaseInvoice> { return (await api.post(`/purchase-invoice/${id}/cancel`)).data; }
export async function addPurchaseInvoicePayment(id: string, data: { amount: number; paymentDate: string; method: PurchaseInvoicePaymentMethod; reference?: string; notes?: string }): Promise<PurchaseInvoice> { return (await api.post(`/purchase-invoice/${id}/payments`, data)).data; }
