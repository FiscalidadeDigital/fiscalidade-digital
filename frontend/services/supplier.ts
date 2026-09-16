import api from './api';

export type Supplier = {
  id: string;
  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSupplierData = {
  name: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
};

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await api.get('/suppliers');

  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

export async function getSupplier(
  id: string,
): Promise<Supplier> {
  const response = await api.get(
    `/suppliers/${id}`,
  );

  return response.data;
}

export async function createSupplier(
  data: CreateSupplierData,
) {
  const response = await api.post(
    '/suppliers',
    data,
  );

  return response.data;
}

export async function updateSupplier(
  id: string,
  data: CreateSupplierData,
) {
  const response = await api.patch(
    `/suppliers/${id}`,
    data,
  );

  return response.data;
}

export async function deleteSupplier(
  id: string,
) {
  const response = await api.delete(
    `/suppliers/${id}`,
  );

  return response.data;
}