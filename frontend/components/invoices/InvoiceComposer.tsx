'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  FileText,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import type { Tenant } from '@/services/auth';
import { getClients, type Client } from '@/services/client';
import { getCompany } from '@/services/company';
import {
  createInvoice,
  getInvoiceApiError,
  type Invoice,
} from '@/services/invoice';
import {
  getProducts,
  type Product,
  type ProductUnit,
} from '@/services/product';

type DraftItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  unit: ProductUnit;
};

const unitLabels: Record<ProductUnit, string> = {
  UN: 'Unidade',
  SERVICO: 'Serviço',
  HORA: 'Hora',
  KG: 'Quilograma',
  L: 'Litro',
  M: 'Metro',
};

function newItem(): DraftItem {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: '',
    productName: '',
    quantity: '1',
    unitPrice: '',
    unit: 'UN',
  };
}

function toScaledInteger(value: string, decimalPlaces: number) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > decimalPlaces) return null;
  const scaled = Number(`${whole}${fraction.padEnd(decimalPlaces, '0')}`);
  return Number.isSafeInteger(scaled) ? scaled : null;
}

function lineTotalCents(item: DraftItem) {
  const quantity = toScaledInteger(item.quantity, 4);
  const unitPrice = toScaledInteger(item.unitPrice, 2);
  if (quantity === null || unitPrice === null) return null;
  const raw = quantity * unitPrice;
  if (!Number.isSafeInteger(raw)) return null;
  return Math.round(raw / 10_000);
}

function formatCents(cents: number | null) {
  if (cents === null) return 'Calculado no servidor';
  return `${(cents / 100).toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Kz`;
}

