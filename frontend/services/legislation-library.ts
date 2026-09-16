import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export async function getLegislationLibrary(): Promise<LibraryResponse> {
  const response = await api.get<LibraryResponse>(
    '/legislation/library',
  );

  return response.data;
}

export async function getLegislationLibraryDocuments(): Promise<
  LibraryDocument[]
> {
  const response = await api.get<LibraryDocument[]>(
    '/legislation/library/documents',
  );

  return response.data;
}

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