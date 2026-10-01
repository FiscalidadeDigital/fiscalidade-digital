export type InvoiceExtractionCandidate = {
  supplierName?: string | null;
  supplierNif?: string | null;
  invoiceNumber?: string | null;
  issuedAt?: string | null;
  dueDate?: string | null;
  currency?: string | null;
  items?: Array<{ description?: string | null; quantity?: string | null; unitPrice?: string | null; lineTotal?: string | null; productCode?: string | null }>;
  subtotal?: string | null;
  vatSupported?: string | null;
  total?: string | null;
  withholdingTax?: string | null;
  confidence?: number | null;
  fieldConfidence?: Record<string, number>;
  provenance?: { provider: string; model: string; apiVersion: string; extractedAt: string };
};

export interface InvoiceExtractionProvider {
  readonly name: string;
  readonly version?: string;
  extract(document: { id: string; originalName: string; mimeType: string; content: Buffer }): Promise<InvoiceExtractionCandidate | null>;
}

export class ManualInvoiceExtractionProvider implements InvoiceExtractionProvider {
  readonly name = 'MANUAL';

  async extract(_document: { id: string; originalName: string; mimeType: string; content: Buffer }): Promise<null> {
    return null;
  }
}

/** Compatibility adapter for the existing generic OCR endpoint. */
export class HttpInvoiceExtractionProvider implements InvoiceExtractionProvider {
  readonly name = process.env.INVOICE_OCR_PROVIDER?.trim() || 'HTTP_OCR';
  readonly version = process.env.INVOICE_OCR_PROVIDER_VERSION?.trim() || undefined;

  constructor(private readonly endpoint: string, private readonly apiKey?: string) {}

  static fromEnvironment(): HttpInvoiceExtractionProvider | null {
    const endpoint = process.env.INVOICE_OCR_ENDPOINT?.trim();
    return endpoint && isSecureEndpoint(endpoint)
      ? new HttpInvoiceExtractionProvider(endpoint, process.env.INVOICE_OCR_API_KEY?.trim())
      : null;
  }

  async extract(document: { id: string; originalName: string; mimeType: string; content: Buffer }) {
    const response = await requestWithTimeout(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}) },
      body: JSON.stringify({ fileName: document.originalName, mimeType: document.mimeType, contentBase64: document.content.toString('base64') }),
    });
    if (!response.ok) throw new InvoiceExtractionError(`OCR_PROVIDER_HTTP_${response.status}`);
    return sanitizeCandidate(await response.json());
  }
}

/** Azure AI Document Intelligence v4.0 REST API (2024-11-30 GA). */
export class AzureDocumentIntelligenceProvider implements InvoiceExtractionProvider {
  readonly name = 'azure-document-intelligence';

  constructor(
    private readonly endpoint: string,
    private readonly key: string,
    private readonly model = 'prebuilt-invoice',
    readonly version = '2024-11-30',
    private readonly pollIntervalMs = 750,
    private readonly maxPolls = 20,
  ) {}

  static fromEnvironment(): AzureDocumentIntelligenceProvider | null {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim();
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim();
    if (!endpoint || !key || !isSecureEndpoint(endpoint)) return null;
    return new AzureDocumentIntelligenceProvider(
      endpoint,
      key,
      process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL?.trim() || 'prebuilt-invoice',
      process.env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION?.trim() || '2024-11-30',
    );
  }

  async extract(document: { id: string; originalName: string; mimeType: string; content: Buffer }) {
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(document.mimeType)) return null;
    const analyzeUrl = `${this.endpoint.replace(/\/$/, '')}/documentintelligence/documentModels/${encodeURIComponent(this.model)}:analyze?api-version=${encodeURIComponent(this.version)}`;
    const response = await requestWithTimeout(analyzeUrl, {
      method: 'POST',
      headers: { 'content-type': document.mimeType, 'ocp-apim-subscription-key': this.key },
      body: document.content as unknown as BodyInit,
    });
    if (response.status !== 202) throw new InvoiceExtractionError(`AZURE_DOCUMENT_INTELLIGENCE_HTTP_${response.status}`);
    const operationLocation = response.headers.get('operation-location');
    if (!operationLocation || !isOperationLocationForEndpoint(operationLocation, this.endpoint)) {
      throw new InvoiceExtractionError('AZURE_DOCUMENT_INTELLIGENCE_INVALID_OPERATION');
    }

    for (let attempt = 0; attempt < this.maxPolls; attempt += 1) {
      await delay(this.pollIntervalMs);
      const status = await requestWithTimeout(operationLocation, {
        headers: { 'ocp-apim-subscription-key': this.key },
      });
      if (!status.ok) throw new InvoiceExtractionError(`AZURE_DOCUMENT_INTELLIGENCE_POLL_HTTP_${status.status}`);
      const result = await status.json() as AzureAnalyzeResponse;
      if (result.status === 'succeeded') return mapAzureInvoice(result, this.model, this.version);
      if (result.status === 'failed') throw new InvoiceExtractionError('AZURE_DOCUMENT_INTELLIGENCE_ANALYSIS_FAILED');
    }
    throw new InvoiceExtractionError('AZURE_DOCUMENT_INTELLIGENCE_TIMEOUT');
  }
}

