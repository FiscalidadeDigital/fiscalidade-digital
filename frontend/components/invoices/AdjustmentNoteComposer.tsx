'use client';

import {
  AlertTriangle,
  ArrowLeft,
  FileMinus2,
  FilePlus2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { hasInvoiceLineItems } from '@/lib/invoice-adjustments';
import {
  createCreditNote,
  createDebitNote,
  getInvoice,
  getInvoiceApiError,
  type Invoice,
} from '@/services/invoice';

type AdjustmentKind = 'credit' | 'debit';

const money = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  minimumFractionDigits: 2,
});

function parseQuantity(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,4})?$/.test(normalized)) return null;
  const quantity = Number(normalized);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}

export default function AdjustmentNoteComposer({
  kind,
}: {
  kind: AdjustmentKind;
}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canCreate = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(
    user?.role ?? '',
  );
  const label = kind === 'credit' ? 'Nota de crédito' : 'Nota de débito';
  const Icon = kind === 'credit' ? FileMinus2 : FilePlus2;

  useEffect(() => {
    if (initialized && !canCreate) router.replace('/invoices');
  }, [canCreate, initialized, router]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getInvoice(id)
      .then((data) => {
        if (!active) return;
        const documentType = data.fiscalDocumentType ?? 'FT';
        if (
          data.documentType !== 'NORMAL' ||
          documentType !== 'FT' ||
          data.status === 'CANCELLED'
        ) {
          setError(
            'Esta operação só pode ser preparada a partir de uma factura activa.',
          );
          return;
        }
        setInvoice(data);
        setQuantities(
          Object.fromEntries(data.items.map((item) => [item.id, ''])),
        );
      })
      .catch((requestError) => {
        if (active)
          setError(
            getInvoiceApiError(
              requestError,
              'Não foi possível carregar a factura de origem.',
            ),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const selectedCount = useMemo(
    () =>
      Object.values(quantities).filter(
        (quantity) => parseQuantity(quantity) !== null,
      ).length,
    [quantities],
  );

  async function submit() {
    if (!invoice) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Indique o motivo da nota.');
      return;
    }

    const items = [] as Array<{
      sourceInvoiceItemId: string;
      quantity: number;
    }>;
    for (const item of invoice.items) {
      const quantity = parseQuantity(quantities[item.id] ?? '');
      if (quantity === null) continue;
      const available = Number(item.quantityAmount ?? item.quantity);
      if (quantity > available) {
        setError(
          `A quantidade de ${item.productName} não pode ultrapassar ${available}.`,
        );
        return;
      }
      items.push({ sourceInvoiceItemId: item.id, quantity });
    }
    if (!items.length) {
      setError('Indique uma quantidade para pelo menos uma linha.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const create = kind === 'credit' ? createCreditNote : createDebitNote;
      const note = await create({
        sourceInvoiceId: invoice.id,
        reason: trimmedReason,
        items,
      });
      router.replace(`/invoices/${note.id}`);
    } catch (requestError) {
      setError(
        getInvoiceApiError(
          requestError,
          `Não foi possível criar a ${label.toLowerCase()}.`,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || (initialized && !canCreate)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        A carregar documento…
      </div>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <main className="mx-auto max-w-3xl">
          <Link href="/invoices" className="text-sm font-semibold text-fd-accent">
            Voltar às facturas
          </Link>
          <p
            role="alert"
            className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error || 'Factura não encontrada.'}
          </p>
        </main>
      </DashboardLayout>
    );
  }

  if (!hasInvoiceLineItems(invoice)) {
    return (
      <DashboardLayout>
        <main className="mx-auto max-w-3xl">
          <Link
            href={`/invoices/${invoice.id}`}
            className="text-sm font-semibold text-fd-accent"
          >
            Voltar à factura
          </Link>
          <section
            role="alert"
            className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h1 className="font-semibold">
                Não é possível criar {label.toLowerCase()}
              </h1>
              <p className="mt-1">
                Esta factura não contém o detalhe dos artigos ou serviços
                necessário para emitir uma nota. Consulte o documento original
                antes de continuar.
              </p>
            </div>
          </section>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-5xl pb-12">
        <header className="flex flex-col gap-4 border-b border-[var(--fd-border)] pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push(`/invoices/${invoice.id}`)}
              className="mt-1 grid h-10 w-10 place-items-center rounded-lg border border-[var(--fd-border)] text-[var(--fd-text-secondary)] hover:bg-slate-50"
              aria-label="Voltar à factura"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fd-accent">
                Facturação
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--fd-text-primary)]">
                Criar {label.toLowerCase()}
              </h1>
              <p className="mt-1 text-sm text-[var(--fd-text-secondary)]">
                Factura de origem: {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-fd-accent-soft px-3 py-2 text-xs font-semibold text-fd-accent">
            <Icon className="h-4 w-4" />
            {label}
          </span>
        </header>

        <aside className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          A nota mantém a factura de origem intacta e regista apenas a correcção
          seleccionada abaixo. Ela não representa, por si só, um pagamento ou
          reembolso.
        </aside>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error}
          </p>
        )}

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="border-b border-[var(--fd-border)] p-5">
            <h2 className="font-semibold text-[var(--fd-text-primary)]">
              Linhas a corrigir
            </h2>
            <p className="mt-1 text-sm text-[var(--fd-text-secondary)]">
              Indique somente as quantidades abrangidas pela nota.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[var(--fd-table-header)] text-xs uppercase tracking-[0.08em] text-[var(--fd-muted)]">
                <tr>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-3 py-3 text-right">Disponível</th>
                  <th className="px-3 py-3 text-right">Preço</th>
                  <th className="px-3 py-3 text-right">Quantidade da nota</th>
                  <th className="px-5 py-3 text-right">Valor de referência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fd-border)]">
                {invoice.items.map((item) => {
                  const available = Number(item.quantityAmount ?? item.quantity);
                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-4 font-medium text-[var(--fd-text-primary)]">
                        {item.productName}
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums text-[var(--fd-text-secondary)]">
                        {available} {item.unit}
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums text-[var(--fd-text-secondary)]">
                        {money.format(Number(item.unitPriceAmount ?? item.unitPrice))}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <input
                          value={quantities[item.id] ?? ''}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          inputMode="decimal"
                          placeholder="0"
                          aria-label={`Quantidade de ${item.productName}`}
                          className="w-28 rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 py-2 text-right tabular-nums outline-none focus:border-fd-accent focus:ring-4 focus:ring-fd-focus"
                        />
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums text-[var(--fd-text-primary)]">
                        {money.format(Number(item.totalAmount ?? item.total))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <label className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 text-sm font-medium text-[var(--fd-text-primary)] shadow-sm">
            Motivo da nota
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={50}
              rows={4}
              placeholder="Ex.: Devolução parcial de mercadoria"
              className="mt-2 w-full resize-none rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 py-2.5 text-sm font-normal outline-none focus:border-fd-accent focus:ring-4 focus:ring-fd-focus"
            />
            <span className="mt-2 block text-xs font-normal text-[var(--fd-muted)]">
              {reason.length}/50 caracteres
            </span>
          </label>
          <aside className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-sm">
            <p className="font-semibold text-[var(--fd-text-primary)]">Resumo</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fd-text-secondary)]">Documento de origem</dt>
                <dd className="font-medium">{invoice.invoiceNumber}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fd-text-secondary)]">Linhas seleccionadas</dt>
                <dd className="font-medium">{selectedCount}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-[var(--fd-border)] pt-3">
                <dt className="text-[var(--fd-text-secondary)]">Cliente</dt>
                <dd className="text-right font-medium">{invoice.client.name}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.push(`/invoices/${invoice.id}`)}
            disabled={saving}
            className="rounded-lg border border-[var(--fd-border)] bg-[var(--fd-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--fd-text-primary)] hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || selectedCount === 0 || !reason.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-fd-primary-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {saving ? 'A criar…' : `Criar ${label.toLowerCase()}`}
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}
