import api from './api';

export type FiscalTaxType =
  | 'IVA'
  | 'INDUSTRIAL'
  | 'IRT'
  | 'SS'
  | 'SAFT';

export type FiscalSituationTax = {
  taxType: FiscalTaxType;
  applicability: { status: string; reasonCode?: string | null; reasonLabel?: string | null };
  enrollment: {
    regime: string;
    validFrom?: string | null;
    validUntil?: string | null;
    reviewStatus?: string | null;
    legalBasis?: { diploma?: string | null; source?: string | null } | null;
  } | null;
  calendar: { status: string; statusLabel?: string | null; referenceYear: number };
  nextObligation: {
    id?: string;
    title?: string | null;
    type?: string | null;
    period?: string | null;
    dueDate?: string | null;
    status?: string | null;
  } | null;
  automationReady: boolean;
  attentionRequired: boolean;
};

export type FiscalSituation = {
  period: string;
  generatedAt: string;
  summary: {
    applicable: number;
    notApplicable: number;
    reviewRequired: number;
    upcoming: number;
    overdue: number;
  };
  taxes: FiscalSituationTax[];
};

function unwrap<T>(response: { data?: unknown }): T {
  const data = response?.data;
  return data && typeof data === 'object' && 'data' in data
    ? (data as { data: T }).data
    : data as T;
}

/** Uses the authenticated API context; tenantId is never supplied by the UI. */
export async function getFiscalSituation(period?: string): Promise<FiscalSituation> {
  const response = await api.get('/fiscal-situation', {
    params: period ? { period } : undefined,
  });
  return unwrap<FiscalSituation>(response);
}

export async function confirmFiscalSituation(input: { taxType: 'IVA' | 'INDUSTRIAL'; regime: 'GERAL' | 'SIMPLIFICADO'; validFrom: string }) {
  const response = await api.post('/fiscal-situation/confirm', input);
  return unwrap(response);
}
