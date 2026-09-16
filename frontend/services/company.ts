import api from './api';

import type { Tenant } from './auth';

// =====================================================
// OBTER EMPRESA AUTENTICADA
// =====================================================

export async function getCompany(): Promise<Tenant> {
  const response =
    await api.get<Tenant>('/company');

  return response.data;
}

// =====================================================
// ATUALIZAR EMPRESA
// =====================================================

export async function updateCompany(
  data: Partial<Tenant>,
): Promise<Tenant> {
  const response =
    await api.patch<Tenant>(
      '/company',
      data,
    );

  return response.data;
}