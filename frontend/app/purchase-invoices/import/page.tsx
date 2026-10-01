'use client';

import { AlertTriangle, ArrowLeft, CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getInvoiceApiError } from '@/services/invoice';
import { getSuppliers, type Supplier } from '@/services/supplier';
import { downloadDocument, uploadDocument } from '@/services/document';
import {
  confirmPurchaseInvoiceImport,
  createPurchaseInvoiceImport,
  type PurchaseInvoiceImport,
} from '@/services/purchase-invoice-import';

const numberValue = (value: string) => Number(value.replace(',', '.'));

export default function PurchaseInvoiceImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [record, setRecord] = useState<PurchaseInvoiceImport | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [iva, setIva] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ id: string; invoiceNumber: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const subtotal = useMemo(() => numberValue(quantity) * numberValue(unitPrice), [quantity, unitPrice]);

  useEffect(() => {
    let active = true;
    let url: string | null = null;
    if (record) {
      void downloadDocument(record.document.id)
        .then((file) => {
          if (!active) return;
          url = URL.createObjectURL(file);
          setPreviewUrl(url);
        })
        .catch(() => active && setPreviewUrl(null));
    } else setPreviewUrl(null);
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [record]);

  async function startImport() {
    if (!file) return setError('Seleccione um PDF, imagem ou fotografia da factura recebida.');
    setBusy(true); setError('');
    try {
      const document = await uploadDocument({ file, category: 'FACTURA', name: file.name });
      const created = await createPurchaseInvoiceImport(document.id);
      setRecord(created);
      const supplierList = await getSuppliers();
      setSuppliers(supplierList);
    } catch (requestError) {
      setError(getInvoiceApiError(requestError, 'Não foi possível preparar o documento para revisão.'));
    } finally { setBusy(false); }
  }

  async function confirm() {
    if (!record) return;
    if (!supplierId || !invoiceNumber.trim() || !issuedAt || !description.trim() || !(numberValue(quantity) > 0) || !(numberValue(unitPrice) >= 0) || !(numberValue(iva) >= 0)) {
      setError('Preencha fornecedor, número, data, linha e valores válidos antes de confirmar.');
      return;
    }
    setBusy(true); setError('');
    try {
      const purchase = await confirmPurchaseInvoiceImport(record.id, {
        supplierId,
        invoiceNumber: invoiceNumber.trim(),
        issuedAt,
        dueDate: dueDate || undefined,
        iva: numberValue(iva),
        withholdingTax: 0,
        notes: 'Registada através de importação com revisão manual.',
        items: [{ productName: description.trim(), quantity: numberValue(quantity), unitPrice: numberValue(unitPrice) }],
      });
      setSuccess({ id: purchase.id, invoiceNumber: purchase.invoiceNumber });
    } catch (requestError) {
      setError(getInvoiceApiError(requestError, 'Não foi possível confirmar a factura recebida.'));
    } finally { setBusy(false); }
  }

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl pb-12">
    <header className="flex items-start gap-3 border-b border-[var(--fd-border)] pb-6"><Link href="/purchase-invoices" className="mt-1 grid h-10 w-10 place-items-center rounded-lg border border-[var(--fd-border)] text-[var(--fd-text-secondary)] hover:bg-slate-50" aria-label="Voltar às facturas recebidas"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-sky-700">Facturas recebidas</p><h1 className="mt-2 text-2xl font-semibold text-[var(--fd-text-primary)]">Importar documento</h1><p className="mt-1 text-sm text-[var(--fd-text-secondary)]">Carregue o original privado e confirme manualmente os dados antes de criar a factura.</p></div></header>
    <aside className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p>Dados extraídos devem ser revistos antes da confirmação. Não existe OCR configurado neste ambiente; nenhum valor é inferido ou validado automaticamente.</p></aside>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {success ? <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950"><div className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0" /><div><p className="font-semibold">Factura recebida {success.invoiceNumber} registada</p><p className="mt-1 text-sm">O documento original permanece privado e associado ao registo.</p><Link href="/purchase-invoices" className="mt-4 inline-block text-sm font-semibold underline underline-offset-2">Abrir facturas recebidas</Link></div></div></section> : !record ? <section className="mt-6 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-6 shadow-sm"><h2 className="font-semibold text-[var(--fd-text-primary)]">1. Carregar documento</h2><p className="mt-1 text-sm text-[var(--fd-text-secondary)]">PDF, imagem ou fotografia. O ficheiro será guardado no armazenamento privado da empresa.</p><label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center hover:border-sky-400 hover:bg-sky-50"><FileUp className="h-7 w-7 text-sky-700" /><span className="mt-3 text-sm font-semibold text-slate-800">{file?.name || 'Seleccionar documento'}</span><span className="mt-1 text-xs text-slate-500">PDF, JPEG, PNG ou WebP</span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><div className="mt-5 flex justify-end"><button type="button" disabled={busy || !file} onClick={() => void startImport()} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Preparar revisão</button></div></section> : <section className="mt-6 grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><aside className="overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm"><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-sky-700">2. Documento privado</p><p className="mt-3 break-all text-sm font-semibold text-[var(--fd-text-primary)]">{record.document.originalName}</p><p className="mt-2 text-xs text-[var(--fd-text-secondary)]">Em revisão manual · sem dados OCR propostos</p></div>{previewUrl && record.document.mimeType === 'application/pdf' && <iframe title="Pré-visualização do documento privado" src={previewUrl} className="h-[520px] w-full border-t border-[var(--fd-border)]" />}{previewUrl && record.document.mimeType.startsWith('image/') && <img src={previewUrl} alt="Pré-visualização do documento privado" className="max-h-[520px] w-full border-t border-[var(--fd-border)] object-contain" />}</aside><div className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[.12em] text-sky-700">3. Rever e confirmar</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Fornecedor<select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm"><option value="">Seleccione</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}{supplier.nif ? ` · ${supplier.nif}` : ''}</option>)}</select></label><label className="text-sm font-medium">Número da factura<input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm" /></label><label className="text-sm font-medium">Data de emissão<input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm" /></label><label className="text-sm font-medium">Vencimento<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm" /></label><label className="text-sm font-medium sm:col-span-2">Descrição<input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm" /></label><label className="text-sm font-medium">Quantidade<input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm" /></label><label className="text-sm font-medium">Preço unitário<input inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm" /></label><label className="text-sm font-medium">IVA suportado indicado<input inputMode="decimal" value={iva} onChange={(e) => setIva(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm" /></label><div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500">Base calculada na interface</p><p className="mt-1 font-semibold tabular-nums">{Number.isFinite(subtotal) ? subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) : '—'} Kz</p></div></div><div className="mt-5 flex justify-end"><button type="button" disabled={busy} onClick={() => void confirm()} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar factura recebida</button></div></div></section>}
  </main></DashboardLayout>;
}
