import {
  AzureDocumentIntelligenceProvider,
  HttpInvoiceExtractionProvider,
  InvoiceExtractionError,
  ManualInvoiceExtractionProvider,
  VeryfiInvoiceExtractionProvider,
} from './invoice-extraction.provider';

describe('invoice extraction providers', () => {
  it('keeps the manual provider as a safe no-op fallback', async () => {
    const provider = new ManualInvoiceExtractionProvider();

    await expect(provider.extract({
      id: 'document-1',
      originalName: 'supplier.pdf',
      mimeType: 'application/pdf',
      content: Buffer.from('private document'),
    })).resolves.toBeNull();
  });

  it('polls Azure Document Intelligence and maps a prebuilt invoice candidate', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({ status: 202, headers: new Headers({ 'operation-location': 'https://tenant.cognitiveservices.azure.com/operations/abc' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'succeeded', analyzeResult: { documents: [{ fields: {
        InvoiceId: { content: 'FT-001', confidence: 0.98 }, InvoiceDate: { valueDate: '2026-10-01', confidence: 0.96 },
        VendorName: { content: 'Fornecedor A', confidence: 0.9 }, VendorTaxId: { content: '5000000000', confidence: 0.85 },
        TotalTax: { valueCurrency: { amount: 140.01, currencyCode: 'AOA' }, confidence: 0.91 },
        InvoiceTotal: { valueCurrency: { amount: 1140.01, currencyCode: 'AOA' }, confidence: 0.95 },
        Items: { valueArray: [{ valueObject: { Description: { content: 'Serviço' }, Quantity: { valueNumber: 2 }, UnitPrice: { valueNumber: 500 } } }] },
      } }] } }) });
    const previousFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const candidate = await new AzureDocumentIntelligenceProvider('https://tenant.cognitiveservices.azure.com', 'test-key', 'prebuilt-invoice', '2024-11-30', 0, 1).extract({ id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document') });
      expect(candidate).toEqual(expect.objectContaining({ invoiceNumber: 'FT-001', issuedAt: '2026-10-01', supplierName: 'Fornecedor A', supplierNif: '5000000000', vatSupported: '140.01', total: '1140.01', currency: 'AOA' }));
      expect(candidate?.items).toEqual([expect.objectContaining({ description: 'Serviço', quantity: '2', unitPrice: '500' })]);
      expect(candidate?.provenance).toEqual(expect.objectContaining({ provider: 'azure-document-intelligence', model: 'prebuilt-invoice', apiVersion: '2024-11-30' }));
      expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ headers: expect.objectContaining({ 'ocp-apim-subscription-key': 'test-key' }) }));
    } finally { global.fetch = previousFetch; }
  });

  it.each([401, 429, 500])('surfaces Azure %i without creating data', async (status) => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ status, headers: new Headers() }) as unknown as typeof fetch;
    try {
      await expect(new AzureDocumentIntelligenceProvider('https://tenant.cognitiveservices.azure.com', 'test-key').extract({ id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document') })).rejects.toEqual(expect.objectContaining<Partial<InvoiceExtractionError>>({ message: `AZURE_DOCUMENT_INTELLIGENCE_HTTP_${status}` }));
    } finally { global.fetch = previousFetch; }
  });

  it('rejects malformed Azure operations and bounded polling timeouts', async () => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ status: 202, headers: new Headers() }) as unknown as typeof fetch;
    try {
      await expect(new AzureDocumentIntelligenceProvider('https://tenant.cognitiveservices.azure.com', 'test-key').extract({ id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document') })).rejects.toEqual(expect.objectContaining({ message: 'AZURE_DOCUMENT_INTELLIGENCE_INVALID_OPERATION' }));
    } finally { global.fetch = previousFetch; }
  });

  it('stops polling after the configured bound', async () => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ status: 202, headers: new Headers({ 'operation-location': 'https://tenant.cognitiveservices.azure.com/operations/abc' }) }) as unknown as typeof fetch;
    try {
      await expect(new AzureDocumentIntelligenceProvider('https://tenant.cognitiveservices.azure.com', 'test-key', 'prebuilt-invoice', '2024-11-30', 0, 0).extract({ id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document') })).rejects.toEqual(expect.objectContaining({ message: 'AZURE_DOCUMENT_INTELLIGENCE_TIMEOUT' }));
    } finally { global.fetch = previousFetch; }
  });

  it('maps the Veryfi v8 invoice response without making it authoritative', async () => {
    const previousFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
      invoice_number: 'VFY-001', date: '2026-10-01', due_date: '2026-10-31', currency_code: 'AOA', subtotal: 1000.05, tax: 140.01, total: 1140.06,
      vendor: { name: 'Fornecedor Veryfi', vat_number: '5000000000' },
      line_items: [{ description: 'Serviço', quantity: 2, price: 500.025, total: 1000.05, sku: 'SERV-1' }],
    }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const candidate = await new VeryfiInvoiceExtractionProvider('client-id', 'client-secret', 'username', 'api-key').extract({ id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document') });
      expect(candidate).toEqual(expect.objectContaining({ invoiceNumber: 'VFY-001', issuedAt: '2026-10-01', dueDate: '2026-10-31', supplierName: 'Fornecedor Veryfi', supplierNif: '5000000000', subtotal: '1000.05', vatSupported: '140.01', total: '1140.06', currency: 'AOA' }));
      expect(candidate?.items).toEqual([expect.objectContaining({ description: 'Serviço', quantity: '2', unitPrice: '500.025', lineTotal: '1000.05', productCode: 'SERV-1' })]);
      expect(candidate?.provenance).toEqual(expect.objectContaining({ provider: 'veryfi', apiVersion: 'v8' }));
      expect(fetchMock).toHaveBeenCalledWith('https://api.veryfi.com/api/v8/partner/documents', expect.objectContaining({ headers: expect.objectContaining({ 'client-id': 'client-id', authorization: 'apikey username:api-key' }) }));
    } finally { global.fetch = previousFetch; }
  });

  it.each([401, 429])('handles Veryfi HTTP %i without creating a purchase invoice', async (status) => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status }) as unknown as typeof fetch;
    try {
      await expect(new VeryfiInvoiceExtractionProvider('client-id', 'client-secret', 'username', 'api-key').extract({ id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document') })).rejects.toEqual(expect.objectContaining({ message: `VERYFI_HTTP_${status}` }));
    } finally { global.fetch = previousFetch; }
  });

  it('rejects malformed and timed out Veryfi responses safely', async () => {
    const previousFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ unexpected: true }) }).mockRejectedValueOnce(Object.assign(new Error('aborted'), { name: 'AbortError' })) as unknown as typeof fetch;
    try {
      const provider = new VeryfiInvoiceExtractionProvider('client-id', 'client-secret', 'username', 'api-key');
      await expect(provider.extract({ id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document') })).resolves.toBeNull();
      await expect(provider.extract({ id: 'document-2', originalName: 'supplier.png', mimeType: 'image/png', content: Buffer.from('private document') })).rejects.toEqual(expect.objectContaining({ message: 'OCR_PROVIDER_TIMEOUT' }));
    } finally { global.fetch = previousFetch; }
  });

  it('accepts only a bounded candidate from a configured HTTP provider', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoiceNumber: 'FT-2026-001', vatSupported: '140,01', total: '1140.01', confidence: 0.91, items: [{ description: 'Linha', quantity: '2', unitPrice: '500,00' }], ignored: 'value' }),
    });
    const previousFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const candidate = await new HttpInvoiceExtractionProvider('https://ocr.example.test/extract').extract({
        id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document'),
      });

      expect(candidate).toEqual(expect.objectContaining({ invoiceNumber: 'FT-2026-001', vatSupported: '140.01', total: '1140.01', confidence: 0.91 }));
      expect(candidate?.items).toEqual([expect.objectContaining({ description: 'Linha', quantity: '2', unitPrice: '500.00' })]);
      expect(fetchMock).toHaveBeenCalledWith('https://ocr.example.test/extract', expect.objectContaining({ method: 'POST' }));
    } finally {
      global.fetch = previousFetch;
    }
  });
});
