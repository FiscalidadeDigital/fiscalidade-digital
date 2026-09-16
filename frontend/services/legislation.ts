import api from './api';

export interface Legislation {
  id: string;

  title: string;

  taxType: string;

  category: string;

  description?: string | null;

  content?: string | null;

  lawNumber?: string | null;

  article?: string | null;

  source?: string | null;

  sourceUrl?: string | null;

  publicationDate?: string | null;

  effectiveDate?: string | null;

  active: boolean;

  createdAt: string;

  updatedAt: string;
}

// =====================================================
// LISTAR
// =====================================================

export async function getLegislation(): Promise<
  Legislation[]
> {
  const response = await api.get('/legislation');

  return response.data;
}

// =====================================================
// PESQUISAR
// =====================================================

export async function searchLegislation(
  search: string,
): Promise<Legislation[]> {
  const response = await api.get('/legislation', {
    params: {
      search: search.trim(),
    },
  });

  return response.data;
}

// =====================================================
// FILTRAR POR CATEGORIA
// =====================================================

export async function getLegislationByCategory(
  category: string,
): Promise<Legislation[]> {
  const response = await api.get('/legislation', {
    params: {
      category,
    },
  });

  return response.data;
}

// =====================================================
// FILTRAR POR TIPO DE IMPOSTO
// =====================================================

export async function getLegislationByTaxType(
  taxType: string,
): Promise<Legislation[]> {
  const response = await api.get('/legislation', {
    params: {
      taxType,
    },
  });

  return response.data;
}

// =====================================================
// BUSCAR POR ID
// =====================================================

export async function getLegislationById(
  id: string,
): Promise<Legislation> {
  const response = await api.get(
    `/legislation/${id}`,
  );

  return response.data;
}