/** Veryfi Receipts & Invoices v8 document processing. */
export class VeryfiInvoiceExtractionProvider implements InvoiceExtractionProvider {
  readonly name = 'veryfi';
  readonly version = 'v8';
  private static readonly endpoint = 'https://api.veryfi.com/api/v8/partner/documents';

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly username: string,
    private readonly apiKey: string,
  ) {}

  static fromEnvironment(): VeryfiInvoiceExtractionProvider | null {
    const clientId = process.env.VERYFI_CLIENT_ID?.trim();
    const clientSecret = process.env.VERYFI_CLIENT_SECRET?.trim();
    const username = process.env.VERYFI_USERNAME?.trim();
    const apiKey = process.env.VERYFI_API_KEY?.trim();
    return clientId && clientSecret && username && apiKey
      ? new VeryfiInvoiceExtractionProvider(clientId, clientSecret, username, apiKey)
      : null;
  }

  async extract(document: { id: string; originalName: string; mimeType: string; content: Buffer }) {
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(document.mimeType)) return null;
    const response = await requestWithTimeout(VeryfiInvoiceExtractionProvider.endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'client-id': this.clientId,
        authorization: `apikey ${this.username}:${this.apiKey}`,
      },
      // Veryfi v8 accepts a base64 document payload. The private source bytes
      // are never exposed to the browser or converted into a public URL.
      body: JSON.stringify({ file_data: document.content.toString('base64'), file_name: document.originalName }),
    });
    // clientSecret is required for the configured credential set, but v8
    // processing authentication uses CLIENT-ID plus apikey USERNAME:API_KEY.
    void this.clientSecret;
    if (!response.ok) throw new InvoiceExtractionError(`VERYFI_HTTP_${response.status}`);
    return mapVeryfiInvoice(await response.json());
  }
}

export function configuredInvoiceExtractionProvider(): InvoiceExtractionProvider {
  return VeryfiInvoiceExtractionProvider.fromEnvironment()
    ?? AzureDocumentIntelligenceProvider.fromEnvironment()
    ?? HttpInvoiceExtractionProvider.fromEnvironment()
    ?? new ManualInvoiceExtractionProvider();
}

export class InvoiceExtractionError extends Error {}

type AzureField = { content?: string; confidence?: number; valueCurrency?: { amount?: number; currencyCode?: string }; valueNumber?: number; valueDate?: string; valueArray?: Array<{ valueObject?: Record<string, AzureField> }> };
type AzureAnalyzeResponse = { status?: string; analyzeResult?: { documents?: Array<{ fields?: Record<string, AzureField> }> } };
type VeryfiResponse = {
  invoice_number?: unknown; date?: unknown; due_date?: unknown; subtotal?: unknown; tax?: unknown; total?: unknown; currency_code?: unknown;
  vat_number?: unknown; vendor?: { name?: unknown; vat_number?: unknown; reg_number?: unknown };
  line_items?: Array<{ description?: unknown; quantity?: unknown; price?: unknown; unit_price?: unknown; total?: unknown; sku?: unknown }>;
};

function mapAzureInvoice(response: AzureAnalyzeResponse, model: string, apiVersion: string): InvoiceExtractionCandidate | null {
  const fields = response.analyzeResult?.documents?.[0]?.fields;
  if (!fields) return null;
  const confidence: Record<string, number> = {};
  const get = (name: string) => {
    const field = fields[name];
    if (typeof field?.confidence === 'number') confidence[name] = field.confidence;
    return field;
  };
  const text = (name: string) => boundedText(get(name)?.content);
  const amount = (name: string) => azureAmount(get(name));
  const items = get('Items')?.valueArray?.slice(0, 100).flatMap((entry) => {
    const line = entry.valueObject;
    if (!line) return [];
    const lineText = (name: string) => boundedText(line[name]?.content);
    const lineNumber = (name: string) => azureAmount(line[name]) ?? numberString(line[name]?.valueNumber);
    return [{ description: lineText('Description'), quantity: lineNumber('Quantity'), unitPrice: lineNumber('UnitPrice'), lineTotal: azureAmount(line.Amount), productCode: lineText('ProductCode') }];
  }) ?? [];
  const currency = get('InvoiceTotal')?.valueCurrency?.currencyCode ?? get('SubTotal')?.valueCurrency?.currencyCode ?? null;
  return {
    supplierName: text('VendorName'), supplierNif: text('VendorTaxId'), invoiceNumber: text('InvoiceId'),
    issuedAt: get('InvoiceDate')?.valueDate ?? text('InvoiceDate'), dueDate: get('DueDate')?.valueDate ?? text('DueDate'),
    currency, subtotal: amount('SubTotal'), vatSupported: amount('TotalTax'), total: amount('InvoiceTotal'), items,
    confidence: averageConfidence(confidence), fieldConfidence: confidence,
    provenance: { provider: 'azure-document-intelligence', model, apiVersion, extractedAt: new Date().toISOString() },
  };
}

