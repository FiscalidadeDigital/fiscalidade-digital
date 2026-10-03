'use client';

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  cancelInvoice,
  getInvoiceApiError,
  getInvoicePage,
  Invoice,
  InvoicePage,
  InvoiceStatus,
  markInvoicePaid,
  openInvoicePdf,
} from '@/services/invoice';

const money = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  minimumFractionDigits: 2,
});

const statusLabels: Record<InvoiceStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Paga',
  CANCELLED: 'Cancelada',
};

const statusStyles: Record<InvoiceStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-800',
};

type PendingAction = { invoice: Invoice; action: 'pay' | 'cancel' };

export default function InvoicesPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<InvoicePage | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [sort, setSort] = useState('issuedAt:desc');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [sortBy, sortDirection] = useMemo(() => sort.split(':'), [sort]);
  const canWrite = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(user?.role ?? '');
  const canCancel = ['OWNER', 'ADMIN'].includes(user?.role ?? '');

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      getInvoicePage({
        search: search || undefined,
        status,
        page,
        pageSize: 20,
        sortBy: sortBy as 'issuedAt' | 'invoiceNumber' | 'total',
        sortDirection: sortDirection as 'asc' | 'desc',
      })
        .then((data) => active && setResult(data))
        .catch((requestError) =>
          active && setError(getInvoiceApiError(requestError, 'Não foi possível carregar as facturas.')),
        )
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [page, reload, search, sortBy, sortDirection, status]);

  function resetPage() {
    setPage(1);
    setNotice('');
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setActionBusy(true);
    setError('');
    try {
      if (pendingAction.action === 'pay') {
        await markInvoicePaid(pendingAction.invoice.id);
        setNotice(`${pendingAction.invoice.invoiceNumber} foi marcada como paga.`);
      } else {
        await cancelInvoice(pendingAction.invoice.id);
        setNotice(`${pendingAction.invoice.invoiceNumber} foi cancelada.`);
      }
      setPendingAction(null);
      setReload((value) => value + 1);
    } catch (requestError) {
      setPendingAction(null);
      setError(getInvoiceApiError(requestError, 'Não foi possível actualizar a factura.'));
    } finally {
      setActionBusy(false);
    }
  }

  async function downloadPdf(invoice: Invoice) {
    setPdfBusy(invoice.id);
    setError('');
    try {
      await openInvoicePdf(invoice.id);
    } catch (requestError) {
      setError(getInvoiceApiError(requestError, 'Não foi possível abrir o PDF.'));
    } finally {
      setPdfBusy(null);
    }
  }

  const cards = [
    ['Documentos', result?.summary.total ?? 0],
    ['Pendentes', result?.summary.pending ?? 0],
    ['Pagas', result?.summary.paid ?? 0],
    ['Total facturado', money.format(Number(result?.summary.totalInvoicedAmount ?? result?.summary.totalInvoiced ?? 0))],
  ];

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1500px]">
        <header className="flex flex-col gap-4 border-b border-[var(--fd-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Facturação</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fd-text-primary)] sm:text-3xl">Facturas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--fd-text-secondary)]">Consulte documentos emitidos, valores e estado operacional de pagamento.</p>
          </div>
          {canWrite && <Link href="/invoices/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 text-xs font-semibold text-white hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"><Plus className="h-4 w-4" />Emitir factura</Link>}
        </header>

        <aside className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Os documentos permanecem internos enquanto não existir configuração, certificação e confirmação efectiva da integração de facturação electrónica com a AGT.</p>
        </aside>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo de facturas">
          {cards.map(([label, value]) => <article key={String(label)} className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-4 shadow-sm"><p className="text-xs font-medium text-[var(--fd-text-secondary)]">{label}</p><p className="mt-3 text-xl font-semibold tabular-nums text-[var(--fd-text-primary)]">{value}</p></article>)}
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="grid gap-3 border-b border-[var(--fd-border)] p-4 lg:grid-cols-[minmax(260px,1fr)_180px_210px]">
            <label className="relative block"><span className="sr-only">Pesquisar facturas</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fd-muted)]" /><input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Número, cliente ou NIF" className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>
            <label><span className="sr-only">Filtrar por estado</span><select value={status} onChange={(event) => { setStatus(event.target.value as InvoiceStatus | ''); resetPage(); }} className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"><option value="">Todos os estados</option><option value="PENDING">Pendentes</option><option value="PAID">Pagas</option><option value="CANCELLED">Canceladas</option></select></label>
            <label><span className="sr-only">Ordenar facturas</span><select value={sort} onChange={(event) => { setSort(event.target.value); resetPage(); }} className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"><option value="issuedAt:desc">Mais recentes</option><option value="issuedAt:asc">Mais antigas</option><option value="total:desc">Maior total</option><option value="total:asc">Menor total</option><option value="invoiceNumber:asc">Número crescente</option></select></label>
          </div>
          {notice && <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-medium text-emerald-800">{notice}</div>}
          {error && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-800">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]"><tr><th className="px-5 py-3 font-semibold">Factura</th><th className="px-4 py-3 font-semibold">Cliente</th><th className="px-4 py-3 text-right font-semibold">Subtotal</th><th className="px-4 py-3 text-right font-semibold">IVA</th><th className="px-4 py-3 text-right font-semibold">Total</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-5 py-3 text-right font-semibold">Acções</th></tr></thead>
              <tbody className="divide-y divide-[var(--fd-border)]">
                {loading ? <tr><td colSpan={7} className="h-52 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-700" aria-label="A carregar facturas" /></td></tr> : result?.data.length ? result.data.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="flex items-start gap-3"><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><FileText className="h-4 w-4" /></span><div><Link href={`/invoices/${invoice.id}`} className="text-sm font-semibold text-sky-800 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2 dark:text-sky-300">{invoice.invoiceNumber}</Link><p className="mt-1 text-[11px] text-[var(--fd-muted)]">{new Date(invoice.issuedAt).toLocaleDateString('pt-AO')}</p></div></div></td>
                    <td className="px-4 py-4"><p className="text-sm font-medium text-[var(--fd-text-primary)]">{invoice.client.name}</p><p className="mt-1 text-[11px] text-[var(--fd-muted)]">NIF {invoice.client.nif || 'não indicado'}</p></td>
                    <td className="px-4 py-4 text-right text-xs tabular-nums text-[var(--fd-text-secondary)]">{money.format(Number(invoice.subtotalAmount ?? invoice.subtotal))}</td>
                    <td className="px-4 py-4 text-right text-xs tabular-nums text-[var(--fd-text-secondary)]">{money.format(Number(invoice.ivaAmount ?? invoice.iva))}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-[var(--fd-text-primary)]">{money.format(Number(invoice.totalAmount ?? invoice.total))}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyles[invoice.status]}`}>{statusLabels[invoice.status]}</span></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/invoices/${invoice.id}`} title="Ver detalhes" className="inline-flex items-center gap-2 rounded-lg border border-[var(--fd-border)] p-2 text-[var(--fd-text-secondary)] hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600" aria-label={`Ver detalhes de ${invoice.invoiceNumber}`}><Eye className="h-4 w-4" /><span className="sr-only xl:not-sr-only xl:text-xs xl:font-semibold">Detalhes</span></Link><button type="button" title="Abrir PDF" disabled={pdfBusy === invoice.id} onClick={() => void downloadPdf(invoice)} className="rounded-lg border border-[var(--fd-border)] p-2 text-[var(--fd-text-secondary)] hover:border-sky-300 hover:text-sky-800 disabled:opacity-50" aria-label={`Abrir PDF de ${invoice.invoiceNumber}`}>{pdfBusy === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</button>{invoice.status === 'PENDING' && canWrite && <button type="button" onClick={() => setPendingAction({ invoice, action: 'pay' })} className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50" aria-label={`Registar pagamento de ${invoice.invoiceNumber}`}><CheckCircle2 className="h-4 w-4" /></button>}{invoice.status === 'PENDING' && canCancel && <button type="button" onClick={() => setPendingAction({ invoice, action: 'cancel' })} className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50" aria-label={`Cancelar ${invoice.invoiceNumber}`}><XCircle className="h-4 w-4" /></button>}</div></td>
                  </tr>
                )) : <tr><td colSpan={7} className="h-52 text-center text-sm text-[var(--fd-muted)]">Nenhuma factura corresponde aos filtros.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[var(--fd-border)] px-5 py-4 text-xs text-[var(--fd-muted)] sm:flex-row sm:items-center sm:justify-between"><span>{result?.pagination.total ?? 0} resultado(s)</span><div className="flex items-center gap-2"><button type="button" disabled={!result || result.pagination.page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button><span>Página {result?.pagination.page ?? page} de {result?.pagination.totalPages ?? 1}</span><button type="button" disabled={!result || result.pagination.page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página seguinte"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>
      </main>
      {pendingAction && <ActionDialog pending={pendingAction} busy={actionBusy} onClose={() => setPendingAction(null)} onConfirm={confirmAction} />}
    </DashboardLayout>
  );
}

function ActionDialog({ pending, busy, onClose, onConfirm }: { pending: PendingAction; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const paying = pending.action === 'pay';
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--fd-overlay)] p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="invoice-action-title" className="w-full max-w-md rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Alteração de estado</p><h2 id="invoice-action-title" className="mt-1 text-lg font-semibold text-[var(--fd-text-primary)]">{paying ? 'Registar pagamento' : 'Cancelar factura'}</h2></div><button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-2 text-[var(--fd-muted)]" aria-label="Fechar"><X className="h-4 w-4" /></button></div><p className="mt-4 text-sm leading-6 text-[var(--fd-text-secondary)]">{paying ? `Confirma que ${pending.invoice.invoiceNumber} foi efectivamente paga? Esta acção influencia os valores recebidos e as obrigações.` : `Confirma o cancelamento de ${pending.invoice.invoiceNumber}? Facturas pagas exigem um fluxo de correcção e não podem ser canceladas directamente.`}</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold">Voltar</button><button type="button" onClick={onConfirm} disabled={busy} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 ${paying ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'}`}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{paying ? 'Confirmar pagamento' : 'Confirmar cancelamento'}</button></div></section></div>;
}
