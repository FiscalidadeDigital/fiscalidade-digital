'use client';

import { ChevronLeft, ChevronRight, ListChecks, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import AdminShell from '@/components/admin/AdminShell';
import { AdminAuditList, getAdminAuditEvents } from '@/services/admin-api';

const actionLabels: Record<string, string> = {
  ADMIN_LOGIN_SUCCEEDED: 'Sessão iniciada',
  ADMIN_LOGIN_FAILED: 'Acesso recusado',
  ADMIN_PASSWORD_CHANGED: 'Palavra-passe alterada',
  ADMIN_PASSWORD_CHANGE_FAILED: 'Alteração de palavra-passe recusada',
  TENANT_SUSPENDED: 'Empresa suspensa',
  TENANT_REACTIVATED: 'Empresa reactivada',
};

export default function AdminAuditPage() {
  const [result, setResult] = useState<AdminAuditList | null>(null);
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      getAdminAuditEvents({
        action: action || undefined,
        targetType: targetType || undefined,
        from: from ? `${from}T00:00:00.000Z` : undefined,
        to: to ? `${to}T23:59:59.999Z` : undefined,
        page,
        pageSize: 25,
      })
        .then((data) => active && setResult(data))
        .catch(() => active && setError('Não foi possível consultar a auditoria administrativa.'))
        .finally(() => active && setLoading(false));
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [action, targetType, from, to, page]);

  function resetPage() {
    setPage(1);
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <header className="border-b border-[var(--fd-border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Segurança</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Auditoria administrativa</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--fd-text-secondary)]">
            Registo cronológico das acções da administração da plataforma. Metadados técnicos e conteúdo tenant permanecem fora desta vista.
          </p>
        </header>

        <section className="mt-7 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
          <div className="grid gap-3 border-b border-[var(--fd-border)] p-4 md:grid-cols-[minmax(230px,1fr)_170px_170px_170px]">
            <label className="relative block">
              <span className="sr-only">Pesquisar acção</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fd-muted)]" />
              <input value={action} onChange={(event) => { setAction(event.target.value); resetPage(); }} placeholder="Pesquisar acção" className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] pl-9 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" />
            </label>
            <label>
              <span className="sr-only">Tipo de alvo</span>
              <select value={targetType} onChange={(event) => { setTargetType(event.target.value); resetPage(); }} className="h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100">
                <option value="">Todos os alvos</option>
                <option value="Tenant">Empresas</option>
              </select>
            </label>
            <label className="text-[11px] text-[var(--fd-muted)]">Desde<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); resetPage(); }} className="mt-1 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm text-[var(--fd-text-primary)] outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>
            <label className="text-[11px] text-[var(--fd-muted)]">Até<input type="date" value={to} onChange={(event) => { setTo(event.target.value); resetPage(); }} className="mt-1 h-10 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 text-sm text-[var(--fd-text-primary)] outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100" /></label>
          </div>

          {error && <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-medium text-rose-700">{error}</div>}

          <div className="overflow-x-auto">
            <table className="min-w-[850px] w-full border-collapse text-left">
              <thead className="bg-[var(--fd-table-header)] text-[11px] uppercase tracking-[0.08em] text-[var(--fd-muted)]">
                <tr><th className="px-5 py-3 font-semibold">Evento</th><th className="px-4 py-3 font-semibold">Alvo</th><th className="px-4 py-3 font-semibold">Administrador</th><th className="px-5 py-3 text-right font-semibold">Data</th></tr>
              </thead>
              <tbody className="divide-y divide-[var(--fd-border)]">
                {loading ? (
                  <tr><td colSpan={4} className="h-52 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-sky-700" aria-label="A carregar auditoria" /></td></tr>
                ) : result?.data.length ? (
                  result.data.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="rounded-lg bg-sky-50 p-2 text-sky-700"><ListChecks className="h-4 w-4" /></span><div><p className="text-sm font-semibold">{actionLabels[event.action] ?? event.action}</p><p className="mt-1 font-mono text-[10px] text-[var(--fd-muted)]">{event.action}</p></div></div></td>
                      <td className="px-4 py-4 text-xs text-[var(--fd-text-secondary)]">{event.targetType ? <><p className="font-medium text-[var(--fd-text-primary)]">{event.targetType}</p><p className="mt-1 font-mono text-[10px]">{event.targetId?.slice(0, 12) ?? '—'}…</p></> : 'Plataforma'}</td>
                      <td className="px-4 py-4 text-xs"><p className="font-medium">{event.admin?.name ?? 'Sistema'}</p></td>
                      <td className="px-5 py-4 text-right text-xs tabular-nums text-[var(--fd-text-secondary)]">{new Date(event.createdAt).toLocaleString('pt-AO')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="h-52 text-center text-sm text-[var(--fd-muted)]">Nenhum evento corresponde aos filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {result && (
            <footer className="flex flex-col gap-3 border-t border-[var(--fd-border)] px-5 py-4 text-xs text-[var(--fd-muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>{result.pagination.total} evento(s) · página {result.pagination.page} de {result.pagination.totalPages}</p>
              <div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[var(--fd-border)] p-2 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página seguinte"><ChevronRight className="h-4 w-4" /></button></div>
            </footer>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
