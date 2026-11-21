'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
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
  validateCreditNote,
  validateDebitNote,
  type AdjustmentValidation,
  type CreateAdjustmentNoteInput,
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

function parseUnitPrice(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const unitPrice = Number(normalized);
  return Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : null;
}

function createOperationId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    },
  );
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
  const [unitPrices, setUnitPrices] = useState<Record<string, string>>({});
  const [operationId] = useState(createOperationId);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState<AdjustmentValidation | null>(
    null,
  );
  const [checkingValidation, setCheckingValidation] = useState(false);
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
        setUnitPrices(
          Object.fromEntries(
            data.items.map((item) => [
              item.id,
              String(item.unitPriceAmount ?? item.unitPrice),
            ]),
          ),
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

  const selectedItems = useMemo(() => {
    if (!invoice) return [];

    return invoice.items.flatMap((item) => {
      const quantity = parseQuantity(quantities[item.id] ?? '');
      const unitPrice = parseUnitPrice(unitPrices[item.id] ?? '');
      return quantity === null || unitPrice === null
        ? []
        : [{ sourceInvoiceItemId: item.id, quantity, unitPrice }];
    });
  }, [invoice, quantities, unitPrices]);

  const adjustmentInput = useMemo<CreateAdjustmentNoteInput | null>(() => {
    const trimmedReason = reason.trim();
    if (!invoice || !trimmedReason || selectedItems.length === 0) return null;

    return {
      operationId,
      sourceInvoiceId: invoice.id,
      reason: trimmedReason,
      items: selectedItems,
    };
  }, [invoice, operationId, reason, selectedItems]);

  const selectedCount = selectedItems.length;
  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + item.quantity * (item.unitPrice ?? 0),
        0,
      ),
    [selectedItems],
  );

  useEffect(() => {
    if (!adjustmentInput) {
      setValidation(null);
      setCheckingValidation(false);
      return;
    }

    let active = true;
    setCheckingValidation(true);
    const timer = window.setTimeout(() => {
      const validate =
        kind === 'credit' ? validateCreditNote : validateDebitNote;

      validate(adjustmentInput)
        .then((result) => {
          if (active) setValidation(result);
        })
        .catch(() => {
          if (active) {
            setValidation({
              status: 'REVIEW_REQUIRED',
              canCreate: false,
              message:
                'Não foi possível concluir a validação automática. Tente novamente.',
              checks: [],
            });
          }
        })
        .finally(() => {
          if (active) setCheckingValidation(false);
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [adjustmentInput, kind]);

  async function submit() {
    if (!adjustmentInput) {
      setError('Indique o motivo e uma quantidade para pelo menos uma linha.');
      return;
    }
    if (!validation?.canCreate) {
      setError(
        validation?.message ??
          'A validação automática precisa de ser concluída antes de emitir a nota.',
      );
      return;
    }

    setSaving(true);
    setError('');
    try {
      const create = kind === 'credit' ? createCreditNote : createDebitNote;
      const note = await create(adjustmentInput);
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
                Validação automática — recuperação necessária
              </h1>
              <p className="mt-1">
                Esta factura não contém o detalhe dos artigos ou serviços
                necessário para emitir {label.toLowerCase()}. Recupere o
                documento original ou solicite a validação do respectivo
                arquivo antes de continuar. A factura já emitida não será
                alterada.
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

        <section
          aria-live="polite"
          className={`mt-5 rounded-xl border p-4 text-sm leading-6 ${
            validation?.canCreate
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : validation?.status === 'RECOVERY_REQUIRED'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          <div className="flex gap-3">
            {checkingValidation ? (
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
            ) : validation?.canCreate ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div>
              <h2 className="font-semibold">Validação automática</h2>
              <p className="mt-1">
                {checkingValidation
                  ? 'A confirmar os dados da nota…'
                  : validation?.message ??
                    'Indique o motivo e pelo menos uma quantidade para o sistema validar a nota.'}
              </p>
            </div>
          </div>
          {validation?.checks.length ? (
            <ul className="mt-3 grid gap-1 border-t border-current/15 pt-3 text-xs sm:grid-cols-2">
              {validation.checks.map((check) => (
                <li key={check.label} className="flex items-center gap-2">
                  {check.passed ? '✓' : '•'} {check.label}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

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
              {kind === 'credit'
                ? 'Indique a quantidade e o valor a creditar. O sistema confirma o saldo ainda disponível antes da emissão.'
                : 'Indique a quantidade e o valor adicional por unidade. O sistema confirma a origem, os impostos e o cálculo antes da emissão.'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[var(--fd-table-header)] text-xs uppercase tracking-[0.08em] text-[var(--fd-muted)]">
                <tr>
                  <th className="px-5 py-3">Descrição</th>
                  <th className="px-3 py-3 text-right">Disponível</th>
                  <th className="px-3 py-3 text-right">Preço na factura</th>
                  <th className="px-3 py-3 text-right">
                    {kind === 'credit'
                      ? 'Valor a creditar / un.'
                      : 'Valor adicional / un.'}
                  </th>
                  <th className="px-3 py-3 text-right">Quantidade da nota</th>
                  <th className="px-5 py-3 text-right">Valor da nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fd-border)]">
                {invoice.items.map((item) => {
                  const available = Number(item.quantityAmount ?? item.quantity);
                  const selectedQuantity = parseQuantity(quantities[item.id] ?? '');
                  const selectedUnitPrice = parseUnitPrice(unitPrices[item.id] ?? '');
                  const lineTotal =
                    selectedQuantity !== null && selectedUnitPrice !== null
                      ? selectedQuantity * selectedUnitPrice
                      : null;
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
                          value={unitPrices[item.id] ?? ''}
                          onChange={(event) =>
                            setUnitPrices((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          inputMode="decimal"
                          placeholder="0,00"
                          aria-label={`${
                            kind === 'credit'
                              ? 'Valor a creditar'
                              : 'Valor adicional'
                          } de ${item.productName}`}
                          className="w-32 rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 py-2 text-right tabular-nums outline-none focus:border-fd-accent focus:ring-4 focus:ring-fd-focus"
                        />
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
                        {lineTotal === null ? '—' : money.format(lineTotal)}
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
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--fd-text-secondary)]">
                  Valor da nota antes de impostos
                </dt>
                <dd className="font-medium tabular-nums">
                  {money.format(selectedSubtotal)}
                </dd>
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
            disabled={
              saving ||
              checkingValidation ||
              !adjustmentInput ||
              validation?.canCreate !== true
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-fd-primary-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {saving
              ? 'A criar…'
              : checkingValidation
                ? 'A validar…'
                : `Criar ${label.toLowerCase()}`}
          </button>
        </div>
      </main>
    </DashboardLayout>
  );
}
