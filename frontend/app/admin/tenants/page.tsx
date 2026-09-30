'use client';

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import AdminShell from '@/components/admin/AdminShell';
import {
  AdminPlanType,
  AdminTenant,
  AdminTenantList,
  AdminTenantStatus,
  getAdminTenants,
  updateAdminTenantStatus,
} from '@/services/admin-api';

const KIBIBYTE = BigInt(1024);
const MEBIBYTE = KIBIBYTE * KIBIBYTE;
const GIBIBYTE = MEBIBYTE * KIBIBYTE;
const HUNDRED = BigInt(100);
const ZERO = BigInt(0);

const statusLabels: Record<AdminTenantStatus, string> = {
  ACTIVE: 'Activa',
  TRIAL: 'Trial',
  SUSPENDED: 'Suspensa',
};

const statusClasses: Record<AdminTenantStatus, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  TRIAL: 'border-amber-200 bg-amber-50 text-amber-700',
  SUSPENDED: 'border-rose-200 bg-rose-50 text-rose-700',
};

function formatStorage(value: string) {
  const bytes = BigInt(value || '0');
  if (bytes >= GIBIBYTE) return `${Number((bytes * HUNDRED) / GIBIBYTE) / 100} GiB`;
  if (bytes >= MEBIBYTE) return `${Number((bytes * HUNDRED) / MEBIBYTE) / 100} MiB`;
  if (bytes >= KIBIBYTE) return `${Number((bytes * HUNDRED) / KIBIBYTE) / 100} KiB`;
  return `${bytes} B`;
}

function storagePercentage(used: string, quota: string | null) {
  if (!quota || BigInt(quota) === ZERO) return null;
  return Math.min(100, Number((BigInt(used) * HUNDRED) / BigInt(quota)));
}

