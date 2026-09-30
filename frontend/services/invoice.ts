import { isAxiosError } from 'axios';

import api from './api';
import type { ProductUnit } from './product';

export type InvoiceItemInput = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unit?: ProductUnit;
};

export type CreateInvoiceInput = {
  clientId: string;
  notes?: string;
  items: InvoiceItemInput[];
};

export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export type Invoice = {
  id: string;
  tenantId: string;
  clientId: string;
  invoiceNumber: string;
  subtotal: number;
  subtotalAmount?: string | null;
  iva: number;
  ivaAmount?: string | null;
  withholdingTax: number;
  withholdingTaxAmount?: string | null;
  total: number;
  totalAmount?: string | null;
  taxRuleVersion?: string | null;
  taxCalculationStatus?: string;
  status: InvoiceStatus;
  notes: string | null;
  createdAt: string;
  dueDate: string | null;
  issuedAt: string;
  client: {
    id: string;
    name: string;
    nif: string | null;
    email: string | null;
    phone: string | null;
  };
  items: Array<{
    id: string;
    productId: string | null;
    productName: string;
    quantity: number;
    quantityAmount?: string | null;
    unitPrice: number;
    unitPriceAmount?: string | null;
    total: number;
    totalAmount?: string | null;
    unit: ProductUnit;
  }>;
};

export type InvoiceDashboardStats = {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  cancelledInvoices: number;
  revenueReceived: number;
  revenueReceivedAmount?: string;
  revenuePending: number;
  revenuePendingAmount?: string;
  totalInvoiced: number;
  totalInvoicedAmount?: string;
};

export type InvoicePage = {
  data: Invoice[];
  summary: {
    total: number;
    pending: number;
    paid: number;
    cancelled: number;
    totalInvoiced: number;
    totalInvoicedAmount?: string;
    ivaInvoiced: number;
    ivaInvoicedAmount?: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  const response = await api.post<Invoice>('/invoice', data);
  return response.data;
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await api.get<Invoice[]>('/invoice');
  return response.data;
}

export async function getInvoicePage(query: {
  search?: string;
  status?: InvoiceStatus | '';
  page: number;
  pageSize?: number;
  sortBy?: 'issuedAt' | 'invoiceNumber' | 'total';
  sortDirection?: 'asc' | 'desc';
}): Promise<InvoicePage> {
  const response = await api.get<InvoicePage>('/invoice', {
    params: Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== '' && value !== undefined),
    ),
  });
  return response.data;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const response = await api.get<Invoice>(`/invoice/${id}`);
  return response.data;
}

export async function markInvoicePaid(id: string): Promise<Invoice> {
  const response = await api.patch<Invoice>(`/invoice/${id}/pay`);
  return response.data;
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const response = await api.patch<Invoice>(`/invoice/${id}/cancel`);
  return response.data;
}

export async function getInvoiceDashboardStats(): Promise<InvoiceDashboardStats> {
  const response = await api.get<InvoiceDashboardStats>('/invoice/dashboard/stats');
  return response.data;
}

export async function openInvoicePdf(id: string) {
  const newWindow = window.open('', '_blank');
  if (!newWindow) throw new Error('O navegador bloqueou a abertura do PDF.');

  try {
    const response = await api.get(`/invoice/${id}/pdf`, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(
      new Blob([response.data], { type: 'application/pdf' }),
    );
    newWindow.location.href = blobUrl;
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (error) {
    newWindow.close();
    throw error;
  }
}

export function getInvoiceApiError(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string | string[] }>(error)) {
    return error instanceof Error ? error.message : fallback;
  }
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message || fallback;
}
