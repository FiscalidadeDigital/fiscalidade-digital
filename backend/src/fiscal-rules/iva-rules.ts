export const IVA_LEGAL_SOURCE = {
  title: 'Lei n.º 14/23, de 28 de Dezembro — Código do IVA republicado',
  officialUrl:
    'https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4z/nzu5/~edisp/minfin3759673.pdf',
  publishedAt: '2023-12-28',
  effectiveFrom: '2023-12-28',
  consultedAt: '2026-09-30',
} as const;

export const IVA_RATES_FROM_2023_12_28 = {
  general: '0.14',
  simplifiedSettlement: '0.07',
  hospitalityConditional: '0.07',
  essentialGoods: '0.05',
  cabindaSpecial: '0.01',
} as const;

export const SIMPLIFIED_IVA_INVOICE_MENTION = 'IVA - Regime Simplificado';

export type InvoiceVatPolicy = {
  invoiceRate: string;
  settlementRate: string | null;
  ruleVersion: string;
  calculationStatus:
    | 'PAYMENT_BASIS_NOT_INVOICE_LIQUIDATION'
    | 'STANDARD_RATE_ASSUMED_PENDING_ITEM_CLASSIFICATION';
  requiredInvoiceMention: string | null;
};

/**
 * A política só decide o tratamento suportado pelo modelo actual.
 * As taxas reduzidas, isenções e o regime especial de Cabinda exigem
 * classificação fiscal por linha e, por isso, não são inferidos aqui.
 */
export function resolveInvoiceVatPolicy(regime: string): InvoiceVatPolicy {
  const normalized = String(regime ?? '').trim().toUpperCase();

  if (normalized.includes('SIMPLIFICADO')) {
    return {
      invoiceRate: '0',
      settlementRate: IVA_RATES_FROM_2023_12_28.simplifiedSettlement,
      ruleVersion: 'AO-CIVA-LEI-14-23-ART19-B-69B-69C',
      calculationStatus: 'PAYMENT_BASIS_NOT_INVOICE_LIQUIDATION',
      requiredInvoiceMention: SIMPLIFIED_IVA_INVOICE_MENTION,
    };
  }

  return {
    invoiceRate: IVA_RATES_FROM_2023_12_28.general,
    settlementRate: null,
    ruleVersion: 'AO-CIVA-LEI-14-23-ART19-A',
    calculationStatus: 'STANDARD_RATE_ASSUMED_PENDING_ITEM_CLASSIFICATION',
    requiredInvoiceMention: null,
  };
}
