'use client';

import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  createProduct,
  deleteProduct,
  getProductApiError,
  getProducts,
  Product,
  ProductInput,
  ProductPage,
  ProductUnit,
  updateProduct,
} from '@/services/product';

const unitLabels: Record<ProductUnit, string> = {
  UN: 'Unidade',
  SERVICO: 'Serviço',
  HORA: 'Hora',
  KG: 'Quilograma',
  L: 'Litro',
  M: 'Metro',
};

const money = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  minimumFractionDigits: 2,
});

export default function ProductsPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<ProductPage | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const [sort, setSort] = useState('name:asc');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [sortBy, sortDirection] = useMemo(() => sort.split(':'), [sort]);
  const canWrite = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  const canDelete = user?.role === 'OWNER' || user?.role === 'ADMIN';

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      getProducts({
        search: search || undefined,
        status,
        page,
        pageSize: 20,
        sortBy: sortBy as 'name' | 'price' | 'createdAt' | 'stock',
        sortDirection: sortDirection as 'asc' | 'desc',
      })
        .then((data) => active && setResult(data))
        .catch((requestError) => active && setError(getProductApiError(requestError, 'Não foi possível carregar o catálogo.')))
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

  async function confirmDelete() {
    if (!deleting) return;
    setError('');
    try {
      await deleteProduct(deleting.id);
      setDeleting(null);
      setNotice(`${deleting.name} foi removido do catálogo.`);
      setReload((value) => value + 1);
    } catch (requestError) {
      setDeleting(null);
      setError(getProductApiError(requestError, 'Não foi possível eliminar o produto.'));
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1500px]">
        <header className="flex flex-col gap-4 border-b border-[var(--fd-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Catálogo comercial</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fd-text-primary)] sm:text-3xl">Produtos e serviços</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--fd-text-secondary)]">Mantenha preços, IVA, unidades e disponibilidade num catálogo isolado para a sua empresa.</p>
          </div>
          {canWrite && <button type="button" onClick={() => setEditing('new')} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 text-xs font-semibold text-white hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"><Plus className="h-4 w-4" />Novo item</button>}
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo do catálogo">
          {([
            ['Total no catálogo', result?.summary.total ?? 0, Boxes],
            ['Itens activos', result?.summary.active ?? 0, Package],
            ['Itens inactivos', result?.summary.inactive ?? 0, Package],
          ] as Array<[string, number, LucideIcon]>).map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between"><p className="text-xs font-medium text-[var(--fd-text-secondary)]">{String(label)}</p><Icon className="h-4 w-4 text-sky-700" /></div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--fd-text-primary)]">{String(value)}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="grid gap-3 border-b border-[var(--fd-border)] p-4 md:grid-cols-[minmax(240px,1fr)_180px_210px]">
            <label className="relative block"><span className="sr-only">Pesquisar no catálogo</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fd-muted)]" /><input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Nome, código ou descrição" className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>
            <label><span className="sr-only">Filtrar por estado</span><select value={status} onChange={(event) => { setStatus(event.target.value as 'ACTIVE' | 'INACTIVE' | ''); resetPage(); }} className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"><option value="">Todos os estados</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select></label>
            <label><span className="sr-only">Ordenar catálogo</span><select value={sort} onChange={(event) => { setSort(event.target.value); resetPage(); }} className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"><option value="name:asc">Nome A–Z</option><option value="name:desc">Nome Z–A</option><option value="price:desc">Maior preço</option><option value="price:asc">Menor preço</option><option value="createdAt:desc">Mais recentes</option></select></label>
          </div>

          {notice && <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-medium text-emerald-800">{notice}</div>}
          {error && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-800">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]"><tr><th className="px-5 py-3 font-semibold">Item</th><th className="px-4 py-3 font-semibold">Preço</th><th className="px-4 py-3 font-semibold">IVA</th><th className="px-4 py-3 font-semibold">Stock / unidade</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-5 py-3 text-right font-semibold">Acções</th></tr></thead>
              <tbody className="divide-y divide-[var(--fd-border)]">
                {loading ? <tr><td colSpan={6} className="h-52 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-700" aria-label="A carregar produtos" /></td></tr> : result?.data.length ? result.data.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="flex items-start gap-3"><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><Package className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--fd-text-primary)]">{product.name}</p><p className="mt-0.5 text-[11px] text-[var(--fd-muted)]">{product.code || 'Sem código'}</p>{product.description && <p className="mt-1 max-w-sm truncate text-xs text-[var(--fd-text-secondary)]">{product.description}</p>}</div></div></td>
                    <td className="px-4 py-4 text-sm font-semibold tabular-nums text-[var(--fd-text-primary)]">{money.format(product.price)}</td>
                    <td className="px-4 py-4 text-xs tabular-nums text-[var(--fd-text-secondary)]">{product.ivaRate}%</td>
                    <td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]">{product.stock === null ? 'Não controlado' : `${product.stock} ${product.unit}`}<p className="mt-1 text-[11px] text-[var(--fd-muted)]">{unitLabels[product.unit]}</p></td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${product.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{product.isActive ? 'Activo' : 'Inactivo'}</span></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2">{canWrite && <button type="button" onClick={() => setEditing(product)} className="rounded-lg border border-[var(--fd-border)] p-2 text-[var(--fd-text-secondary)] hover:border-sky-300 hover:text-sky-800" aria-label={`Editar ${product.name}`}><Pencil className="h-4 w-4" /></button>}{canDelete && <button type="button" onClick={() => setDeleting(product)} className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50" aria-label={`Eliminar ${product.name}`}><Trash2 className="h-4 w-4" /></button>}</div></td>
                  </tr>
                )) : <tr><td colSpan={6} className="h-52 text-center text-sm text-[var(--fd-muted)]">Nenhum item corresponde aos filtros.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--fd-border)] px-5 py-4 text-xs text-[var(--fd-muted)] sm:flex-row sm:items-center sm:justify-between"><span>{result?.pagination.total ?? 0} resultado(s)</span><div className="flex items-center gap-2"><button type="button" disabled={!result || result.pagination.page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button><span>Página {result?.pagination.page ?? page} de {result?.pagination.totalPages ?? 1}</span><button type="button" disabled={!result || result.pagination.page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página seguinte"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>
      </main>

      {editing && <ProductModal product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(name) => { setEditing(null); setNotice(`${name} foi guardado com sucesso.`); setReload((value) => value + 1); }} />}
      {deleting && <ConfirmDelete product={deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </DashboardLayout>
  );
}

