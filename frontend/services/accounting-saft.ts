import api from './api';

export type SaftIssue = {
  severity: 'BLOCKING' | 'WARNING';
  count?: number;
};

export type SaftReadiness = {
  fiscalYear: number;
  canExport: boolean;
  needsReview: boolean;
};

export type SaftPreflight = {
  fiscalYear: number;
  period: { start: string; end: string };
  ready: boolean;
  issues: SaftIssue[];
};

export type SaftSummary = {
  documentCount: number;
  customerCount: number;
  productCount: number;
  cancelledCount: number;
  taxableBase: string;
  taxAmount: string;
  grossTotal: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: unknown): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : '0';
}

function period(value: unknown): { start: string; end: string } {
  const input = record(value);
  return {
    start: typeof input.start === 'string' ? input.start : '',
    end: typeof input.end === 'string' ? input.end : '',
  };
}

function issues(value: unknown): SaftIssue[] {
  if (!Array.isArray(value)) return [];
  return value.map((issue) => {
    const item = record(issue);
    return {
      severity: item.severity === 'WARNING' ? 'WARNING' : 'BLOCKING',
      count: number(item.count) || undefined,
    };
  });
}

/** Returns only customer-facing SAF-T readiness fields. */
export async function getSaftReadiness(
  fiscalYear: number,
): Promise<SaftReadiness> {
  const { data } = await api.get<unknown>('/accounting/saft/readiness', {
    params: { fiscalYear },
  });
  const input = record(data);
  const blocking = issues(input.blockingIssues);
  const quality = issues(input.dataQualityIssues);

  return {
    fiscalYear: number(input.fiscalYear) || fiscalYear,
    canExport: input.canExport === true,
    needsReview: blocking.length + quality.length > 0,
  };
}

export async function getSaftPreflight(
  fiscalYear: number,
): Promise<SaftPreflight> {
  const { data } = await api.get<unknown>('/accounting/saft/preflight', {
    params: { fiscalYear },
  });
  const input = record(data);

  return {
    fiscalYear: number(input.fiscalYear) || fiscalYear,
    period: period(input.period),
    // `ready` is the public name; the alternate field preserves UI
    // compatibility while the server response is being simplified.
    ready: input.ready === true || input.technicalReadiness === true,
    issues: issues(input.issues),
  };
}

export async function getSaftSummary(fiscalYear: number): Promise<SaftSummary> {
  const { data } = await api.get<unknown>('/accounting/saft/summary', {
    params: { fiscalYear },
  });
  const input = record(data);

  return {
    documentCount: number(input.documentCount),
    customerCount: number(input.customerCount),
    productCount: number(input.productCount),
    cancelledCount: number(input.cancelledCount),
    taxableBase: money(input.taxableBase),
    taxAmount: money(input.taxAmount),
    grossTotal: money(input.grossTotal),
  };
}

export async function downloadSaft(fiscalYear: number) {
  const response = await api.get<Blob>('/accounting/saft/download', {
    params: { fiscalYear },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `SAFT-AO-${fiscalYear}.xml`;
  anchor.click();
  URL.revokeObjectURL(url);
}
