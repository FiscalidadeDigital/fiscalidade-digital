'use client';

import { FileText, Loader2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  getInvoiceApiError,
  getInvoicePage,
  type Invoice,
  type InvoicePage,
} from '@/services/invoice';

const money = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  minimumFractionDigits: 2,
});

export default function ProFormasPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<InvoicePage | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canWrite = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(user?.role ?? '');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError('');
      getInvoicePage({
        documentType: 'PRO_FORMA',
        search: search || undefined,
        page: 1,
        pageSize: 100,
        sortBy: 'issuedAt',
        sortDirection: 'desc',
      })
        .then((data) => active && setResult(data))
        .catch((requestError) => active && setError(getInvoiceApiError(requestError, 'Não foi possível carregar as Pro Formas.')))
        .finally(() => active && setLoading(false));
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1500px]">
        <header className="flex flex-col gap-4 border-b border-[var(--fd-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Facturação</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fd-text-primary)] sm:text-3xl">Pro Formas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--fd-text-secondary)]">Propostas comerciais separadas das facturas fiscais definitivas.</p>
          </div>
          {canWrite && <Link href="/pro-formas/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 text-xs font-semibold text-white hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"><Plus className="h-4 w-4" />Nova Pro Forma</Link>}
        </header>

        <aside className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Documento preliminar — não constitui factura fiscal definitiva. Os valores não integram IVA liquidado, receita definitiva, obrigações ou pagamento.
        </aside>

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="border-b border-[var(--fd-border)] p-4">
            <label className="relative block max-w-xl"><span className="sr-only">Pesquisar Pro Formas</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fd-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número, cliente ou NIF" className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>
          </div>
          {error && <p role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]"><tr><th className="px-5 py-3 font-semibold">Pro Forma</th><th className="px-4 py-3 font-semibold">Cliente</th><th className="px-4 py-3 text-right font-semibold">Subtotal</th><th className="px-4 py-3 text-right font-semibold">Total estimado</th><th className="px-5 py-3 text-right font-semibold">Acção</th></tr></thead>
              <tbody className="divide-y divide-[var(--fd-border)]">{loading ? <tr><td colSpan={5} className="h-52 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-700" /></td></tr> : result?.data.length ? result.data.map((document: Invoice) => <tr key={document.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-lg bg-violet-50 p-2 text-violet-700"><FileText className="h-4 w-4" /></span><div><p className="font-semibold text-[var(--fd-text-primary)]">{document.invoiceNumber}</p><p className="mt-1 text-[11px] text-[var(--fd-muted)]">{new Date(document.issuedAt).toLocaleDateString('pt-AO')}</p></div></div></td><td className="px-4 py-4"><p className="font-medium text-[var(--fd-text-primary)]">{document.client.name}</p><p className="mt-1 text-[11px] text-[var(--fd-muted)]">NIF {document.client.nif || 'não indicado'}</p></td><td className="px-4 py-4 text-right tabular-nums">{money.format(Number(document.subtotalAmount ?? document.subtotal))}</td><td className="px-4 py-4 text-right font-semibold tabular-nums">{money.format(Number(document.totalAmount ?? document.total))}</td><td className="px-5 py-4 text-right"><Link href={`/pro-formas/${document.id}`} className="text-xs font-semibold text-sky-700 hover:text-sky-900">Abrir</Link></td></tr>) : <tr><td colSpan={5} className="h-52 text-center text-[var(--fd-muted)]">Nenhuma Pro Forma corresponde à pesquisa.</td></tr>}</tbody></table>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}
