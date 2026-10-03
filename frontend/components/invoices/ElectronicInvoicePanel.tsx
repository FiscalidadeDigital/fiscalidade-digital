'use client';

import { AlertTriangle, Loader2, RefreshCw, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  electronicInvoicingError,
  getElectronicPreflight,
  getElectronicSubmissions,
  refreshElectronicStatus,
  submitElectronicInvoice,
  type ElectronicPreflight,
  type ElectronicSubmission,
} from '@/services/electronic-invoicing';

export default function ElectronicInvoicePanel({ invoiceId }: { invoiceId: string }) {
  const { user } = useAuth();
  const [preflight, setPreflight] = useState<ElectronicPreflight | null>(null);
  const [submission, setSubmission] = useState<ElectronicSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const canTransmit = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(user?.role ?? '');
  function load() {
    setLoading(true);
    Promise.all([getElectronicPreflight(invoiceId), getElectronicSubmissions()])
      .then(([check, rows]) => { setPreflight(check); setSubmission(rows.find((row) => row.invoiceId === invoiceId) ?? null); })
      .catch((requestError) => setError(electronicInvoicingError(requestError, 'Não foi possível consultar a preparação AGT.')))
      .finally(() => setLoading(false));
  }
  useEffect(load, [invoiceId]);
  async function action(kind: 'submit' | 'status') {
    setWorking(true); setError('');
    try { setSubmission(kind === 'submit' ? await submitElectronicInvoice(invoiceId) : await refreshElectronicStatus(invoiceId)); }
    catch (requestError) { setError(electronicInvoicingError(requestError, 'A operação AGT não foi concluída.')); }
    finally { setWorking(false); }
  }
  return <section className="mt-6 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-sky-700">Facturação Electrónica</p><h2 className="mt-1 font-semibold text-[var(--fd-text-primary)]">Estado AGT</h2></div>{submission && <span className="w-fit rounded-full border border-[var(--fd-border)] px-2.5 py-1 text-xs font-semibold">{submission.status}</span>}</div>
    <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><p>Certificação oficial pendente. A transmissão de produção está indisponível.</p></div>
    {loading ? <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-sky-700"/> : <>
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-[var(--fd-muted)]">submissionUUID</dt><dd className="mt-1 break-all font-mono">{submission?.submissionUuid || 'Ainda não atribuído'}</dd></div><div><dt className="text-[var(--fd-muted)]">requestID</dt><dd className="mt-1 font-mono">{submission?.requestId || 'Ainda não recebido'}</dd></div><div><dt className="text-[var(--fd-muted)]">Submissão</dt><dd className="mt-1">{submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString('pt-AO') : '—'}</dd></div><div><dt className="text-[var(--fd-muted)]">Última consulta</dt><dd className="mt-1">{submission?.lastCheckedAt ? new Date(submission.lastCheckedAt).toLocaleString('pt-AO') : '—'}</dd></div></dl>
      {preflight?.issues.length ? <ul className="mt-4 space-y-1 text-xs text-[var(--fd-text-secondary)]">{preflight.issues.map((issue) => <li key={issue.code}><strong>{issue.code}</strong>: {issue.message}</li>)}</ul> : null}
      {canTransmit && <div className="mt-5 flex flex-wrap gap-2"><button disabled={working || !preflight?.ready || Boolean(submission?.requestId)} onClick={() => void action('submit')} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Send className="h-4 w-4"/>Submeter em homologação</button><button disabled={working || !submission?.requestId} onClick={() => void action('status')} className="inline-flex items-center gap-2 rounded-lg border border-[var(--fd-border)] px-3 py-2 text-xs font-semibold disabled:opacity-40"><RefreshCw className="h-4 w-4"/>Consultar estado</button></div>}
    </>}
    {error && <p role="alert" className="mt-4 text-xs font-medium text-rose-700">{error}</p>}
  </section>;
}
