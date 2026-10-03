'use client';

import { AlertTriangle, ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ElectronicInvoicePanel from '@/components/invoices/ElectronicInvoicePanel';
import { useAuth } from '@/context/AuthContext';
import {
  convertProForma,
  getInvoice,
  getInvoiceApiError,
  openInvoicePdf,
  type Invoice,
} from '@/services/invoice';

const money = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  minimumFractionDigits: 2,
});

export default function InvoiceDetail({ proForma = false }: { proForma?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [document, setDocument] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [converting, setConverting] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const canConvert = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(user?.role ?? '');
  const collectionHref = proForma ? '/pro-formas' : '/invoices';

  useEffect(() => {
    let active = true;
    setLoading(true);
    getInvoice(id)
      .then((data) => {
        if (!active) return;
        if ((proForma && data.documentType !== 'PRO_FORMA') || (!proForma && data.documentType !== 'NORMAL')) {
          setError('O documento não pertence a esta área.');
          return;
        }
        setDocument(data);
      })
      .catch((requestError) => active && setError(getInvoiceApiError(requestError, 'Não foi possível carregar o documento.')))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, proForma]);

  async function convert() {
    if (!document) return;
    setConverting(true);
    setError('');
    try {
      const invoice = await convertProForma(document.id);
      setDocument((current) => current ? { ...current, convertedInvoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber } } : current);
      setConfirming(false);
    } catch (requestError) {
      setConfirming(false);
      setError(getInvoiceApiError(requestError, 'Não foi possível converter a Pro Forma.'));
    } finally {
      setConverting(false);
    }
  }

  async function downloadPdf() {
    if (!document) return;
    setPdfBusy(true);
    setError('');
    try {
      await openInvoicePdf(document.id);
    } catch (requestError) {
      setError(getInvoiceApiError(requestError, 'Não foi possível abrir o PDF.'));
    } finally {
      setPdfBusy(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600 dark:text-slate-300"><Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar documento…</div>;

  if (!document) return <DashboardLayout><main className="mx-auto max-w-3xl"><Link href={collectionHref} className="text-sm font-semibold text-sky-700">Voltar</Link><p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error || 'Documento não encontrado.'}</p></main></DashboardLayout>;

  const converted = document.convertedInvoice;
  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl pb-12">
        <header className="flex flex-col gap-4 border-b border-[var(--fd-border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3"><button type="button" onClick={() => router.push(collectionHref)} className="mt-1 grid h-10 w-10 place-items-center rounded-lg border border-[var(--fd-border)] text-[var(--fd-text-secondary)] hover:bg-slate-50" aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{proForma ? 'Pro Forma' : 'Facturação'}</p><h1 className="mt-2 text-2xl font-semibold text-[var(--fd-text-primary)]">{document.invoiceNumber}</h1><p className="mt-1 text-sm text-[var(--fd-text-secondary)]">Emitida em {new Date(document.issuedAt).toLocaleDateString('pt-AO')}</p></div></div>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={pdfBusy} onClick={() => void downloadPdf()} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--fd-border)] px-4 text-xs font-semibold text-[var(--fd-text-primary)] hover:border-sky-300 hover:text-sky-800 disabled:opacity-50">{pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Abrir PDF</button>{proForma && !converted && canConvert && <button type="button" onClick={() => setConfirming(true)} className="h-10 rounded-lg bg-sky-700 px-4 text-xs font-semibold text-white hover:bg-sky-800">Converter em factura</button>}</div>
        </header>

        {proForma && <aside className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p>Documento preliminar — não constitui factura fiscal definitiva. O IVA fiscal final e a retenção fiscal final deste documento são zero; qualquer referência a imposto é apenas preview da futura factura.</p></aside>}
        {converted && <section className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="font-semibold">Pro Forma convertida</p><p className="mt-1">{document.invoiceNumber} <span aria-hidden="true">→</span> <Link href={`/invoices/${converted.id}`} className="font-semibold underline underline-offset-2">Factura {converted.invoiceNumber}</Link></p></section>}
        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm"><div className="border-b border-[var(--fd-border)] p-5"><h2 className="font-semibold text-[var(--fd-text-primary)]">Linhas do documento</h2><p className="mt-1 text-sm text-[var(--fd-text-secondary)]">Cliente: {document.client.name}{document.client.nif ? ` · NIF ${document.client.nif}` : ''}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]"><tr><th className="px-5 py-3">Descrição</th><th className="px-3 py-3">Unidade</th><th className="px-3 py-3 text-right">Quantidade</th><th className="px-3 py-3 text-right">Preço</th><th className="px-5 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-[var(--fd-border)]">{document.items.map((item) => <tr key={item.id}><td className="px-5 py-4 font-medium text-[var(--fd-text-primary)]">{item.productName}</td><td className="px-3 py-4 text-[var(--fd-text-secondary)]">{item.unit}</td><td className="px-3 py-4 text-right tabular-nums">{item.quantityAmount ?? item.quantity}</td><td className="px-3 py-4 text-right tabular-nums">{money.format(Number(item.unitPriceAmount ?? item.unitPrice))}</td><td className="px-5 py-4 text-right font-semibold tabular-nums">{money.format(Number(item.totalAmount ?? item.total))}</td></tr>)}</tbody></table></div></div>
          <aside className="h-fit rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><FileText className="h-4 w-4" /></span><div><p className="font-semibold text-[var(--fd-text-primary)]">Resumo</p><p className="text-xs text-[var(--fd-muted)]">AOA</p></div></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[var(--fd-text-secondary)]">Tipo de documento</dt><dd className="font-medium">{proForma ? 'Pro Forma' : 'FT — Factura'}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--fd-text-secondary)]">Estado de pagamento</dt><dd className="font-medium">{{ PENDING: 'Pendente', PAID: 'Paga', CANCELLED: 'Cancelada' }[document.status]}</dd></div><div className="flex justify-between gap-4 border-t border-[var(--fd-border)] pt-3"><dt className="text-[var(--fd-text-secondary)]">Subtotal</dt><dd className="tabular-nums">{money.format(Number(document.subtotalAmount ?? document.subtotal))}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--fd-text-secondary)]">{proForma ? 'IVA fiscal final' : 'IVA'}</dt><dd className="tabular-nums">{money.format(Number(document.ivaAmount ?? document.iva))}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--fd-text-secondary)]">Retenção fiscal final</dt><dd className="tabular-nums">{money.format(Number(document.withholdingTaxAmount ?? document.withholdingTax))}</dd></div><div className="flex justify-between gap-4 border-t border-[var(--fd-border)] pt-3 text-base font-semibold"><dt>{proForma ? 'Total estimado' : 'Total'}</dt><dd className="tabular-nums">{money.format(Number(document.totalAmount ?? document.total))}</dd></div></dl>{document.notes && <p className="mt-5 border-t border-[var(--fd-border)] pt-4 text-sm leading-6 text-[var(--fd-text-secondary)]">{document.notes}</p>}</aside></section>
        {!proForma && <ElectronicInvoicePanel invoiceId={document.id} />}
      </main>
      {confirming && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--fd-overlay)] p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="convert-title" className="w-full max-w-md rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[.12em] text-sky-700">Conversão</p><h2 id="convert-title" className="mt-2 text-lg font-semibold text-[var(--fd-text-primary)]">Converter em factura?</h2><p className="mt-3 text-sm leading-6 text-[var(--fd-text-secondary)]">Será criada uma factura normal com nova numeração FT. O backend recalculará IVA e retenção com as regras aplicáveis no momento da conversão.</p><div className="mt-5 flex justify-end gap-3"><button type="button" disabled={converting} onClick={() => setConfirming(false)} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold">Voltar</button><button type="button" disabled={converting} onClick={() => void convert()} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{converting && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar conversão</button></div></section></div>}
    </DashboardLayout>
  );
}
