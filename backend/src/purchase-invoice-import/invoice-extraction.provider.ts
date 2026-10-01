export type InvoiceExtractionCandidate = {
  supplierName?: string | null;
  supplierNif?: string | null;
  invoiceNumber?: string | null;
  issuedAt?: string | null;
  dueDate?: string | null;
  currency?: string | null;
  items?: Array<{ description?: string | null; quantity?: string | null; unitPrice?: string | null }>;
  subtotal?: string | null;
  vatSupported?: string | null;
  total?: string | null;
  withholdingTax?: string | null;
  confidence?: number | null;
};

export interface InvoiceExtractionProvider {
  readonly name: string;
  readonly version?: string;
  extract(document: { id: string; originalName: string; mimeType: string; content: Buffer }): Promise<InvoiceExtractionCandidate | null>;
}

/**
 * Não usa OCR nem gera candidatos. Mantém o documento disponível para revisão
 * manual até existir um fornecedor de extracção real, configurado e auditável.
 */
export class ManualInvoiceExtractionProvider implements InvoiceExtractionProvider {
  readonly name = 'MANUAL';

  async extract(_document: { id: string; originalName: string; mimeType: string; content: Buffer }): Promise<null> {
    return null;
  }
}

/** Endpoint configurável: recebe fileName, mimeType e contentBase64 e devolve
 * campos candidatos. O resultado nunca confirma uma factura automaticamente. */
export class HttpInvoiceExtractionProvider implements InvoiceExtractionProvider {
  readonly name = process.env.INVOICE_OCR_PROVIDER?.trim() || 'HTTP_OCR';
  readonly version = process.env.INVOICE_OCR_PROVIDER_VERSION?.trim() || undefined;

  constructor(private readonly endpoint: string, private readonly apiKey?: string) {}

  static fromEnvironment(): HttpInvoiceExtractionProvider | null {
    const endpoint = process.env.INVOICE_OCR_ENDPOINT?.trim();
    if (!endpoint) return null;
    try {
      const url = new URL(endpoint);
      const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
      return url.protocol === 'https:' || localHttp
        ? new HttpInvoiceExtractionProvider(endpoint, process.env.INVOICE_OCR_API_KEY?.trim())
        : null;
    } catch { return null; }
  }

  async extract(document: { id: string; originalName: string; mimeType: string; content: Buffer }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
        body: JSON.stringify({ fileName: document.originalName, mimeType: document.mimeType, contentBase64: document.content.toString('base64') }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`OCR_PROVIDER_HTTP_${response.status}`);
      return sanitizeCandidate(await response.json());
    } finally { clearTimeout(timeout); }
  }
}

export function configuredInvoiceExtractionProvider(): InvoiceExtractionProvider {
  return HttpInvoiceExtractionProvider.fromEnvironment() ?? new ManualInvoiceExtractionProvider();
}

function sanitizeCandidate(value: unknown): InvoiceExtractionCandidate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const text = (name: string) => typeof input[name] === 'string' ? input[name].slice(0, 500) : null;
  const amount = (name: string) => { const item = text(name); return item && /^\d{1,15}(?:[.,]\d{1,4})?$/.test(item) ? item.replace(',', '.') : null; };
  const confidence = typeof input.confidence === 'number' && input.confidence >= 0 && input.confidence <= 1 ? input.confidence : null;
  const items = Array.isArray(input.items)
    ? input.items.slice(0, 100).flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const line = item as Record<string, unknown>;
      const field = (name: string) => typeof line[name] === 'string' ? line[name].slice(0, 500) : null;
      const numeric = (name: string) => { const entry = field(name); return entry && /^\d{1,15}(?:[.,]\d{1,4})?$/.test(entry) ? entry.replace(',', '.') : null; };
      return [{ description: field('description'), quantity: numeric('quantity'), unitPrice: numeric('unitPrice') }];
    })
    : [];
  return { supplierName: text('supplierName'), supplierNif: text('supplierNif'), invoiceNumber: text('invoiceNumber'), issuedAt: text('issuedAt'), dueDate: text('dueDate'), currency: text('currency'), items, subtotal: amount('subtotal'), vatSupported: amount('vatSupported'), withholdingTax: amount('withholdingTax'), total: amount('total'), confidence };
}
