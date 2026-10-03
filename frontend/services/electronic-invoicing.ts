import { isAxiosError } from 'axios';
import api from './api';

export type ElectronicReadiness = {
  certificationStatus: 'NOT_CERTIFIED';
  environment: string;
  configured: boolean;
  transmissionEnabled: boolean;
  schemaVersion: string;
};
export type ElectronicSubmission = {
  id: string; invoiceId: string; submissionUuid: string; agtDocumentNo?: string | null;
  requestId?: string | null; environment: string; status: string; attempt: number;
  submittedAt?: string | null; lastCheckedAt?: string | null; agtErrors?: unknown;
};
export type ElectronicPreflight = {
  ready: boolean; certificationStatus: 'NOT_CERTIFIED'; homologationOnly: boolean;
  issues: Array<{ code: string; category: string; message: string }>;
  series?: { seriesCode: string } | null;
};
export type ElectronicInvoiceState = {
  certificationStatus: 'NOT_CERTIFIED'; configured: boolean; environment: string;
  submissionStatus: string; canSubmitHomologation: boolean; canSubmitProduction: boolean;
  blockers: Array<{ code: string; message: string }>;
  submission: ElectronicSubmission | null;
};

export async function getElectronicReadiness() { return (await api.get<ElectronicReadiness>('/electronic-invoicing/readiness')).data; }
export async function getElectronicSubmissions() { return (await api.get<ElectronicSubmission[]>('/electronic-invoicing')).data; }
export async function getElectronicPreflight(invoiceId: string) { return (await api.get<ElectronicPreflight>(`/electronic-invoicing/invoice/${invoiceId}/preflight`)).data; }
export async function getElectronicInvoiceState(invoiceId: string) { return (await api.get<ElectronicInvoiceState>(`/electronic-invoicing/invoice/${invoiceId}/state`)).data; }
export async function submitElectronicInvoice(invoiceId: string) { return (await api.post<ElectronicSubmission>(`/electronic-invoicing/invoice/${invoiceId}/submit`)).data; }
export async function refreshElectronicStatus(invoiceId: string) { return (await api.post<ElectronicSubmission>(`/electronic-invoicing/invoice/${invoiceId}/status`)).data; }
export function electronicInvoicingError(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string | string[] }>(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message || fallback;
}
