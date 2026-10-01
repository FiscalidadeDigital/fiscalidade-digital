export type InvoiceExtractionCandidate = {
  supplierName?: string | null;
  supplierNif?: string | null;
  invoiceNumber?: string | null;
  issuedAt?: string | null;
  dueDate?: string | null;
  currency?: string | null;
  items?: unknown[];
  subtotal?: string | null;
  vatSupported?: string | null;
  total?: string | null;
};

export interface InvoiceExtractionProvider {
  readonly name: string;
  readonly version?: string;
  extract(documentId: string): Promise<InvoiceExtractionCandidate | null>;
}

/**
 * Não usa OCR nem gera candidatos. Mantém o documento disponível para revisão
 * manual até existir um fornecedor de extracção real, configurado e auditável.
 */
export class ManualInvoiceExtractionProvider implements InvoiceExtractionProvider {
  readonly name = 'MANUAL';

  async extract(_documentId: string): Promise<null> {
    return null;
  }
}
