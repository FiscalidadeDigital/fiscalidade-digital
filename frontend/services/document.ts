import api from './api';

export type DocumentCategory =
  | 'FACTURA'
  | 'RECIBO'
  | 'DECLARACAO'
  | 'PAGAMENTO'
  | 'CONTRATO'
  | 'EMPRESA'
  | 'COMPROVATIVO'
  | 'RELATORIO'
  | 'OUTROS';

export type DocumentInvoice = {
  id: string;
  invoiceNumber: string;
};

export type FiscalDocument = {
  id: string;
  tenantId: string;

  name: string;
  originalName: string;

  description?: string | null;

  category: DocumentCategory;

  mimeType: string;
  size: number;

  filePath: string;
  fileUrl?: string | null;

  invoiceId?: string | null;

  createdAt: string;
  updatedAt: string;

  invoice?: DocumentInvoice | null;
};

export type DocumentSummary = {
  total: number;
  totalSize: number;

  categories: {
    FACTURA: number;
    RECIBO: number;
    DECLARACAO: number;
    PAGAMENTO: number;
    CONTRATO: number;
    EMPRESA: number;
    COMPROVATIVO: number;
    RELATORIO: number;
    OUTROS: number;
  };
};

export type UploadDocumentData = {
  file: File;
  name?: string;
  description?: string;
  category?: DocumentCategory;
  invoiceId?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://fiscalidade-digital-api.onrender.com';

function buildFileUrl(
  fileUrl?: string | null,
): string | null {
  if (!fileUrl) {
    return null;
  }

  if (
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('https://')
  ) {
    return fileUrl;
  }

  return `${API_URL}${fileUrl}`;
}

function normalizeDocument(
  document: FiscalDocument,
): FiscalDocument {
  return {
    ...document,
    fileUrl: buildFileUrl(
      document.fileUrl,
    ),
  };
}

/**
 * Listar documentos
 */
export async function getDocuments(
  params?: {
    search?: string;
    category?: DocumentCategory;
    invoiceId?: string;
  },
): Promise<FiscalDocument[]> {
  const response =
    await api.get<FiscalDocument[]>(
      '/documents',
      {
        params: {
          search:
            params?.search || undefined,

          category:
            params?.category || undefined,

          invoiceId:
            params?.invoiceId || undefined,
        },
      },
    );

  return response.data.map(
    normalizeDocument,
  );
}

/**
 * Obter documento
 */
export async function getDocument(
  id: string,
): Promise<FiscalDocument> {
  const response =
    await api.get<FiscalDocument>(
      `/documents/${id}`,
    );

  return normalizeDocument(
    response.data,
  );
}

/**
 * Obter resumo
 */
export async function getDocumentSummary(): Promise<DocumentSummary> {
  const response =
    await api.get<DocumentSummary>(
      '/documents/summary',
    );

  return response.data;
}

/**
 * Upload de documento
 */
export async function uploadDocument(
  data: UploadDocumentData,
): Promise<FiscalDocument> {
  const formData =
    new FormData();

  formData.append(
    'file',
    data.file,
  );

  if (data.name?.trim()) {
    formData.append(
      'name',
      data.name.trim(),
    );
  }

  if (data.description?.trim()) {
    formData.append(
      'description',
      data.description.trim(),
    );
  }

  if (data.category) {
    formData.append(
      'category',
      data.category,
    );
  }

  if (data.invoiceId) {
    formData.append(
      'invoiceId',
      data.invoiceId,
    );
  }

  const response =
    await api.post<FiscalDocument>(
      '/documents',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      },
    );

  return normalizeDocument(
    response.data,
  );
}

/**
 * Eliminar documento
 */
export async function deleteDocument(
  id: string,
) {
  const response =
    await api.delete(
      `/documents/${id}`,
    );

  return response.data;
}

/**
 * Formatar tamanho
 */
export function formatDocumentSize(
  bytes: number,
): string {
  if (!bytes || bytes <= 0) {
    return '0 KB';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

/**
 * Obter URL pÃºblica do documento
 */
export function getDocumentUrl(
  document: FiscalDocument,
): string | null {
  return buildFileUrl(
    document.fileUrl,
  );
}
