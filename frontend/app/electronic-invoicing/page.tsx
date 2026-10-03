'use client';

import { AlertTriangle, CheckCircle2, Clock3, Loader2, RadioTower } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { electronicInvoicingError, getElectronicReadiness, getElectronicSubmissions, type ElectronicReadiness, type ElectronicSubmission } from '@/services/electronic-invoicing';

const labels: Record<string, string> = { READY: 'Pronta', SUBMITTING: 'A submeter', SUBMITTED: 'Submetida', PROCESSING: 'Em processamento', VALID: 'Válida', INVALID: 'Inválida', REJECTED: 'Rejeitada', ERROR: 'Erro' };

export default function ElectronicInvoicingPage() {
  const [readiness, setReadiness] = useState<ElectronicReadiness | null>(null);
  const [submissions, setSubmissions] = useState<ElectronicSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([getElectronicReadiness(), getElectronicSubmissions()])
      .then(([ready, rows]) => { setReadiness(ready); setSubmissions(rows); })
      .catch((requestError) => setError(electronicInvoicingError(requestError, 'Não foi possível carregar a integração.')))
      .finally(() => setLoading(false));
  }, []);
  const counts = (status: string[]) => submissions.filter((entry) => status.includes(entry.status)).length;
  return <DashboardLayout><main className="mx-auto w-full max-w-7xl pb-12">
    <header className="border-b border-[var(--fd-border)] pb-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-sky-700">Integração fiscal</p><h1 className="mt-2 text-2xl font-semibold text-[var(--fd-text-primary)]">Facturação Electrónica</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--fd-text-secondary)]">Preparação técnica para a API oficial da AGT, com submissão assíncrona, consulta e rastreabilidade.</p></header>
    <aside className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0"/><div><p className="font-semibold">Certificação oficial pendente</p><p className="mt-1">A integração permanece em preparação/homologação. Não representa software certificado ou homologado pela AGT.</p></div></aside>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {loading ? <div className="grid min-h-52 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-sky-700"/></div> : <>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Configuração" value={readiness?.configured ? 'Configurada' : 'Pendente'} icon={RadioTower}/><Metric label="Pendentes" value={String(counts(['READY']))} icon={Clock3}/><Metric label="Em processamento" value={String(counts(['SUBMITTING','SUBMITTED','PROCESSING']))} icon={Clock3}/><Metric label="Validadas" value={String(counts(['VALID']))} icon={CheckCircle2}/>
      </section>
      <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)]"><div className="border-b border-[var(--fd-border)] p-5"><h2 className="font-semibold text-[var(--fd-text-primary)]">Submissões do tenant</h2><p className="mt-1 text-xs text-[var(--fd-muted)]">Ambiente: {readiness?.environment ?? 'homologation'} · Schema {readiness?.schemaVersion}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[var(--fd-table-header)] text-xs uppercase text-[var(--fd-muted)]"><tr><th className="px-5 py-3">Documento</th><th className="px-4 py-3">requestID</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Tentativas</th><th className="px-5 py-3">Actualização</th></tr></thead><tbody className="divide-y divide-[var(--fd-border)]">{submissions.length ? submissions.map((row) => <tr key={row.id}><td className="px-5 py-4"><Link href={`/invoices/${row.invoiceId}`} className="font-semibold text-sky-700 hover:underline">{row.agtDocumentNo || row.invoiceId}</Link></td><td className="px-4 py-4 font-mono text-xs">{row.requestId || '—'}</td><td className="px-4 py-4">{labels[row.status] || row.status}</td><td className="px-4 py-4">{row.attempt}</td><td className="px-5 py-4">{row.lastCheckedAt ? new Date(row.lastCheckedAt).toLocaleString('pt-AO') : '—'}</td></tr>) : <tr><td colSpan={5} className="h-40 text-center text-[var(--fd-muted)]">Ainda não existem submissões electrónicas.</td></tr>}</tbody></table></div></section>
    </>}
  </main></DashboardLayout>;
}
function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof RadioTower }) { return <article className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-4"><div className="flex items-center justify-between"><p className="text-xs text-[var(--fd-muted)]">{label}</p><Icon className="h-4 w-4 text-sky-700"/></div><p className="mt-3 text-xl font-semibold text-[var(--fd-text-primary)]">{value}</p></article>; }
