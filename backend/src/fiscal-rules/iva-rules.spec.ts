import {
  IVA_LEGAL_SOURCE,
  resolveInvoiceVatPolicy,
} from './iva-rules';

describe('resolveInvoiceVatPolicy', () => {
  it('does not liquidate IVA on a simplified-regime invoice', () => {
    expect(resolveInvoiceVatPolicy('SIMPLIFICADO')).toEqual(
      expect.objectContaining({
        invoiceRate: '0',
        settlementRate: '0.07',
        requiredInvoiceMention: 'IVA - Regime Simplificado',
      }),
    );
  });

  it('requires a line classification before the general rate can be used', () => {
    expect(resolveInvoiceVatPolicy('GERAL')).toEqual(
      expect.objectContaining({
        invoiceRate: '0.14',
        calculationStatus: 'STANDARD_RATE_CLASSIFIED',
        requiresLineClassification: true,
      }),
    );
    expect(IVA_LEGAL_SOURCE.officialUrl).toMatch(/^https:\/\/www\.ucm\.minfin\.gov\.ao\//);
  });
});
