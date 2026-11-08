'use client';

import { AlertTriangle, Loader2, RefreshCw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  electronicInvoicingError,
  getElectronicInvoiceState,
  refreshElectronicStatus,
  submitElectronicInvoice,
  type ElectronicInvoiceState,
  type ElectronicSubmission,
} from '@/services/electronic-invoicing';

const labels: Record<string, string> = {
  READY: 'Pronto para enviar',
  SUBMITTING: 'A enviar',
  SUBMITTED: 'Enviado',
  PROCESSING: 'Em análise',
  VALID: 'Validado',
  INVALID: 'Precisa de revisão',
  REJECTED: 'Não aceite',
  ERROR: 'Não concluído',
};

function statusLabel(status?: string) {
  return labels[status || ''] || 'Em acompanhamento';
}

function formatDate(value?: string | null) {
  if (!value) return 'Ainda não disponível';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Ainda não disponível'
    : date.toLocaleString('pt-AO');
}

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

  function load() {
    setLoading(true);
    setError('');
    getElectronicInvoiceState(invoiceId)
      .then((nextState) => {
        setState(nextState);
        setSubmission(nextState.submission);
      })
      .catch((requestError) =>
        setError(
          electronicInvoicingError(
            requestError,
            'Não foi possível consultar o estado de envio do documento.',
          ),
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
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
          'Não foi possível concluir esta ação para o documento.',
        ),
      );
    } finally {
      setWorking(false);
    }
  }

  const canRefresh = Boolean(submission);
  const alreadySent = ['SUBMITTING', 'SUBMITTED', 'PROCESSING', 'VALID'].includes(
    submission?.status ?? '',
  );

  return (
    <section className="mt-6 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-sky-700">
            Faturação eletrónica
          </p>
          <h2 className="mt-1 font-semibold text-[var(--fd-text-primary)]">
            Estado do envio
          </h2>
        </div>
        {submission && (
          <span className="w-fit rounded-full border border-[var(--fd-border)] px-2.5 py-1 text-xs font-semibold">
            {statusLabel(submission.status)}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          O envio eletrónico pode requerer confirmação antes de o documento ser
          processado. Reveja sempre o estado apresentado aqui.
        </p>
      </div>

      {loading ? (
        <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-sky-700" />
      ) : (
        <>
          <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-[var(--fd-muted)]">Estado</dt>
              <dd className="mt-1 font-medium">
                {statusLabel(submission?.status ?? state?.status)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--fd-muted)]">Última atualização</dt>
              <dd className="mt-1">
                {formatDate(submission?.lastUpdatedAt ?? submission?.submittedAt)}
              </dd>
            </div>
          </dl>

          {state?.hasBlockers && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              Existem dados do documento que precisam de revisão antes de continuar.
            </p>
          )}

          {canTransmit && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                disabled={working || !state?.canSubmit || alreadySent}
                onClick={() => void action('submit')}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                Enviar documento
              </button>
              <button
                disabled={working || !canRefresh}
                onClick={() => void action('status')}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--fd-border)] px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar estado
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
