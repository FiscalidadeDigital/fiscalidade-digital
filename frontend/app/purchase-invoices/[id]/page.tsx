'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CreditCard, Pencil, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  addPurchaseInvoicePayment, cancelPurchaseInvoice, getPurchaseInvoice,
  rejectPurchaseInvoice, updatePurchaseInvoice, validatePurchaseInvoice, type PurchaseInvoice,
  type PurchaseInvoicePaymentMethod,
} from '@/services/purchase-invoice';
import { getSuppliers, type Supplier } from '@/services/supplier';

const documentLabels = { PENDING: 'Pendente', REVIEW_REQUIRED: 'Em revisão', VALIDATED: 'Validada', REJECTED: 'Rejeitada', CANCELLED: 'Cancelada' } as const;
const paymentLabels = { UNPAID: 'Por pagar', PARTIALLY_PAID: 'Parcialmente paga', PAID: 'Paga' } as const;
const methodLabels = { BANK_TRANSFER: 'Transferência bancária', MULTICAIXA_TPA: 'Multicaixa / TPA', CASH: 'Numerário', OTHER: 'Outro' } as const;
const money = (value: string | number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(Number(value));
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('pt-AO') : '—';
const errorMessage = (error: unknown) => {
  const candidate = error as { response?: { data?: { message?: string | string[] } } };
  const message = candidate.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message ?? 'Não foi possível concluir a operação.';
};

export default function PurchaseInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [draft, setDraft] = useState({ supplierId: '', invoiceNumber: '', issuedAt: '', dueDate: '', iva: '0', withholdingTax: '0', items: [] as Array<{ productName: string; quantity: string; unitPrice: string }> });
  const [reason, setReason] = useState('');
  const [payment, setPayment] = useState({ amount: '', paymentDate: new Date().toISOString().slice(0, 10), method: 'BANK_TRANSFER' as PurchaseInvoicePaymentMethod, reference: '', notes: '' });
  const canWrite = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(user?.role ?? '');
  const canReview = invoice && ['PENDING', 'REVIEW_REQUIRED'].includes(invoice.documentStatus);

  const load = useCallback(async () => {
    try { setError(''); setInvoice(await getPurchaseInvoice(id)); }
    catch (e) { setError(errorMessage(e)); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<PurchaseInvoice>) => {
    try { setBusy(true); setError(''); setInvoice(await action()); return true; }
    catch (e) { setError(errorMessage(e)); return false; }
    finally { setBusy(false); }
  };
  const openEdit = async () => {
    if (!invoice) return;
    setSuppliers(await getSuppliers());
    setDraft({ supplierId: invoice.supplierId, invoiceNumber: invoice.invoiceNumber, issuedAt: invoice.issuedAt.slice(0, 10), dueDate: invoice.dueDate?.slice(0, 10) ?? '', iva: String(invoice.iva), withholdingTax: String(invoice.withholdingTax), items: invoice.items.map(item => ({ productName: item.productName, quantity: String(item.quantity), unitPrice: String(item.unitPrice) })) });
    setEditOpen(true);
  };
  const totals = useMemo(() => ({ paid: Number(invoice?.paidAmount ?? 0), balance: Number(invoice?.balance ?? 0) }), [invoice]);

  return <DashboardLayout><main className="min-h-screen bg-[#f7f9fc] p-5 lg:p-8">
    <Link href="/purchase-invoices" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5146e5]"><ArrowLeft size={17}/>Voltar às facturas recebidas</Link>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {!invoice ? <div className="rounded-2xl border bg-white p-8 text-sm text-[#7180a0]">A carregar factura…</div> : <>
      <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#e5e9f1] bg-white p-6 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-[#7a86a0]">Factura recebida · {invoice.origin === 'OCR' ? 'OCR' : invoice.origin === 'IMPORT' ? 'Importação' : 'Manual'}</p><h1 className="mt-2 text-3xl font-bold text-[#0f1b3d]">{invoice.invoiceNumber}</h1><p className="mt-2 text-sm text-[#64708a]">{invoice.supplier.name} · {invoice.supplier.nif || 'NIF não informado'}</p></div>
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">{documentLabels[invoice.documentStatus]}</span><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{paymentLabels[invoice.paymentStatus]}</span></div>
      </header>

      {canWrite && <div className="mb-6 flex flex-wrap gap-3">
        {canReview && <><button disabled={busy} onClick={() => void openEdit()} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"><Pencil size={17}/>Editar</button><button disabled={busy} onClick={() => { if (window.confirm('Validar esta factura recebida?')) void run(() => validatePurchaseInvoice(id)); }} className="inline-flex items-center gap-2 rounded-xl bg-[#157f68] px-4 py-2.5 text-sm font-semibold text-white"><CheckCircle2 size={17}/>Validar factura</button><button disabled={busy} onClick={() => setRejectOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700"><XCircle size={17}/>Rejeitar</button></>}
        {invoice.documentStatus === 'VALIDATED' && totals.balance > 0 && <button disabled={busy} onClick={() => { setPayment((v) => ({ ...v, amount: String(totals.balance) })); setPaymentOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[#5146e5] px-4 py-2.5 text-sm font-semibold text-white"><CreditCard size={17}/>Registar pagamento</button>}
        {invoice.documentStatus === 'VALIDATED' && totals.paid === 0 && <button disabled={busy} onClick={() => { if (window.confirm('Cancelar esta factura validada?')) void run(() => cancelPurchaseInvoice(id)); }} className="rounded-xl border border-[#dfe4ee] bg-white px-4 py-2.5 text-sm font-semibold">Cancelar factura</button>}
      </div>}

      {invoice.rejectionReason && <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5"><h2 className="font-bold text-red-900">Motivo da rejeição</h2><p className="mt-2 text-sm text-red-800">{invoice.rejectionReason}</p></section>}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-[#e5e9f1] bg-white p-5"><h2 className="text-lg font-bold text-[#0f1b3d]">Linhas da factura</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b bg-[#fafbfe] text-left text-xs uppercase text-[#7a86a0]"><th className="p-3">Descrição</th><th className="p-3">Unidade</th><th className="p-3 text-right">Quantidade</th><th className="p-3 text-right">Preço unitário</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{invoice.items.map(item => <tr key={item.id} className="border-b last:border-0"><td className="p-3 font-medium">{item.productName}{item.product && <span className="block text-xs text-[#8792aa]">{item.product.name}</span>}</td><td className="p-3">{item.unit}</td><td className="p-3 text-right">{Number(item.quantity).toLocaleString('pt-AO')}</td><td className="p-3 text-right">{money(item.unitPrice)}</td><td className="p-3 text-right font-semibold">{money(item.total)}</td></tr>)}</tbody></table></div></section>
        <aside className="space-y-6"><section className="rounded-2xl border border-[#e5e9f1] bg-white p-5"><h2 className="font-bold text-[#0f1b3d]">Valores</h2>{[['Subtotal', invoice.subtotal], ['IVA indicado', invoice.iva], ['Retenção', invoice.withholdingTax], ['Total', invoice.total], ['Pago', invoice.paidAmount], ['Saldo', invoice.balance]].map(([label,value]) => <div key={label} className="flex justify-between border-b py-3 text-sm last:border-0"><span className="text-[#7180a0]">{label}</span><strong>{money(value)}</strong></div>)}</section><section className="rounded-2xl border border-[#e5e9f1] bg-white p-5"><h2 className="font-bold text-[#0f1b3d]">Datas e auditoria</h2><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-[#8792aa]">Emissão</dt><dd>{date(invoice.issuedAt)}</dd></div><div><dt className="text-[#8792aa]">Vencimento</dt><dd>{date(invoice.dueDate)}</dd></div><div><dt className="text-[#8792aa]">Registo</dt><dd>{date(invoice.createdAt)} · {invoice.createdBy?.name ?? 'Utilizador indisponível'}</dd></div>{invoice.validatedAt && <div><dt className="text-[#8792aa]">Validação</dt><dd>{date(invoice.validatedAt)} · {invoice.validatedBy?.name ?? 'Utilizador indisponível'}</dd></div>}</dl></section></aside>
      </div>

      <section className="mt-6 rounded-2xl border border-[#e5e9f1] bg-white p-5"><h2 className="text-lg font-bold text-[#0f1b3d]">Pagamentos</h2>{!invoice.payments?.length ? <p className="mt-4 text-sm text-[#7180a0]">Nenhum pagamento registado.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-[#7a86a0]"><th className="p-3">Data</th><th className="p-3">Método</th><th className="p-3">Referência</th><th className="p-3">Registado por</th><th className="p-3 text-right">Valor</th></tr></thead><tbody>{invoice.payments.map(item => <tr key={item.id} className="border-b last:border-0"><td className="p-3">{date(item.paymentDate)}</td><td className="p-3">{methodLabels[item.method]}</td><td className="p-3">{item.reference || '—'}</td><td className="p-3">{item.createdBy?.name ?? 'Utilizador indisponível'}<span className="block text-xs text-[#8792aa]">{new Date(item.createdAt).toLocaleString('pt-AO')}</span></td><td className="p-3 text-right font-semibold">{money(item.amount)}</td></tr>)}</tbody></table></div>}</section>
    </>}

    {rejectOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0f1b3d]/50 p-4"><form onSubmit={async e => { e.preventDefault(); if (await run(() => rejectPurchaseInvoice(id, reason))) { setRejectOpen(false); setReason(''); } }} className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Rejeitar factura</h2><label className="mt-5 block text-sm font-medium">Motivo obrigatório</label><textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border p-3"/><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setRejectOpen(false)} className="rounded-xl border px-4 py-2">Cancelar</button><button disabled={busy || !reason.trim()} className="rounded-xl bg-red-700 px-4 py-2 text-white">Confirmar rejeição</button></div></form></div>}
    {editOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0f1b3d]/50 p-4"><form onSubmit={async e => { e.preventDefault(); const ok = await run(() => updatePurchaseInvoice(id, { supplierId: draft.supplierId, invoiceNumber: draft.invoiceNumber, issuedAt: draft.issuedAt, dueDate: draft.dueDate || undefined, iva: Number(draft.iva), withholdingTax: Number(draft.withholdingTax), items: draft.items.map(item => ({ productName: item.productName, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })) })); if (ok) setEditOpen(false); }} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Rever dados da factura</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Fornecedor<select required value={draft.supplierId} onChange={e => setDraft(v => ({...v, supplierId:e.target.value}))} className="mt-2 w-full rounded-xl border p-3">{suppliers.map(item => <option key={item.id} value={item.id}>{item.name}{item.nif ? ` · ${item.nif}` : ''}</option>)}</select></label><label className="text-sm">Número<input required value={draft.invoiceNumber} onChange={e => setDraft(v => ({...v, invoiceNumber:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm">Data de emissão<input required type="date" value={draft.issuedAt} onChange={e => setDraft(v => ({...v, issuedAt:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm">Vencimento<input type="date" value={draft.dueDate} onChange={e => setDraft(v => ({...v, dueDate:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm">IVA indicado<input required min="0" step="0.01" type="number" value={draft.iva} onChange={e => setDraft(v => ({...v, iva:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm">Retenção<input required min="0" step="0.01" type="number" value={draft.withholdingTax} onChange={e => setDraft(v => ({...v, withholdingTax:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label></div><h3 className="mt-6 font-bold">Linhas</h3><div className="mt-3 space-y-3">{draft.items.map((item,index) => <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_120px_160px]"><input required aria-label="Descrição" value={item.productName} onChange={e => setDraft(v => ({...v,items:v.items.map((entry,i) => i === index ? {...entry,productName:e.target.value}:entry)}))} className="rounded-lg border p-2"/><input required aria-label="Quantidade" min="0.001" step="0.001" type="number" value={item.quantity} onChange={e => setDraft(v => ({...v,items:v.items.map((entry,i) => i === index ? {...entry,quantity:e.target.value}:entry)}))} className="rounded-lg border p-2"/><input required aria-label="Preço unitário" min="0" step="0.01" type="number" value={item.unitPrice} onChange={e => setDraft(v => ({...v,items:v.items.map((entry,i) => i === index ? {...entry,unitPrice:e.target.value}:entry)}))} className="rounded-lg border p-2"/></div>)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditOpen(false)} className="rounded-xl border px-4 py-2">Cancelar</button><button disabled={busy} className="rounded-xl bg-[#5146e5] px-4 py-2 text-white">Guardar revisão</button></div></form></div>}
    {paymentOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0f1b3d]/50 p-4"><form onSubmit={async e => { e.preventDefault(); if (Number(payment.amount) > totals.balance) { setError('O pagamento não pode exceder o saldo por pagar.'); return; } if (await run(() => addPurchaseInvoicePayment(id, { amount: Number(payment.amount), paymentDate: payment.paymentDate, method: payment.method, reference: payment.reference || undefined, notes: payment.notes || undefined }))) setPaymentOpen(false); }} className="w-full max-w-lg rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Registar pagamento</h2><p className="mt-2 text-sm text-[#7180a0]">Saldo actual: {money(totals.balance)}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Valor<input required min="0.01" max={totals.balance} step="0.01" type="number" value={payment.amount} onChange={e => setPayment(v => ({...v, amount:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm">Data<input required type="date" value={payment.paymentDate} onChange={e => setPayment(v => ({...v, paymentDate:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm sm:col-span-2">Método<select value={payment.method} onChange={e => setPayment(v => ({...v, method:e.target.value as PurchaseInvoicePaymentMethod}))} className="mt-2 w-full rounded-xl border p-3">{Object.entries(methodLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm sm:col-span-2">Referência<input value={payment.reference} onChange={e => setPayment(v => ({...v, reference:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label><label className="text-sm sm:col-span-2">Observação<textarea value={payment.notes} onChange={e => setPayment(v => ({...v, notes:e.target.value}))} className="mt-2 w-full rounded-xl border p-3"/></label></div><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setPaymentOpen(false)} className="rounded-xl border px-4 py-2">Cancelar</button><button disabled={busy || Number(payment.amount) <= 0} className="rounded-xl bg-[#5146e5] px-4 py-2 text-white">Registar</button></div></form></div>}
  </main></DashboardLayout>;
}