type ProductForm = { name: string; code: string; description: string; price: string; ivaRate: string; stock: string; unit: ProductUnit; isActive: boolean };

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: (name: string) => void }) {
  const [form, setForm] = useState<ProductForm>({ name: product?.name ?? '', code: product?.code ?? '', description: product?.description ?? '', price: product ? String(product.price) : '', ivaRate: product ? String(product.ivaRate) : '14', stock: product?.stock === null || product?.stock === undefined ? '' : String(product.stock), unit: product?.unit ?? 'UN', isActive: product?.isActive ?? true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const price = Number(form.price.replace(',', '.'));
    const ivaRate = Number(form.ivaRate.replace(',', '.'));
    const stock = form.stock === '' ? undefined : Number(form.stock.replace(',', '.'));
    if (!form.name.trim()) return setError('Indique o nome do produto ou serviço.');
    if (!Number.isFinite(price) || price < 0) return setError('Indique um preço válido.');
    if (!Number.isFinite(ivaRate) || ivaRate < 0 || ivaRate > 100) return setError('A taxa de IVA deve estar entre 0 e 100.');
    if (stock !== undefined && (!Number.isFinite(stock) || stock < 0)) return setError('O stock não pode ser negativo.');
    const input: ProductInput = { name: form.name.trim(), code: form.code.trim() || undefined, description: form.description.trim() || undefined, price, ivaRate, stock: form.stock === '' && product ? null : stock, unit: form.unit, isActive: form.isActive };
    setSaving(true);
    try {
      const saved = product ? await updateProduct(product.id, input) : await createProduct(input);
      onSaved(saved.name);
    } catch (requestError) {
      setError(getProductApiError(requestError, 'Não foi possível guardar o item.'));
    } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[var(--fd-overlay)] p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" className="my-6 w-full max-w-2xl rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-2xl"><div className="flex items-start justify-between border-b border-[var(--fd-border)] p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Catálogo</p><h2 id="product-dialog-title" className="mt-1 text-lg font-semibold text-[var(--fd-text-primary)]">{product ? 'Editar item' : 'Novo produto ou serviço'}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--fd-muted)] hover:bg-slate-100" aria-label="Fechar"><X className="h-4 w-4" /></button></div><form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
    <Field label="Nome" required><input value={form.name} onChange={(event) => set('name', event.target.value)} maxLength={180} required className="fd-field" /></Field>
    <Field label="Código"><input value={form.code} onChange={(event) => set('code', event.target.value)} maxLength={50} className="fd-field" /></Field>
    <Field label="Preço (AOA)" required><input value={form.price} onChange={(event) => set('price', event.target.value)} inputMode="decimal" required className="fd-field" /></Field>
    <Field label="Taxa de IVA (%)" required><input value={form.ivaRate} onChange={(event) => set('ivaRate', event.target.value)} inputMode="decimal" required className="fd-field" /></Field>
    <Field label="Unidade"><select value={form.unit} onChange={(event) => set('unit', event.target.value as ProductUnit)} className="fd-field">{Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
    <Field label="Stock (opcional)"><input value={form.stock} onChange={(event) => set('stock', event.target.value)} inputMode="decimal" placeholder="Sem controlo" className="fd-field" /></Field>
    <div className="sm:col-span-2"><Field label="Descrição"><textarea value={form.description} onChange={(event) => set('description', event.target.value)} maxLength={2000} rows={3} className="fd-field resize-none" /></Field></div>
    <label className="flex items-center gap-3 rounded-xl border border-[var(--fd-border)] p-4 sm:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(event) => set('isActive', event.target.checked)} className="h-4 w-4 accent-sky-700" /><span><span className="block text-sm font-semibold text-[var(--fd-text-primary)]">Disponível no catálogo</span><span className="text-xs text-[var(--fd-muted)]">Itens inactivos permanecem no histórico.</span></span></label>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:col-span-2">{error}</p>}
    <div className="flex justify-end gap-3 border-t border-[var(--fd-border)] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold">Cancelar</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</button></div>
  </form></section></div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-[var(--fd-text-primary)]">{label}{required && <span className="text-rose-600"> *</span>}<span className="mt-2 block [&_.fd-field]:h-11 [&_.fd-field]:w-full [&_.fd-field]:rounded-lg [&_.fd-field]:border [&_.fd-field]:border-[var(--fd-border)] [&_.fd-field]:bg-[var(--fd-input)] [&_.fd-field]:px-3 [&_.fd-field]:py-2 [&_.fd-field]:text-sm [&_.fd-field]:outline-none focus-within:[&_.fd-field]:border-sky-600 focus-within:[&_.fd-field]:ring-4 focus-within:[&_.fd-field]:ring-sky-100">{children}</span></label>; }

function ConfirmDelete({ product, onClose, onConfirm }: { product: Product; onClose: () => void; onConfirm: () => void }) { return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--fd-overlay)] p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" className="w-full max-w-md rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-2xl"><h2 id="delete-product-title" className="text-lg font-semibold text-[var(--fd-text-primary)]">Eliminar {product.name}?</h2><p className="mt-2 text-sm leading-6 text-[var(--fd-text-secondary)]">A eliminação só será permitida se o item não estiver associado a documentos. Para preservar o histórico, pode marcá-lo como inactivo.</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold">Cancelar</button><button type="button" onClick={onConfirm} className="rounded-lg bg-rose-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-800">Eliminar</button></div></section></div>; }