export default function AdminTenantsPage() {
  const [result, setResult] = useState<AdminTenantList | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminTenantStatus | ''>('');
  const [planType, setPlanType] = useState<AdminPlanType | ''>('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<AdminTenant | null>(null);

  const [sortBy, sortDirection] = useMemo(() => sort.split(':'), [sort]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      getAdminTenants({
        search: search || undefined,
        status,
        planType,
        page,
        pageSize: 20,
        sortBy,
        sortDirection: sortDirection as 'asc' | 'desc',
      })
        .then((data) => active && setResult(data))
        .catch(() => active && setError('Não foi possível consultar as empresas da plataforma.'))
        .finally(() => active && setLoading(false));
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [search, status, planType, page, sortBy, sortDirection, reload]);

  function resetPage() {
    setPage(1);
    setNotice('');
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <header className="border-b border-[var(--fd-border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Plataforma</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Empresas e tenants</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--fd-text-secondary)]">
            Gestão operacional da conta empresarial, sem acesso a salários, documentos ou informação fiscal interna.
          </p>
        </header>

        <section className="mt-7 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="grid gap-3 border-b border-[var(--fd-border)] p-4 md:grid-cols-[minmax(240px,1fr)_170px_170px_210px]">
            <label className="relative block">
              <span className="sr-only">Pesquisar empresas</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fd-muted)]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  resetPage();
                }}
                placeholder="Nome, NIF ou email"
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as AdminTenantStatus | '');
                  resetPage();
                }}
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Todos os estados</option>
                <option value="ACTIVE">Activas</option>
                <option value="TRIAL">Em trial</option>
                <option value="SUSPENDED">Suspensas</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por plano</span>
              <select
                value={planType}
                onChange={(event) => {
                  setPlanType(event.target.value as AdminPlanType | '');
                  resetPage();
                }}
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Todos os planos</option>
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Ordenar empresas</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  resetPage();
                }}
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              >
                <option value="createdAt:desc">Mais recentes</option>
                <option value="createdAt:asc">Mais antigas</option>
                <option value="name:asc">Nome A–Z</option>
                <option value="name:desc">Nome Z–A</option>
                <option value="storageUsedBytes:desc">Maior armazenamento</option>
              </select>
            </label>
          </div>

          {notice && <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-medium text-emerald-700">{notice}</div>}
          {error && <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-700">{error}</div>}

          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full border-collapse text-left">
              <thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Estado e plano</th>
                  <th className="px-4 py-3 font-semibold">Utilização</th>
                  <th className="px-4 py-3 font-semibold">Armazenamento</th>
                  <th className="px-4 py-3 font-semibold">Trial / subscrição</th>
                  <th className="px-5 py-3 text-right font-semibold">Acção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fd-border)]">
                {loading ? (
                  <tr><td colSpan={6} className="h-52 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-700" aria-label="A carregar empresas" /></td></tr>
                ) : result?.data.length ? (
                  result.data.map((tenant) => {
                    const percentage = storagePercentage(tenant.usage.storageUsedBytes, tenant.usage.storageQuotaBytes);
                    return (
                      <tr key={tenant.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-600"><Building2 className="h-4 w-4" /></span>
                            <div>
                              <p className="max-w-[250px] truncate text-sm font-semibold">{tenant.name}</p>
                              <p className="mt-1 text-[11px] text-[var(--fd-muted)]">NIF {tenant.nifMasked}</p>
                              <p className="mt-0.5 text-[11px] text-[var(--fd-muted)]">{tenant.emailMasked}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClasses[tenant.status]}`}>{statusLabels[tenant.status]}</span>
                          <p className="mt-2 text-xs font-medium">{tenant.planType}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]">
                          <p><span className="font-semibold text-[var(--fd-text-primary)]">{tenant.usage.activeUsers}</span>/{tenant.usage.users} utilizadores activos</p>
                          <p className="mt-1">{tenant.usage.employees} trabalhadores</p>
                          <p className="mt-1">{tenant.usage.documents} documentos</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-semibold tabular-nums">{formatStorage(tenant.usage.storageUsedBytes)}</p>
                          {tenant.usage.storageQuotaBytes ? (
                            <>
                              <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-600" style={{ width: `${percentage ?? 0}%` }} /></div>
                              <p className="mt-1.5 text-[11px] text-[var(--fd-muted)]">de {formatStorage(tenant.usage.storageQuotaBytes)}</p>
                            </>
                          ) : (
                            <p className="mt-1.5 text-[11px] text-[var(--fd-muted)]">Quota comercial não definida</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]">
                          {tenant.subscription ? (
                            <>
                              <p className="font-semibold text-[var(--fd-text-primary)]">{tenant.subscription.paymentStatus}</p>
                              <p className="mt-1">até {new Date(tenant.subscription.endsAt).toLocaleDateString('pt-AO')}</p>
                            </>
                          ) : tenant.trialEndsAt ? (
                            <>
                              <p className="font-semibold text-[var(--fd-text-primary)]">Trial</p>
                              <p className="mt-1">até {new Date(tenant.trialEndsAt).toLocaleDateString('pt-AO')}</p>
                            </>
                          ) : (
                            <span className="text-[var(--fd-muted)]">Sem período configurado</span>
                          )}
                          <p className="mt-2 text-[11px] text-[var(--fd-muted)]">Criada em {new Date(tenant.createdAt).toLocaleDateString('pt-AO')}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTenant(tenant)}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-4 ${tenant.status === 'SUSPENDED' ? 'border-emerald-200 text-emerald-700 focus:ring-emerald-100' : 'border-rose-200 text-rose-700 focus:ring-rose-100'}`}
                          >
                            {tenant.status === 'SUSPENDED' ? 'Reactivar' : 'Suspender'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={6} className="h-52 text-center text-sm text-[var(--fd-muted)]">Nenhuma empresa corresponde aos filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {result && (
            <footer className="flex flex-col gap-3 border-t border-[var(--fd-border)] px-5 py-4 text-xs text-[var(--fd-muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>{result.pagination.total} empresa(s) · página {result.pagination.page} de {result.pagination.totalPages}</p>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página seguinte"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </footer>
          )}
        </section>
      </div>

      {selectedTenant && (
        <StatusDialog
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onChanged={(message) => {
            setSelectedTenant(null);
            setNotice(message);
            setReload((value) => value + 1);
          }}
        />
      )}
    </AdminShell>
  );
}

function StatusDialog({ tenant, onClose, onChanged }: { tenant: AdminTenant; onClose: () => void; onChanged: (message: string) => void }) {
  const targetStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
  const action = targetStatus === 'ACTIVE' ? 'reactivar' : 'suspender';
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 8) {
      setError('Indique um motivo com pelo menos 8 caracteres.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateAdminTenantStatus(tenant.id, targetStatus, reason.trim());
      onChanged(`${tenant.name} foi ${targetStatus === 'ACTIVE' ? 'reactivada' : 'suspensa'} e a acção ficou registada.`);
    } catch {
      setError('Não foi possível concluir a alteração de estado.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fd-overlay)] p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="tenant-status-title" className="w-full max-w-lg rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--fd-border)] p-5">
          <div className="flex gap-3"><span className="rounded-lg bg-amber-50 p-2 text-amber-700"><ShieldAlert className="h-5 w-5" /></span><div><h2 id="tenant-status-title" className="text-base font-semibold capitalize">{action} empresa</h2><p className="mt-1 text-xs text-[var(--fd-muted)]">{tenant.name}</p></div></div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[var(--fd-muted)] hover:bg-slate-100" aria-label="Fechar"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5">
          <p className="text-sm leading-6 text-[var(--fd-text-secondary)]">Esta acção altera o acesso operacional do tenant e será registada na auditoria administrativa.</p>
          <label className="mt-5 block text-xs font-semibold" htmlFor="status-reason">Motivo da alteração</label>
          <textarea id="status-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={500} className="mt-2 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] p-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" placeholder="Descreva a razão operacional..." />
          {error && <p className="mt-3 text-xs font-medium text-rose-700">{error}</p>}
          <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-sm font-semibold">Cancelar</button><button type="submit" disabled={saving} className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${targetStatus === 'ACTIVE' ? 'bg-emerald-700' : 'bg-rose-700'}`}>{saving ? 'A guardar…' : `Confirmar e ${action}`}</button></div>
        </form>
      </section>
    </div>
  );
}
