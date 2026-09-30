'use client';

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  UserRoundX,
  Users,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  getTenantUsers,
  getUserApiError,
  TenantUser,
  TenantUserRole,
  updateTenantUserAccess,
  UserList,
} from '@/services/users';

const roleLabels: Record<TenantUserRole, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  ACCOUNTANT: 'Contabilista',
  VIEWER: 'Consulta',
};

const roleStyles: Record<TenantUserRole, string> = {
  OWNER: 'border-sky-200 bg-sky-50 text-sky-800',
  ADMIN: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  ACCOUNTANT: 'border-amber-200 bg-amber-50 text-amber-800',
  VIEWER: 'border-slate-200 bg-slate-50 text-slate-700',
};

function formatDate(value: string | null) {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [result, setResult] = useState<UserList | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<TenantUserRole | ''>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const [sort, setSort] = useState('name:asc');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<TenantUser | null>(null);
  const [sortBy, sortDirection] = useMemo(() => sort.split(':'), [sort]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      getTenantUsers({
        search: search || undefined,
        role,
        status,
        page,
        pageSize: 20,
        sortBy: sortBy as 'name' | 'email' | 'role' | 'createdAt' | 'lastLogin',
        sortDirection: sortDirection as 'asc' | 'desc',
      })
        .then((data) => active && setResult(data))
        .catch((requestError) =>
          active && setError(
            getUserApiError(requestError, 'Não foi possível consultar os utilizadores da empresa.'),
          ),
        )
        .finally(() => active && setLoading(false));
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [page, reload, role, search, sortBy, sortDirection, status]);

  function resetPage() {
    setPage(1);
    setNotice('');
  }

  const summaries = [
    { label: 'Utilizadores', value: result?.summary.total ?? 0, icon: Users },
    { label: 'Activos', value: result?.summary.active ?? 0, icon: UserRoundCheck },
    { label: 'Inactivos', value: result?.summary.inactive ?? 0, icon: UserRoundX },
    { label: 'Proprietários activos', value: result?.summary.owners ?? 0, icon: ShieldCheck },
  ];

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1500px]">
        <header className="border-b border-[var(--fd-border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Empresa e acessos</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fd-text-primary)] sm:text-3xl">Utilizadores</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--fd-text-secondary)]">
            Consulte os membros da empresa e controle funções e estado de acesso. As alterações ficam registadas para auditoria.
          </p>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo de utilizadores">
          {summaries.map((item) => (
            <article key={item.label} className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--fd-text-secondary)]">{item.label}</p>
                <item.icon className="h-4 w-4 text-sky-700" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--fd-text-primary)]">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="grid gap-3 border-b border-[var(--fd-border)] p-4 md:grid-cols-[minmax(240px,1fr)_170px_170px_210px]">
            <label className="relative block">
              <span className="sr-only">Pesquisar utilizadores</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fd-muted)]" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); resetPage(); }}
                placeholder="Nome ou email"
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por função</span>
              <select
                value={role}
                onChange={(event) => { setRole(event.target.value as TenantUserRole | ''); resetPage(); }}
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Todas as funções</option>
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Filtrar por estado</span>
              <select
                value={status}
                onChange={(event) => { setStatus(event.target.value as 'ACTIVE' | 'INACTIVE' | ''); resetPage(); }}
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Todos os estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Ordenar utilizadores</span>
              <select
                value={sort}
                onChange={(event) => { setSort(event.target.value); resetPage(); }}
                className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100"
              >
                <option value="name:asc">Nome A–Z</option>
                <option value="name:desc">Nome Z–A</option>
                <option value="createdAt:desc">Mais recentes</option>
                <option value="lastLogin:desc">Acesso mais recente</option>
              </select>
            </label>
          </div>

          {notice && <div role="status" className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-xs font-medium text-emerald-800">{notice}</div>}
          {error && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-800">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Utilizador</th>
                  <th className="px-4 py-3 font-semibold">Função</th>
                  <th className="px-4 py-3 font-semibold">Segurança</th>
                  <th className="px-4 py-3 font-semibold">Último acesso</th>
                  <th className="px-5 py-3 text-right font-semibold">Acção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fd-border)]">
                {loading ? (
                  <tr><td colSpan={5} className="h-52 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-700" aria-label="A carregar utilizadores" /></td></tr>
                ) : result?.data.length ? (
                  result.data.map((member) => {
                    const isSelf = member.id === currentUser?.id;
                    const isPrivilegedTarget = member.role === 'OWNER' || member.role === 'ADMIN';
                    const canManage =
                      !isSelf &&
                      !(currentUser?.role === 'ADMIN' && isPrivilegedTarget);
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-800">{member.name.slice(0, 2).toUpperCase()}</span>
                            <div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--fd-text-primary)]">{member.name}{isSelf ? ' (tu)' : ''}</p><p className="mt-0.5 truncate text-xs text-[var(--fd-muted)]">{member.email}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${roleStyles[member.role]}`}>{roleLabels[member.role]}</span></td>
                        <td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]">
                          <span className={`inline-flex items-center gap-1.5 font-semibold ${member.isActive ? 'text-emerald-700' : 'text-rose-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />{member.isActive ? 'Activo' : 'Inactivo'}</span>
                          <p className="mt-1.5 text-[11px] text-[var(--fd-muted)]">2FA {member.twoFactorEnabled ? 'activo' : 'inactivo'}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]">{formatDate(member.lastLogin)}</td>
                        <td className="px-5 py-4 text-right">
                          <button type="button" disabled={!canManage} onClick={() => setSelected(member)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--fd-border)] px-3 py-2 text-xs font-semibold text-[var(--fd-text-primary)] hover:border-sky-300 hover:text-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-45"><UserCog className="h-3.5 w-3.5" />Gerir</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={5} className="h-52 text-center text-sm text-[var(--fd-muted)]">Nenhum utilizador corresponde aos filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--fd-border)] px-5 py-4 text-xs text-[var(--fd-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>{result?.pagination.total ?? 0} resultado(s)</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={!result || result.pagination.page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
              <span>Página {result?.pagination.page ?? page} de {result?.pagination.totalPages ?? 1}</span>
              <button type="button" disabled={!result || result.pagination.page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:opacity-40" aria-label="Página seguinte"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <aside className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900">
          A criação de novos acessos será disponibilizada com um fluxo de convite verificável e com expiração. Esta página não gera palavras-passe nem simula convites.
        </aside>
      </main>

      {selected && (
        <AccessModal
          member={selected}
          requesterRole={(currentUser?.role as TenantUserRole | undefined) ?? 'VIEWER'}
          onClose={() => setSelected(null)}
          onSaved={(message) => { setSelected(null); setNotice(message); setReload((value) => value + 1); }}
        />
      )}
    </DashboardLayout>
  );
}

function AccessModal({ member, requesterRole, onClose, onSaved }: {
  member: TenantUser;
  requesterRole: TenantUserRole;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [role, setRole] = useState<TenantUserRole>(member.role);
  const [isActive, setIsActive] = useState(member.isActive);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isAdmin = requesterRole === 'ADMIN';
  const hasChanges = role !== member.role || isActive !== member.isActive;
  const assignableRoles = (Object.keys(roleLabels) as TenantUserRole[]).filter(
    (value) => !isAdmin || value === 'ACCOUNTANT' || value === 'VIEWER',
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!hasChanges) return setError('Altere a função ou o estado antes de guardar.');
    if (reason.trim().length < 8) return setError('Indique um motivo com pelo menos 8 caracteres.');
    setSaving(true);
    try {
      await updateTenantUserAccess(member.id, {
        role: role !== member.role ? role : undefined,
        isActive: isActive !== member.isActive ? isActive : undefined,
        reason: reason.trim(),
      });
      onSaved(`O acesso de ${member.name} foi actualizado.`);
    } catch (requestError) {
      setError(getUserApiError(requestError, 'Não foi possível actualizar o acesso.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--fd-overlay)] p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="access-dialog-title" className="w-full max-w-lg rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--fd-border)] p-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Controlo de acesso</p><h2 id="access-dialog-title" className="mt-1 text-lg font-semibold text-[var(--fd-text-primary)]">Gerir {member.name}</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--fd-muted)] hover:bg-slate-100" aria-label="Fechar"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5">
          <label className="block text-xs font-semibold text-[var(--fd-text-primary)]">Função
            <select value={role} onChange={(event) => setRole(event.target.value as TenantUserRole)} className="mt-2 h-11 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100">
              {assignableRoles.map((value) => <option key={value} value={value}>{roleLabels[value]}</option>)}
            </select>
          </label>
          <label className="flex items-center justify-between rounded-xl border border-[var(--fd-border)] p-4">
            <span><span className="block text-sm font-semibold text-[var(--fd-text-primary)]">Acesso activo</span><span className="mt-1 block text-xs text-[var(--fd-muted)]">Um utilizador inactivo deixa de conseguir autenticar-se.</span></span>
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 accent-sky-700" />
          </label>
          <label className="block text-xs font-semibold text-[var(--fd-text-primary)]">Motivo da alteração
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} placeholder="Registe a razão para auditoria" className="mt-2 w-full resize-none rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 py-2 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" />
          </label>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
          <div className="flex justify-end gap-3 border-t border-[var(--fd-border)] pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--fd-border)] px-4 py-2.5 text-xs font-semibold text-[var(--fd-text-primary)]">Cancelar</button>
            <button type="submit" disabled={saving || !hasChanges} className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Guardar alterações</button>
          </div>
        </form>
      </section>
    </div>
  );
}
