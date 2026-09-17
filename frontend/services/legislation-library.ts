
import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://fiscalidade-digital-api.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =====================================================
// INTERFACES
// =====================================================

export interface LibraryArticle {
  article: string;
  text: string;
  title?: string;
  content?: string;
}

export interface LibraryDocument {
  sourceCategory: string;
  sourceFile: string;
  titleDetected: string;
  pageCount: number;
  articlesDetected: number;
  description?: string;
  lawNumber?: string;
  articles?: LibraryArticle[];
  fullText?: string;
}

export interface LibraryResponse {
  version: string;
  name: string;
  sourceDocuments: number;
  documents: LibraryDocument[];
}

// =====================================================
// BIBLIOTECA COMPLETA
// =====================================================

export async function getLegislationLibrary(): Promise<LibraryResponse> {
  const response = await api.get<LibraryResponse>(
    '/legislation/library',
  );

  return response.data;
}

// =====================================================
// LISTAR DOCUMENTOS
// Usa a rota /legislation/library que está disponível
// no backend publicado.
// =====================================================

export async function getLegislationLibraryDocuments(): Promise<
  LibraryDocument[]
> {
  const response = await api.get<LibraryResponse>(
    '/legislation/library',
  );

  return response.data.documents || [];
}

// =====================================================
// PESQUISAR NA BIBLIOTECA
// =====================================================

export async function searchLegislationLibrary(
  query: string,
): Promise<LibraryDocument[]> {
  const response = await api.get<LibraryDocument[]>(
    '/legislation/library/search',
    {
      params: {
        q: query,
      },
    },
  );

  return response.data;
}

// =====================================================
// ABRIR DOCUMENTO
// =====================================================

export async function getLegislationLibraryDocument(
  sourceFile: string,
): Promise<LibraryDocument> {
  const response = await api.get<LibraryDocument>(
    `/legislation/library/document/${encodeURIComponent(
      sourceFile,
    )}`,
  );

  return response.data;
}