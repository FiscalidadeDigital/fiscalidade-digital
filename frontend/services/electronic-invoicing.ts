import api from './api';
import { getSafeErrorMessage } from '@/lib/safe-error';

/** Public, customer-facing representation of electronic document tracking. */
export type ElectronicReadiness = {
  status: string;
  available: boolean;
};

export type ElectronicSubmission = {
  documentNumber?: string | null;
  status: string;
  submittedAt?: string | null;
  lastUpdatedAt?: string | null;
};

export type ElectronicPreflight = {
  ready: boolean;
  needsReview: boolean;
};

export type ElectronicInvoiceState = {
  status: string;
  canSubmit: boolean;
  hasBlockers: boolean;
  submission: ElectronicSubmission | null;
};

type RemoteSubmission = {
  documentNumber?: unknown;
  agtDocumentNo?: unknown;
  status?: unknown;
  submittedAt?: unknown;
  lastUpdatedAt?: unknown;
  lastCheckedAt?: unknown;
};

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toSubmission(value: unknown): ElectronicSubmission | null {
  if (!value || typeof value !== 'object') return null;

  const remote = value as RemoteSubmission;
  const status = text(remote.status);

  if (!status) return null;

  return {
    documentNumber: text(remote.documentNumber) ?? text(remote.agtDocumentNo) ?? null,
    status,
    submittedAt: text(remote.submittedAt) ?? null,
    lastUpdatedAt:
      text(remote.lastUpdatedAt) ?? text(remote.lastCheckedAt) ?? null,
  };
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

export async function getElectronicReadiness(): Promise<ElectronicReadiness> {
  const { data } = await api.get<Record<string, unknown>>(
    '/electronic-invoicing/readiness',
  );

  return {
    status: text(data?.status) ?? 'UNAVAILABLE',
    available: toBoolean(data?.available) || toBoolean(data?.transmissionEnabled),
  };
}

export async function getElectronicSubmissions(): Promise<ElectronicSubmission[]> {
  const { data } = await api.get<unknown>('/electronic-invoicing');
  return Array.isArray(data)
    ? data.map(toSubmission).filter((item): item is ElectronicSubmission => Boolean(item))
    : [];
}

export async function getElectronicPreflight(
  invoiceId: string,
): Promise<ElectronicPreflight> {
  const { data } = await api.get<Record<string, unknown>>(
    `/electronic-invoicing/invoice/${invoiceId}/preflight`,
  );

  const blockers = Array.isArray(data?.blockers)
    ? data.blockers
    : Array.isArray(data?.issues)
      ? data.issues
      : [];
  return {
    ready: toBoolean(data?.ready),
    needsReview: blockers.length > 0,
  };
}

export async function getElectronicInvoiceState(
  invoiceId: string,
): Promise<ElectronicInvoiceState> {
  const { data } = await api.get<Record<string, unknown>>(
    `/electronic-invoicing/invoice/${invoiceId}/state`,
  );

  return {
    status: text(data?.status) ?? text(data?.submissionStatus) ?? 'READY',
    // canSubmit is the public name. The second value keeps compatibility
    // while deployments transition to the sanitised response contract.
    canSubmit: toBoolean(data?.canSubmit) || toBoolean(data?.canSubmitHomologation),
    hasBlockers: Array.isArray(data?.blockers) && data.blockers.length > 0,
    submission: toSubmission(data?.submission),
  };
}

export async function submitElectronicInvoice(
  invoiceId: string,
): Promise<ElectronicSubmission> {
  const { data } = await api.post<unknown>(
    `/electronic-invoicing/invoice/${invoiceId}/submit`,
  );
  return toSubmission(data) ?? { status: 'SUBMITTING' };
}

export async function refreshElectronicStatus(
  invoiceId: string,
): Promise<ElectronicSubmission> {
  const { data } = await api.post<unknown>(
    `/electronic-invoicing/invoice/${invoiceId}/status`,
  );
  return toSubmission(data) ?? { status: 'PROCESSING' };
}

export function electronicInvoicingError(error: unknown, fallback: string) {
  return getSafeErrorMessage(error, fallback);
}