function mapVeryfiInvoice(value: unknown): InvoiceExtractionCandidate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const invoice = value as VeryfiResponse;
  const text = (item: unknown) => typeof item === 'string' ? item.slice(0, 500) : null;
  const amount = (item: unknown) => typeof item === 'number' ? numberString(item) : normalizeAmount(text(item));
  const vendor = invoice.vendor && typeof invoice.vendor === 'object' ? invoice.vendor : {};
  const items = Array.isArray(invoice.line_items) ? invoice.line_items.slice(0, 100).map((line) => ({
    description: text(line.description), quantity: amount(line.quantity), unitPrice: amount(line.unit_price) ?? amount(line.price),
    lineTotal: amount(line.total), productCode: text(line.sku),
  })) : [];
  const hasData = Boolean(text(invoice.invoice_number) || text(vendor.name) || amount(invoice.total) || items.length);
  if (!hasData) return null;
  return {
    invoiceNumber: text(invoice.invoice_number), issuedAt: text(invoice.date), dueDate: text(invoice.due_date),
    supplierName: text(vendor.name), supplierNif: text(vendor.vat_number) ?? text(invoice.vat_number) ?? text(vendor.reg_number),
    subtotal: amount(invoice.subtotal), vatSupported: amount(invoice.tax), total: amount(invoice.total), currency: text(invoice.currency_code), items,
    provenance: { provider: 'veryfi', model: 'receipts-invoices', apiVersion: 'v8', extractedAt: new Date().toISOString() },
  };
}

function sanitizeCandidate(value: unknown): InvoiceExtractionCandidate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const text = (name: string) => typeof input[name] === 'string' ? input[name].slice(0, 500) : null;
  const amount = (name: string) => normalizeAmount(text(name));
  const confidence = typeof input.confidence === 'number' && input.confidence >= 0 && input.confidence <= 1 ? input.confidence : null;
  const items = Array.isArray(input.items) ? input.items.slice(0, 100).flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const line = entry as Record<string, unknown>;
    const lineText = (name: string) => typeof line[name] === 'string' ? line[name].slice(0, 500) : null;
    return [{ description: lineText('description'), quantity: normalizeAmount(lineText('quantity')), unitPrice: normalizeAmount(lineText('unitPrice')), lineTotal: normalizeAmount(lineText('lineTotal')), productCode: lineText('productCode') }];
  }) : [];
  return { supplierName: text('supplierName'), supplierNif: text('supplierNif'), invoiceNumber: text('invoiceNumber'), issuedAt: text('issuedAt'), dueDate: text('dueDate'), currency: text('currency'), items, subtotal: amount('subtotal'), vatSupported: amount('vatSupported'), withholdingTax: amount('withholdingTax'), total: amount('total'), confidence };
}

function azureAmount(field?: AzureField) { return normalizeAmount(field?.content) ?? numberString(field?.valueCurrency?.amount) ?? numberString(field?.valueNumber); }
function numberString(value?: number) { return typeof value === 'number' && Number.isFinite(value) ? value.toString() : null; }
function boundedText(value?: string) { return typeof value === 'string' ? value.slice(0, 500) : null; }
function normalizeAmount(value?: string | null) { return value && /^\d{1,15}(?:[.,]\d{1,4})?$/.test(value.trim()) ? value.trim().replace(',', '.') : null; }
function averageConfidence(values: Record<string, number>) { const numbers = Object.values(values).filter((item) => item >= 0 && item <= 1); return numbers.length ? numbers.reduce((sum, item) => sum + item, 0) / numbers.length : null; }
function isSecureEndpoint(value: string) { try { const url = new URL(value); return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname)); } catch { return false; } }
function isOperationLocationForEndpoint(value: string, endpoint: string) { try { return new URL(value).host === new URL(endpoint).host; } catch { return false; } }
async function requestWithTimeout(url: string, init: RequestInit) { const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 30_000); try { return await fetch(url, { ...init, signal: controller.signal }); } catch (error) { if ((error as { name?: string })?.name === 'AbortError') throw new InvoiceExtractionError('OCR_PROVIDER_TIMEOUT'); throw error; } finally { clearTimeout(timer); } }
function delay(ms: number) { return new Promise<void>((resolve) => setTimeout(resolve, ms)); }
