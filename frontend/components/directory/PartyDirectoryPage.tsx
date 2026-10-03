'use client';

import { isAxiosError } from 'axios';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

type DirectoryKind = 'client' | 'supplier';

type DirectoryEntry = {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city?: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type DirectoryResult = {
  data: DirectoryEntry[];
  summary: { total: number; withEmail: number; withPhone: number };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type DirectoryForm = {
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
};

const EMPTY_FORM: DirectoryForm = {
  name: '',
  nif: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  notes: '',
};

const config = {
  client: {
    endpoint: '/clients',
    eyebrow: 'Relações comerciais',
    title: 'Clientes',
    singular: 'cliente',
    description: 'Organize contactos e identificação dos clientes usados na facturação da sua empresa.',
    Icon: Users,
  },
  supplier: {
    endpoint: '/suppliers',
    eyebrow: 'Compras e fornecedores',
    title: 'Fornecedores',
    singular: 'fornecedor',
    description: 'Mantenha os fornecedores usados nas facturas de compra e no acompanhamento operacional.',
    Icon: Truck,
  },
} as const;

function apiMessage(error: unknown, fallback: string) {
  if (!isAxiosError<{ message?: string | string[] }>(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(' ') : message || fallback;
}

export default function PartyDirectoryPage({ kind }: { kind: DirectoryKind }) {
  const copy = config[kind];
  const { user } = useAuth();
  const [result, setResult] = useState<DirectoryResult | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name:asc');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<DirectoryEntry | 'new' | null>(null);
  const [deleting, setDeleting] = useState<DirectoryEntry | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [sortBy, sortDirection] = useMemo(() => sort.split(':'), [sort]);
  const canWrite = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';
  const canDelete = user?.role === 'OWNER' || user?.role === 'ADMIN';

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      api
        .get<DirectoryResult>(copy.endpoint, {
          params: {
            page,
            pageSize: 20,
            sortBy,
            sortDirection,
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        })
        .then((response) => active && setResult(response.data))
        .catch((requestError) =>
          active && setError(apiMessage(requestError, `Não foi possível carregar os ${copy.title.toLowerCase()}.`)),
        )
        .finally(() => active && setLoading(false));
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [copy.endpoint, copy.title, page, reload, search, sortBy, sortDirection]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    setError('');
    try {
      await api.delete(`${copy.endpoint}/${deleting.id}`);
      setNotice(`${deleting.name} foi removido com sucesso.`);
      setDeleting(null);
      setReload((value) => value + 1);
    } catch (requestError) {
      setDeleting(null);
      setError(apiMessage(requestError, `Não foi possível eliminar o ${copy.singular}.`));
    } finally {
      setDeletingBusy(false);
    }
  }

  const cards = [
    { label: `Total de ${copy.title.toLowerCase()}`, value: result?.summary.total ?? 0, Icon: copy.Icon },
    { label: 'Com email', value: result?.summary.withEmail ?? 0, Icon: Mail },
    { label: 'Com telefone', value: result?.summary.withPhone ?? 0, Icon: Phone },
  ];

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1500px]">
        <header className="flex flex-col gap-4 border-b border-[var(--fd-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{copy.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fd-text-primary)] sm:text-3xl">{copy.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--fd-text-secondary)]">{copy.description}</p>
          </div>
          {canWrite && <button type="button" onClick={() => setEditing('new')} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 text-xs font-semibold text-white hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100"><Plus className="h-4 w-4" />Novo {copy.singular}</button>}
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label={`Resumo de ${copy.title.toLowerCase()}`}>
          {cards.map(({ label, value, Icon }) => <article key={label} className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-medium text-[var(--fd-text-secondary)]">{label}</p><Icon className="h-4 w-4 text-sky-700" /></div><p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--fd-text-primary)]">{value}</p></article>)}
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="grid gap-3 border-b border-[var(--fd-border)] p-4 md:grid-cols-[minmax(260px,1fr)_210px]">
            <label className="relative block"><span className="sr-only">Pesquisar {copy.title.toLowerCase()}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fd-muted)]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setNotice(''); }} placeholder="Nome, NIF, email ou telefone" className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>
            <label><span className="sr-only">Ordenar registos</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"><option value="name:asc">Nome A–Z</option><option value="name:desc">Nome Z–A</option><option value="createdAt:desc">Mais recentes</option><option value="createdAt:asc">Mais antigos</option></select></label>
          </div>
          {notice && <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-medium text-emerald-800">{notice}</div>}
          {error && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-800">{error}</div>}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]"><tr><th className="px-5 py-3 font-semibold">Identificação</th><th className="px-4 py-3 font-semibold">Contacto</th><th className="px-4 py-3 font-semibold">Morada</th><th className="px-4 py-3 font-semibold">Registo</th><th className="px-5 py-3 text-right font-semibold">Acções</th></tr></thead>
              <tbody className="divide-y divide-[var(--fd-border)]">{loading ? <LoadingRow columns={5} /> : result?.data.length ? result.data.map((entry) => <tr key={entry.id} className="align-top hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex gap-3"><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><copy.Icon className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-[var(--fd-text-primary)]">{entry.name}</p><p className="mt-1 text-[11px] text-[var(--fd-muted)]">NIF {entry.nif || 'não indicado'}</p></div></div></td><td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]"><p>{entry.email || 'Sem email'}</p><p className="mt-1">{entry.phone || 'Sem telefone'}</p></td><td className="max-w-xs px-4 py-4 text-xs text-[var(--fd-text-secondary)]">{entry.address || 'Não indicada'}</td><td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]">{new Date(entry.createdAt).toLocaleDateString('pt-AO')}</td><td className="px-5 py-4"><DirectoryActions entry={entry} canWrite={canWrite} canDelete={canDelete} onEdit={setEditing} onDelete={setDeleting} /></td></tr>) : <EmptyRow columns={5} label={`Nenhum ${copy.singular} corresponde à pesquisa.`} />}</tbody>
            </table>
          </div>

          <div className="divide-y divide-[var(--fd-border)] md:hidden">{loading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-sky-700" /></div> : result?.data.length ? result.data.map((entry) => <article key={entry.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--fd-text-primary)]">{entry.name}</p><p className="mt-1 text-xs text-[var(--fd-muted)]">NIF {entry.nif || 'não indicado'}</p></div><DirectoryActions entry={entry} canWrite={canWrite} canDelete={canDelete} onEdit={setEditing} onDelete={setDeleting} /></div><div className="mt-4 space-y-2 text-xs text-[var(--fd-text-secondary)]">{entry.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{entry.email}</p>}{entry.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{entry.phone}</p>}{entry.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{entry.address}</p>}</div></article>) : <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-[var(--fd-muted)]">Nenhum {copy.singular} corresponde à pesquisa.</div>}</div>

          <div className="flex flex-col gap-3 border-t border-[var(--fd-border)] px-5 py-4 text-xs text-[var(--fd-muted)] sm:flex-row sm:items-center sm:justify-between"><span>{result?.pagination.total ?? 0} resultado(s)</span><div className="flex items-center gap-2"><button type="button" disabled={!result || result.pagination.page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button><span>Página {result?.pagination.page ?? page} de {result?.pagination.totalPages ?? 1}</span><button type="button" disabled={!result || result.pagination.page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página seguinte"><ChevronRight className="h-4 w-4" /></button></div></div>
        </section>
      </main>

      {editing && <DirectoryModal endpoint={copy.endpoint} singular={copy.singular} entry={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={(name) => { setEditing(null); setNotice(`${name} foi guardado com sucesso.`); setReload((value) => value + 1); }} />}
      {deleting && <DeleteDialog entry={deleting} singular={copy.singular} busy={deletingBusy} onClose={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </DashboardLayout>
  );
}

function DirectoryActions({ entry, canWrite, canDelete, onEdit, onDelete }: { entry: DirectoryEntry; canWrite: boolean; canDelete: boolean; onEdit: (entry: DirectoryEntry) => void; onDelete: (entry: DirectoryEntry) => void }) {
  return <div className="flex justify-end gap-2">{canWrite && <button type="button" onClick={() => onEdit(entry)} className="rounded-lg border border-[var(--fd-border)] p-2 text-[var(--fd-text-secondary)] hover:border-sky-300 hover:text-sky-800" aria-label={`Editar ${entry.name}`}><Pencil className="h-4 w-4" /></button>}{canDelete && <button type="button" onClick={() => onDelete(entry)} className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50" aria-label={`Eliminar ${entry.name}`}><Trash2 className="h-4 w-4" /></button>}</div>;
}

function LoadingRow({ columns }: { columns: number }) { return <tr><td colSpan={columns} className="h-52 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-700" aria-label="A carregar" /></td></tr>; }
function EmptyRow({ columns, label }: { columns: number; label: string }) { return <tr><td colSpan={columns} className="h-52 text-center text-sm text-[var(--fd-muted)]">{label}</td></tr>; }

function DirectoryModal({ endpoint, singular, entry, onClose, onSaved }: { endpoint: string; singular: string; entry: DirectoryEntry | null; onClose: () => void; onSaved: (name: string) => void }) {
  const isClient = endpoint === '/clients';
  const [form, setForm] = useState<DirectoryForm>(entry ? { name: entry.name, nif: entry.nif ?? '', email: entry.email ?? '', phone: entry.phone ?? '', address: entry.address ?? '', city: entry.city ?? '', notes: entry.notes ?? '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof DirectoryForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Indique o nome.');
    const optional = (value: string) => entry ? value.trim() || null : value.trim() || undefined;
    const payload = { name: form.name.trim(), nif: optional(form.nif), email: optional(form.email), phone: optional(form.phone), address: optional(form.address), ...(isClient ? { city: optional(form.city) } : {}), notes: optional(form.notes) };
    setSaving(true);
    try {
      const response = entry ? await api.patch<DirectoryEntry>(`${endpoint}/${entry.id}`, payload) : await api.post<DirectoryEntry>(endpoint, payload);
      onSaved(response.data.name);
    } catch (requestError) {
      setError(apiMessage(requestError, `Não foi possível guardar o ${singular}.`));
    } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[var(--fd-overlay)] p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section role="dialog" aria-modal="true" aria-labelledby="directory-dialog-title" className="my-6 w-full max-w-2xl rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-2xl"><div className="flex items-start justify-between border-b border-[var(--fd-border)] p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Directório</p><h2 id="directory-dialog-title" className="mt-1 text-lg font-semibold text-[var(--fd-text-primary)]">{entry ? `Editar ${singular}` : `Novo ${singular}`}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--fd-muted)] hover:bg-slate-100" aria-label="Fechar"><X className="h-4 w-4" /></button></div><form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2"><Input label="Nome" required value={form.name} onChange={(value) => set('name', value)} maxLength={180} /><Input label="NIF" value={form.nif} onChange={(value) => set('nif', value)} maxLength={50} /><Input label="Email" type="email" value={form.email} onChange={(value) => set('email', value)} maxLength={254} /><Input label="Telefone" value={form.phone} onChange={(value) => set('phone', value)} maxLength={50} /><div className={isClient ? '' : 'sm:col-span-2'}><Input label="Morada" value={form.address} onChange={(value) => set('address', value)} maxLength={500} /></div>{isClient && <Input label="Cidade" value={form.city} onChange={(value) => set('city', value)} maxLength={120} />}<label className="block text-xs font-semibold text-[var(--fd-text-primary)] sm:col-span-2">Notas<textarea value={form.notes} onChange={(event) => set('notes', event.target.value)} maxLength={2000} rows={3} className="mt-2 w-full resize-none rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:col-span-2">{error}</p>}<div className="flex justify-end gap-3 border-t border-[var(--fd-border)] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold">Cancelar</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Guardar</button></div></form></section></div>;
}

function Input({ label, required, type = 'text', value, onChange, maxLength }: { label: string; required?: boolean; type?: string; value: string; onChange: (value: string) => void; maxLength: number }) { return <label className="block text-xs font-semibold text-[var(--fd-text-primary)]">{label}{required && <span className="text-rose-600"> *</span>}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} className="mt-2 h-11 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>; }

function DeleteDialog({ entry, singular, busy, onClose, onConfirm }: { entry: DirectoryEntry; singular: string; busy: boolean; onClose: () => void; onConfirm: () => void }) { return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--fd-overlay)] p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="directory-delete-title" className="w-full max-w-md rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-2xl"><h2 id="directory-delete-title" className="text-lg font-semibold text-[var(--fd-text-primary)]">Eliminar {entry.name}?</h2><p className="mt-2 text-sm leading-6 text-[var(--fd-text-secondary)]">O {singular} só pode ser eliminado quando não estiver associado a documentos existentes.</p><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold">Cancelar</button><button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Eliminar</button></div></section></div>; }