export default function InvoiceComposer() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const canCreate = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(
    user?.role?.toUpperCase() ?? '',
  );

  const [company, setCompany] = useState<Tenant | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([newItem()]);
  const [notes, setNotes] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogReload, setCatalogReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [created, setCreated] = useState<Invoice | null>(null);

  useEffect(() => {
    if (initialized && !canCreate) router.replace('/invoices');
  }, [canCreate, initialized, router]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getCompany(), getClients()])
      .then(([companyData, clientData]) => {
        if (!active) return;
        setCompany(companyData);
        setClients(Array.isArray(clientData) ? clientData : []);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            getInvoiceApiError(
              loadError,
              'Não foi possível carregar a empresa e os clientes.',
            ),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setCatalogLoading(true);
      setCatalogError('');
      getProducts({
        page: 1,
        pageSize: 100,
        status: 'ACTIVE',
        search: catalogSearch.trim() || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      })
        .then((result) => {
          if (active) setProducts(result.data);
        })
        .catch((loadError: unknown) => {
          if (active) {
            setCatalogError(
              getInvoiceApiError(loadError, 'Não foi possível consultar o catálogo.'),
            );
          }
        })
        .finally(() => {
          if (active) setCatalogLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [catalogReload, catalogSearch]);

  const subtotalCents = useMemo(() => {
    let total = 0;
    for (const item of items) {
      const line = lineTotalCents(item);
      if (line === null || !Number.isSafeInteger(total + line)) return null;
      total += line;
    }
    return total;
  }, [items]);

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function selectProduct(itemId: string, productId: string) {
    const product = products.find((entry) => entry.id === productId);
    if (!product) {
      updateItem(itemId, { productId: '', productName: '', unitPrice: '', unit: 'UN' });
      return;
    }
    updateItem(itemId, {
      productId: product.id,
      productName: product.name,
      unitPrice: String(product.price),
      unit: product.unit,
    });
  }

  async function submit() {
    setError('');
    setCreated(null);
    if (!clientId) return setError('Seleccione um cliente.');
    if (items.length === 0) return setError('Adicione pelo menos um item.');

    for (const item of items) {
      const quantity = Number(item.quantity.replace(',', '.'));
      const unitPrice = Number(item.unitPrice.replace(',', '.'));
      if (!item.productName.trim()) return setError('Todos os itens precisam de descrição.');
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        return setError('Quantidade e preço devem ser valores positivos.');
      }
      if (toScaledInteger(item.quantity, 4) === null || toScaledInteger(item.unitPrice, 2) === null) {
        return setError('Use até quatro casas na quantidade e duas casas no preço.');
      }
    }

    setSaving(true);
    try {
      const invoice = await createInvoice({
        clientId,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId || undefined,
          productName: item.productName.trim(),
          quantity: Number(item.quantity.replace(',', '.')),
          unitPrice: Number(item.unitPrice.replace(',', '.')),
          unit: item.unit,
        })),
      });
      setCreated(invoice);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError: unknown) {
      setError(getInvoiceApiError(submitError, 'Não foi possível emitir a factura.'));
    } finally {
      setSaving(false);
    }
  }

  if ((initialized && !canCreate) || loading || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        {error || <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A carregar emissão…</>}
      </div>
    );
  }

  return (
    <DashboardLayout company={company}>
      <main className="mx-auto max-w-7xl space-y-6 pb-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => router.push('/invoices')} className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus:ring-sky-900/40" aria-label="Voltar às facturas">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">Facturação</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Emitir factura</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Registe o cliente e as linhas. Numeração, impostos e total são determinados pelo servidor.</p>
            </div>
          </div>
        </header>

        {created && (
          <section className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100" role="status">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Factura {created.invoiceNumber} registada</p><p className="mt-1 text-sm opacity-80">Total calculado pelo servidor: {formatCents(toScaledInteger(String(created.totalAmount ?? created.total), 2))}.</p></div></div>
            <button type="button" onClick={() => router.push('/invoices')} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Ver facturas</button>
          </section>
        )}

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" role="alert">{error}</div>}

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" /><div><p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Documento interno em validação fiscal</p><p className="mt-1 text-sm text-amber-800 dark:text-amber-200">A plataforma ainda não confirma certificação nem submissão electrónica à AGT. A classificação fiscal de cada artigo deve ser revista antes de uso oficial.</p></div></div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800"><h2 className="font-semibold text-slate-950 dark:text-white">Destinatário</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">O número da factura é atribuído automaticamente por empresa e ano.</p></div>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Cliente<span className="text-rose-600"> *</span>
              <select value={clientId} onChange={(event) => setClientId(event.target.value)} disabled={saving} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-900/40">
                <option value="">Seleccione o cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.nif ? ` — NIF ${client.nif}` : ''}</option>)}
              </select>
              {clients.length === 0 && <span className="mt-2 block text-xs text-amber-700 dark:text-amber-400">Crie primeiro um cliente no directório.</span>}
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Número</p><p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Gerado no servidor</p><p className="mt-1 text-xs text-slate-500">A sequência é protegida contra emissões concorrentes.</p></div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
            <div><h2 className="font-semibold text-slate-950 dark:text-white">Artigos e serviços</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Escolha no catálogo ou descreva uma linha livre.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative"><span className="sr-only">Pesquisar catálogo</span><PackageSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Pesquisar catálogo" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-64" /></label>
              <button type="button" onClick={() => setItems((current) => [...current, newItem()])} disabled={saving || items.length >= 500} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"><Plus className="h-4 w-4" />Adicionar linha</button>
            </div>
          </div>

          {catalogError && <div className="mx-5 mt-4 flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"><span>{catalogError}</span><button type="button" onClick={() => setCatalogReload((value) => value + 1)} className="rounded-md p-1 hover:bg-rose-100 dark:hover:bg-rose-900" aria-label="Tentar carregar o catálogo novamente"><RefreshCw className="h-4 w-4" /></button></div>}

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((item, index) => {
              const lineCents = lineTotalCents(item);
              return (
                <div key={item.id} className="p-5">
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linha {index + 1}</p><button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} disabled={saving || items.length === 1} className="rounded-md p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:hover:bg-rose-950/40" aria-label={`Remover linha ${index + 1}`}><Trash2 className="h-4 w-4" /></button></div>
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1.4fr_.55fr_.65fr_.8fr_.8fr]">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Origem<select value={item.productId} onChange={(event) => selectProduct(item.id, event.target.value)} disabled={saving || catalogLoading} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white"><option value="">Linha livre</option>{products.map((product) => <option key={product.id} value={product.id}>{product.code ? `${product.code} — ` : ''}{product.name}</option>)}</select></label>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Descrição<input value={item.productName} onChange={(event) => updateItem(item.id, { productName: event.target.value })} readOnly={Boolean(item.productId)} maxLength={200} placeholder="Ex.: Serviço de consultoria" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 read-only:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:read-only:bg-slate-800" /></label>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Quantidade<input value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} inputMode="decimal" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Unidade<select value={item.unit} onChange={(event) => updateItem(item.id, { unit: event.target.value as ProductUnit })} disabled={Boolean(item.productId)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-800">{Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Preço unitário<input value={item.unitPrice} onChange={(event) => updateItem(item.id, { unitPrice: event.target.value })} readOnly={Boolean(item.productId)} inputMode="decimal" placeholder="0,00" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 read-only:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:read-only:bg-slate-800" /></label>
                    <div><p className="text-xs font-medium text-slate-600 dark:text-slate-300">Subtotal da linha</p><div className="mt-1.5 flex min-h-[42px] items-center rounded-lg bg-slate-50 px-3 text-sm font-semibold text-slate-900 dark:bg-slate-950 dark:text-white">{formatCents(lineCents)}</div></div>
                  </div>
                  {item.productId && <p className="mt-2 text-xs text-slate-500">Descrição, unidade e preço serão novamente obtidos do catálogo da empresa pelo servidor.</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
          <label className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">Observações<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={6} placeholder="Informação adicional para este documento" className="mt-2 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-950 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-900/40" /></label>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><Calculator className="h-4 w-4" /></span><div><h2 className="font-semibold text-slate-950 dark:text-white">Pré-visualização</h2><p className="text-xs text-slate-500">Subtotal das linhas</p></div></div><p className="mt-6 text-2xl font-bold text-slate-950 dark:text-white">{formatCents(subtotalCents)}</p><p className="mt-3 text-xs leading-5 text-slate-500">IVA, retenção e total final são calculados no backend. Esta pré-visualização não é uma liquidação fiscal.</p></div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.push('/invoices')} disabled={saving} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Cancelar</button><button type="button" onClick={() => void submit()} disabled={saving || clients.length === 0 || Boolean(created)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}{saving ? 'A registar…' : 'Registar factura'}</button></div>
      </main>
    </DashboardLayout>
  );
}
