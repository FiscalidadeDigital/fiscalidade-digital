'use client';

import { AlertTriangle, Loader2, RefreshCw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  electronicInvoicingError,
  electronicStatusLabel,
  getElectronicInvoiceState,
  refreshElectronicStatus,
  submitElectronicInvoice,
  type ElectronicInvoiceState,
  type ElectronicSubmission,
} from '@/services/electronic-invoicing';

const refreshableStatuses = new Set(['SUBMITTED', 'PROCESSING']);

export default function ElectronicInvoicePanel({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<ElectronicInvoiceState | null>(null);
  const [submission, setSubmission] = useState<ElectronicSubmission | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const canTransmit = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(
    user?.role ?? '',
  );

  useEffect(() => {
    setLoading(true);
    getElectronicInvoiceState(invoiceId)
      .then((localState) => {
        setState(localState);
        setSubmission(localState.submission);
      })
      .catch((requestError) =>
        setError(
          electronicInvoicingError(
            requestError,
            'Não foi possível consultar o estado do documento.',
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [invoiceId]);

  async function action(kind: 'submit' | 'status') {
    setWorking(true);
    setError('');
    try {
      setSubmission(
        kind === 'submit'
          ? await submitElectronicInvoice(invoiceId)
          : await refreshElectronicStatus(invoiceId),
      );
    } catch (requestError) {
      setError(
        electronicInvoicingError(
          requestError,
          'Não foi possível concluir esta acção.',
        ),
      );
    } finally {
      setWorking(false);
    }
  }

  const canRefresh = Boolean(
    submission && refreshableStatuses.has(submission.status),
  );

  return (
    <section className="mt-6 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-fd-accent">
            Facturação Electrónica
          </p>
          <h2 className="mt-1 font-semibold text-[var(--fd-text-primary)]">
            Situação do documento
          </h2>
        </div>
        {submission && (
          <span className="w-fit rounded-full border border-[var(--fd-border)] px-2.5 py-1 text-xs font-semibold">
            {electronicStatusLabel(submission.status)}
          </span>
        )}
      </div>
      <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Disponibilidade oficial pendente. A confirmação externa ainda não
          está disponível.
        </p>
      </div>
      {loading ? (
        <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-fd-accent" />
      ) : (
        <>
          <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-[var(--fd-muted)]">Documento</dt>
              <dd className="mt-1 break-all font-mono">
                {submission?.documentNumber || 'Ainda não atribuído'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--fd-muted)]">Estado</dt>
              <dd className="mt-1">
                {submission?.message ||
                  'Ainda não existem detalhes da submissão.'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--fd-muted)]">Envio</dt>
              <dd className="mt-1">
                {submission?.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString('pt-AO')
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--fd-muted)]">Última actualização</dt>
              <dd className="mt-1">
                {submission?.lastUpdatedAt
                  ? new Date(submission.lastUpdatedAt).toLocaleString('pt-AO')
                  : '—'}
              </dd>
            </div>
          </dl>
          {state?.hasBlockers && (
            <p className="mt-4 text-xs text-[var(--fd-text-secondary)]">
              Existem informações pendentes antes de enviar este documento.
            </p>
          )}
          {canTransmit && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                disabled={
                  working ||
                  !state?.canSubmit ||
                  Boolean(submission && submission.status !== 'READY')
                }
                onClick={() => void action('submit')}
                className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Enviar para confirmação
              </button>
              <button
                disabled={working || !canRefresh}
                onClick={() => void action('status')}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--fd-border)] px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" />
                Consultar estado
              </button>
            </div>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-4 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </section>
  );
}
