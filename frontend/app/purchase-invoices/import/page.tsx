'use client';

import { AlertTriangle, ArrowLeft, CheckCircle2, FileUp, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { downloadDocument, uploadDocument } from '@/services/document';
import { getInvoiceApiError } from '@/services/invoice';
import { confirmPurchaseInvoiceImport, createPurchaseInvoiceImport, type PurchaseInvoiceImport } from '@/services/purchase-invoice-import';
import { getSuppliers, type Supplier } from '@/services/supplier';

type ReviewItem = { id: string; description: string; quantity: string; unitPrice: string; lineTotal?: string; productCode?: string };
const blankItem = (): ReviewItem => ({ id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' });
const numberValue = (value: string) => Number(value.replace(',', '.'));
const normalize = (value?: string | null) => (value || '').replace(/\W/g, '').toUpperCase();

export default function PurchaseInvoiceImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [record, setRecord] = useState<PurchaseInvoiceImport | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [iva, setIva] = useState('0');
  const [items, setItems] = useState<ReviewItem[]>([blankItem()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ id: string; invoiceNumber: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const editableSubtotal = useMemo(() => items.reduce((sum, item) => sum + (numberValue(item.quantity) * numberValue(item.unitPrice) || 0), 0), [items]);
  const candidate = record?.candidateData;
  const reconciliationWarning = candidate?.reconciliation?.status === 'MISMATCH' || candidate?.reconciliation?.status === 'INCOMPLETE';
  const detectedSupplier = [candidate?.supplierName, candidate?.supplierNif].filter(Boolean).join(' · ');

  useEffect(() => {
    let active = true; let url: string | null = null;
    if (record) void downloadDocument(record.document.id).then((blob) => { if (active) { url = URL.createObjectURL(blob); setPreviewUrl(url); } }).catch(() => active && setPreviewUrl(null));
    else setPreviewUrl(null);
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [record]);

  useEffect(() => {
    if (!candidate) return;
    setInvoiceNumber(candidate.invoiceNumber || ''); setIssuedAt(candidate.issuedAt?.slice(0, 10) || ''); setDueDate(candidate.dueDate?.slice(0, 10) || ''); setIva(candidate.vatSupported || '0');
    const extracted = candidate.items?.filter((item) => item.description || item.quantity || item.unitPrice).map((item) => ({ id: crypto.randomUUID(), description: item.description || '', quantity: item.quantity || '1', unitPrice: item.unitPrice || '', lineTotal: item.lineTotal || undefined, productCode: item.productCode || undefined }));
    if (extracted?.length) setItems(extracted);
  }, [candidate]);

  useEffect(() => {
    if (supplierId || !candidate || !suppliers.length) return;
    const nif = normalize(candidate.supplierNif);
    const nifMatches = nif ? suppliers.filter((supplier) => normalize(supplier.nif) === nif) : [];
    const name = normalize(candidate.supplierName);
    const nameMatches = !nifMatches.length && name ? suppliers.filter((supplier) => normalize(supplier.name) === name) : [];
    const match = nifMatches.length === 1 ? nifMatches[0] : nameMatches.length === 1 ? nameMatches[0] : null;
    if (match) setSupplierId(match.id);
  }, [candidate, suppliers, supplierId]);

  async function startImport() {
    if (!file) { setError('Seleccione um PDF, imagem ou fotografia da factura recebida.'); return; }
    setBusy(true); setError('');
    try { const document = await uploadDocument({ file, category: 'FACTURA', name: file.name }); const [created, supplierList] = await Promise.all([createPurchaseInvoiceImport(document.id), getSuppliers()]); setRecord(created); setSuppliers(supplierList); }
    catch (requestError) { setError(getInvoiceApiError(requestError, 'Não foi possível preparar o documento para revisão.')); }
    finally { setBusy(false); }
  }

  function updateItem(id: string, field: keyof ReviewItem, value: string) { setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: value } : item)); }
  async function confirm() {
    if (!record || !supplierId || !invoiceNumber.trim() || !issuedAt || !Number.isFinite(numberValue(iva)) || numberValue(iva) < 0 || !items.length || items.some((item) => !item.description.trim() || !(numberValue(item.quantity) > 0) || !(numberValue(item.unitPrice) >= 0))) { setError('Revise fornecedor, número, data, IVA e todas as linhas antes de confirmar.'); return; }
    setBusy(true); setError('');
    try { const purchase = await confirmPurchaseInvoiceImport(record.id, { supplierId, invoiceNumber: invoiceNumber.trim(), issuedAt, dueDate: dueDate || undefined, iva: numberValue(iva), withholdingTax: 0, notes: 'Registada através de importação com revisão humana.', items: items.map((item) => ({ productName: item.description.trim(), quantity: numberValue(item.quantity), unitPrice: numberValue(item.unitPrice) })) }); setSuccess({ id: purchase.id, invoiceNumber: purchase.invoiceNumber }); }
    catch (requestError) { setError(getInvoiceApiError(requestError, 'Não foi possível confirmar a factura recebida.')); }
    finally { setBusy(false); }
  }

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl pb-12">
    <header className="flex items-start gap-3 border-b border-[var(--fd-border)] pb-6"><Link href="/purchase-invoices" className="mt-1 grid h-10 w-10 place-items-center rounded-lg border border-[var(--fd-border)]" aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-sky-700">Facturas recebidas</p><h1 className="mt-2 text-2xl font-semibold">Importar documento</h1><p className="mt-1 text-sm text-[var(--fd-text-secondary)]">O documento mantém-se privado. Toda extracção exige revisão humana.</p></div></header>
    <aside className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" /><p>{candidate ? 'Dados extraídos automaticamente · revisão obrigatória antes de registar a factura.' : 'Sem dados OCR propostos. Preencha os campos a partir do documento original.'}</p></aside>
    {reconciliationWarning && <aside role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Os itens extraídos não reconciliam com os totais do documento. Reveja os valores antes de confirmar.</aside>}
    {candidate?.reconciliation && <p className="mt-3 text-sm text-[var(--fd-text-secondary)]">Soma das linhas OCR: <span className="font-semibold tabular-nums text-[var(--fd-text-primary)]">{candidate.reconciliation.lineTotal || 'não indicada'} Kz</span> · {candidate.reconciliation.status === 'MATCHED' ? 'Reconciliado com a base indicada' : 'Diferença detectada — revisão obrigatória'}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {success ? <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="inline h-5 w-5" /> Factura recebida {success.invoiceNumber} registada. <Link href="/purchase-invoices" className="font-semibold underline">Abrir lista</Link></section> : !record ? <section className="mt-6 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-6"><h2 className="font-semibold">1. Carregar documento</h2><label className="mt-5 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12"><FileUp className="h-7 w-7 text-sky-700" /><span className="mt-3 text-sm font-semibold">{file?.name || 'Seleccionar documento'}</span><input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><div className="mt-5 flex justify-end"><button type="button" disabled={busy || !file} onClick={() => void startImport()} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Preparar revisão</button></div></section> : <section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <aside className="overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)]"><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-sky-700">Documento original</p><p className="mt-3 break-all text-sm font-semibold">{record.document.originalName}</p><p className="mt-2 text-xs text-[var(--fd-text-secondary)]">{candidate ? 'Dados extraídos automaticamente · revisão obrigatória' : 'Revisão manual'}</p></div>{previewUrl && record.document.mimeType === 'application/pdf' && <iframe title="Documento privado" src={previewUrl} className="h-[520px] w-full border-t" />}{previewUrl && record.document.mimeType.startsWith('image/') && <img src={previewUrl} alt="Documento privado" className="max-h-[520px] w-full border-t object-contain" />}</aside>
      <div className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5"><p className="text-xs font-semibold uppercase tracking-[.12em] text-sky-700">Dados extraídos e revisão</p>{detectedSupplier && !supplierId && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Fornecedor detectado: {detectedSupplier}. Seleccione ou crie o fornecedor antes de confirmar.</p>}<div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Fornecedor<select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border bg-[var(--fd-input)] px-3"><option value="">Seleccione</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}{supplier.nif ? ` · ${supplier.nif}` : ''}</option>)}</select></label><label className="text-sm font-medium">Número da factura<input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border px-3" /></label><label className="text-sm font-medium">Data de emissão<input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border px-3" /></label><label className="text-sm font-medium">Vencimento<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border px-3" /></label><label className="text-sm font-medium">IVA suportado indicado<input inputMode="decimal" value={iva} onChange={(e) => setIva(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border px-3" /></label><div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-xs text-slate-500">Base calculada pelas linhas</p><p className="mt-1 font-semibold tabular-nums">{Number.isFinite(editableSubtotal) ? editableSubtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) : '—'} Kz</p><p className="mt-1 text-xs text-slate-500">Documento: base {candidate?.subtotal || 'não indicada'} · total {candidate?.total || 'não indicado'}</p></div></div>
      <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Itens</h2><button type="button" onClick={() => setItems((current) => [...current, blankItem()])} className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700"><Plus className="h-4 w-4" />Adicionar linha</button></div><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[620px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-3">Descrição</th><th className="p-3">Quantidade</th><th className="p-3">Preço unitário</th><th className="p-3">Total indicado</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="p-2"><input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="w-full rounded border px-2 py-1.5" /></td><td className="p-2"><input value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="w-20 rounded border px-2 py-1.5" /></td><td className="p-2"><input value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} className="w-28 rounded border px-2 py-1.5" /></td><td className="p-2 tabular-nums">{item.lineTotal || '—'}</td><td className="p-2"><button type="button" aria-label="Remover linha" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="text-rose-700 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></div>
      <div className="mt-5 flex justify-end"><button type="button" disabled={busy} onClick={() => void confirm()} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Confirmar factura recebida</button></div></div>
    </section>}</main></DashboardLayout>;
}
