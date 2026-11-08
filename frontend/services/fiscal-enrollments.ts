import api from './api';

export type FiscalEnrollment = {
  id: string;
  taxType: string;
  regime: string | null;
  knowledgeStatus?: 'CONFIRMED' | 'UNKNOWN';
  status: string;
  validFrom: string;
  validUntil?: string | null;
  legalReference?: string | null;
  reviewStatus: string;
};
const unwrap = <T,>(response: any): T => response?.data?.data ?? response?.data;
export const listFiscalEnrollments = async () => unwrap<FiscalEnrollment[]>(await api.get('/fiscal-enrollments')) ?? [];
export const createFiscalEnrollment = async (input: Pick<FiscalEnrollment, 'taxType' | 'regime' | 'validFrom'> & Partial<Pick<FiscalEnrollment, 'validUntil' | 'legalReference'>>) => unwrap<FiscalEnrollment>(await api.post('/fiscal-enrollments', input));
export const endFiscalEnrollment = async (id: string, validUntil: string) => unwrap<FiscalEnrollment>(await api.patch(`/fiscal-enrollments/${id}/end`, { validUntil }));
export const changeFiscalEnrollment = async (input: {
  taxType: 'IVA' | 'INDUSTRIAL';
  regime: 'GERAL' | 'SIMPLIFICADO';
  validFrom: string;
}) => unwrap<{ previous: FiscalEnrollment | null; current: FiscalEnrollment }>(
  await api.post('/fiscal-enrollments/change', input),
);
