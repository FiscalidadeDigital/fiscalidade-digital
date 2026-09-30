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
  legalReference: {
    diploma: string;
    officialNoticeUrl: string;
    officialNoticeConsultedAt: string;
    confirmedStructure: string[];
  };
  schema: { status: string; version: string | null; message: string };
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
