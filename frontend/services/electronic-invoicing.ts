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
  message?: string | null;
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
  message?: unknown;
  submittedAt?: unknown;
  lastUpdatedAt?: unknown;
  lastCheckedAt?: unknown;
};

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

const ELECTRONIC_STATUS_LABELS: Record<string, string> = {
  READY: 'Pronta',
  PREPARATION_COMPLETE: 'Preparada',
  PREPARATION_REQUIRED: 'Em preparação',
  UNAVAILABLE: 'Indisponível',
  SUBMITTING: 'A preparar',
  SUBMITTED: 'Registada',
  PROCESSING: 'Em análise',
  VALID: 'Validada',
  INVALID: 'Requer revisão',
  REJECTED: 'Requer revisão',
  ERROR: 'Indisponível',
};

export function electronicStatusLabel(status: unknown): string {
  const value = text(status);
  return value ? ELECTRONIC_STATUS_LABELS[value] ?? 'Em análise' : 'Em análise';
}

function publicSubmissionMessage(status: string): string | undefined {
  const messages: Record<string, string> = {
    READY: 'O documento está pronto para acompanhamento.',
    SUBMITTING: 'O pedido está a ser preparado.',
    SUBMITTED: 'O documento foi registado para acompanhamento.',
    PROCESSING: 'O documento está em processamento.',
    VALID: 'O documento foi validado.',
    INVALID: 'O documento requer revisão antes de continuar.',
    REJECTED: 'O documento requer revisão antes de continuar.',
    ERROR: 'Não foi possível concluir esta acção. Tente novamente mais tarde.',
  };

  return messages[status] ?? 'O documento está em análise.';
}

function toSubmission(value: unknown): ElectronicSubmission | null {
  if (!value || typeof value !== 'object') return null;

  const remote = value as RemoteSubmission;
  const status = text(remote.status);

  if (!status) return null;

  return {
    documentNumber: text(remote.documentNumber) ?? text(remote.agtDocumentNo) ?? null,
    status,
    // A message returned by another service can contain internal details.
    // Only present a fixed, customer-safe explanation for known states.
    message: publicSubmissionMessage(status) ?? null,
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
