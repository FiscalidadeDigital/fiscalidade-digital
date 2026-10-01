import {
  HttpInvoiceExtractionProvider,
  ManualInvoiceExtractionProvider,
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

  it('accepts only a bounded candidate from a configured HTTP provider', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invoiceNumber: 'FT-2026-001', vatSupported: '140,01', total: '1140.01', confidence: 0.91, ignored: 'value' }),
    });
    const previousFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      const candidate = await new HttpInvoiceExtractionProvider('https://ocr.example.test/extract').extract({
        id: 'document-1', originalName: 'supplier.pdf', mimeType: 'application/pdf', content: Buffer.from('private document'),
      });

      expect(candidate).toEqual(expect.objectContaining({ invoiceNumber: 'FT-2026-001', vatSupported: '140.01', total: '1140.01', confidence: 0.91 }));
      expect(fetchMock).toHaveBeenCalledWith('https://ocr.example.test/extract', expect.objectContaining({ method: 'POST' }));
    } finally {
      global.fetch = previousFetch;
    }
  });
});
