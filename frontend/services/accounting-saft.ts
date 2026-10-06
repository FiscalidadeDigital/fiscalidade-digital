import api from './api';

export type SaftReadinessIssue = {
  code: string;
  severity: 'BLOCKING' | 'WARNING';
  message: string;
  count?: number;
};

export type SaftReadiness = {
  kind: string;
  fiscalYear: number;
  period: { start: string; end: string };
  canExport: boolean;
  exportEndpointAvailable: boolean;
  certification: {
    status: 'NOT_CERTIFIED' | 'IN_REVIEW' | 'CERTIFIED';
    softwareCertificateNumber: string | null;
    productId: string | null;
  };
  legalReference: {
    diploma: string;
    officialNoticeUrl: string;
    officialNoticeConsultedAt: string;
    confirmedStructure: string[];
  };
  schema: { status: string; version: string | null; source: string; message: string };
  sections: {
    header: { state: string; company: Record<string, boolean> };
    masterData: {
      state: string;
      clients: number;
      suppliers: number;
      products: number;
    };
    accountingMovements: {
      state: string;
      journalEntries: number;
      salesDocuments: number;
      purchaseDocuments: number;
      taxTransactions: number;
      message: string;
    };
  };
  blockingIssues: SaftReadinessIssue[];
  dataQualityIssues: SaftReadinessIssue[];
};

export async function getSaftReadiness(fiscalYear: number) {
  const { data } = await api.get<SaftReadiness>(
    '/accounting/saft/readiness',
    { params: { fiscalYear } },
  );
  return data;
}

export type SaftIssue = {
  code: string;
  severity: 'BLOCKING' | 'WARNING';
  message: string;
  count?: number;
};

export type SaftPreflight = {
  fiscalYear: number;
  period: { start: string; end: string };
  technicalReadiness: boolean;
  certificationReadiness: boolean;
  certificationStatus: 'NOT_CERTIFIED';
  issues: SaftIssue[];
};

export type SaftSummary = {
  documentCount: number;
  customerCount: number;
  productCount: number;
  cancelledCount: number;
  signedDocumentCount: number;
  unsignedDocumentCount: number;
  taxableBase: string;
  taxAmount: string;
  grossTotal: string;
  warnings: SaftIssue[];
  errors: SaftIssue[];
};

export async function getSaftPreflight(fiscalYear: number) {
  const { data } = await api.get<SaftPreflight>('/accounting/saft/preflight', { params: { fiscalYear } });
  return data;
}

export async function getSaftSummary(fiscalYear: number) {
  const { data } = await api.get<SaftSummary>('/accounting/saft/summary', { params: { fiscalYear } });
  return data;
}

export async function downloadSaft(fiscalYear: number) {
  const response = await api.get<Blob>('/accounting/saft/download', { params: { fiscalYear }, responseType: 'blob' });
  const disposition = response.headers['content-disposition'] as string | undefined;
  const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? `SAFT-AO-${fiscalYear}.xml`;
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
