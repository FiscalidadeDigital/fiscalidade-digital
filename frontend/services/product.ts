import { isAxiosError } from 'axios';

import api from './api';

export type ProductUnit = 'UN' | 'SERVICO' | 'HORA' | 'KG' | 'L' | 'M';
export type ElectronicOperationType = 'SE' | 'SS' | 'STP' | 'SR' | 'SIF' | 'SHS' | 'ST' | 'SG' | 'TB' | 'AS' | 'QT' | 'RD';

export type Product = {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  price: number;
  ivaRate: number;
  stock: number | null;
  unit: ProductUnit;
  electronicOperationType: ElectronicOperationType | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
  description?: string;
  code?: string;
  price: number;
  ivaRate?: number;
  stock?: number | null;
  unit?: ProductUnit;
  electronicOperationType?: ElectronicOperationType;
  isActive?: boolean;
};

export type ProductPage = {
  data: Product[];
  summary: { total: number; active: number; inactive: number };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export async function getProducts(query: {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | '';
  page: number;
  pageSize?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortDirection?: 'asc' | 'desc';
}): Promise<ProductPage> {
  const response = await api.get<ProductPage>('/products', {
    params: Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== '' && value !== undefined),
    ),
  });
  return response.data;
}

export async function createProduct(data: ProductInput): Promise<Product> {
  const response = await api.post<Product>('/products', data);
  return response.data;
}

export async function updateProduct(id: string, data: ProductInput): Promise<Product> {
  const response = await api.patch<Product>(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id: string): Promise<Product> {
  const response = await api.delete<Product>(`/products/${id}`);
  return response.data;
}

export function getProductApiError(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string | string[] }>(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message || fallback;
}
