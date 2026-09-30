'use client';

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Database,
  FileArchive,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

import AdminShell from '@/components/admin/AdminShell';
import {
  AdminDashboardSummary,
  getAdminDashboard,
} from '@/services/admin-api';

const KIBIBYTE = BigInt(1024);
const MEBIBYTE = KIBIBYTE * KIBIBYTE;
const GIBIBYTE = MEBIBYTE * KIBIBYTE;
const HUNDRED = BigInt(100);

function formatStorage(value: string) {
  const bytes = BigInt(value || '0');
  const units = [
    ['GiB', GIBIBYTE],
    ['MiB', MEBIBYTE],
    ['KiB', KIBIBYTE],
  ] as const;
  for (const [label, size] of units) {
    if (bytes >= size) {
      return `${Number((bytes * HUNDRED) / size) / 100} ${label}`;
    }
  }
  return `${bytes} B`;
}

const auditLabels: Record<string, string> = {
  ADMIN_LOGIN_SUCCEEDED: 'Sessão administrativa iniciada',
  ADMIN_LOGIN_FAILED: 'Tentativa de acesso recusada',
  ADMIN_PASSWORD_CHANGED: 'Palavra-passe administrativa alterada',
  TENANT_SUSPENDED: 'Empresa suspensa',
  TENANT_REACTIVATED: 'Empresa reactivada',
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAdminDashboard()
      .then((data) => active && setSummary(data))
      .catch(() => active && setError('Não foi possível carregar os indicadores da plataforma.'));
    return () => {
      active = false;
    };
  }, []);

  const cards: Array<{
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
  }> = summary
    ? [
        {
          label: 'Empresas',
          value: summary.tenants.total,
          detail: `${summary.tenants.active} activas`,
          icon: Building2,
        },
        {
          label: 'Utilizadores',
          value: summary.users.total,
          detail: `${summary.users.active} activos`,
          icon: Users,
        },
        {
          label: 'Documentos',
          value: summary.operations.documents,
          detail: 'Registos agregados',
          icon: FileArchive,
        },
        {
          label: 'Armazenamento',
          value: formatStorage(summary.operations.storageBytes),
          detail: 'Consumo contabilizado',
          icon: Database,
        },
      ]
    : [];

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <header className="flex flex-col gap-4 border-b border-[var(--fd-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Visão geral</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Estado da plataforma</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--fd-text-secondary)]">
              Indicadores operacionais agregados, sem acesso ao conteúdo privado das empresas.
            </p>
          </div>
          {summary && (
            <p className="text-xs text-[var(--fd-muted)]">
              Actualizado em {new Date(summary.generatedAt).toLocaleString('pt-AO')}
            </p>
          )}
        </header>

        {error ? (
          <div className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
        ) : !summary ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-sky-700" aria-label="A carregar indicadores" />
          </div>
        ) : (
          <>
            {summary.alerts.expiredTrials > 0 && (
              <section className="mt-7 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Trials expirados por rever</p>
                  <p className="mt-1 text-xs leading-5">
                    {summary.alerts.expiredTrials} empresa(s) permanecem com estado de trial após a data de fim.
                  </p>
                </div>
              </section>
            )}

            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ label, value, detail, icon: Icon }) => (
                <article key={label} className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[var(--fd-text-secondary)]">{label}</p>
                    <span className="rounded-lg bg-sky-50 p-2 text-sky-700"><Icon className="h-4 w-4" /></span>
                  </div>
                  <p className="mt-5 text-2xl font-semibold tabular-nums">{value}</p>
                  <p className="mt-1 text-xs text-[var(--fd-muted)]">{detail}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--fd-border)] px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold">Empresas por estado</h2>
                    <p className="mt-1 text-xs text-[var(--fd-muted)]">Distribuição dos tenants registados.</p>
                  </div>
                  <Link href="/admin/tenants" className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900">
                    Ver empresas <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="space-y-5 p-5">
                  {[
                    ['Activas', summary.tenants.active, 'bg-emerald-500'],
                    ['Em trial', summary.tenants.trial, 'bg-amber-500'],
                    ['Suspensas', summary.tenants.suspended, 'bg-rose-500'],
                  ].map(([label, rawValue, colour]) => {
                    const value = Number(rawValue);
                    const percentage = summary.tenants.total
                      ? Math.round((value / summary.tenants.total) * 100)
                      : 0;
                    return (
                      <div key={String(label)}>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium">{String(label)}</span>
                          <span className="tabular-nums text-[var(--fd-text-secondary)]">{value} · {percentage}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${colour}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
                <div className="border-b border-[var(--fd-border)] px-5 py-4">
                  <h2 className="text-sm font-semibold">Actividade recente</h2>
                  <p className="mt-1 text-xs text-[var(--fd-muted)]">Novos registos nos últimos {summary.growth.periodDays} dias.</p>
                </div>
                <div className="grid gap-px bg-[var(--fd-border)] sm:grid-cols-2">
                  <div className="bg-[var(--fd-surface)] p-5">
                    <p className="text-xs text-[var(--fd-muted)]">Empresas criadas</p>
                    <p className="mt-3 text-3xl font-semibold tabular-nums">{summary.growth.tenantsCreated}</p>
                  </div>
                  <div className="bg-[var(--fd-surface)] p-5">
                    <p className="text-xs text-[var(--fd-muted)]">Utilizadores criados</p>
                    <p className="mt-3 text-3xl font-semibold tabular-nums">{summary.growth.usersCreated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-[var(--fd-border)] px-5 py-4 text-xs text-[var(--fd-text-secondary)]">
                  <Activity className="h-4 w-4 text-sky-700" />
                  {summary.operations.employees} trabalhadores registados em toda a plataforma
                </div>
              </article>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <article className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
                <div className="border-b border-[var(--fd-border)] px-5 py-4">
                  <h2 className="text-sm font-semibold">Subscrições activas</h2>
                  <p className="mt-1 text-xs text-[var(--fd-muted)]">Estados reais dos registos activos.</p>
                </div>
                <div className="divide-y divide-[var(--fd-border)] px-5">
                  {(['PAID', 'PENDING', 'FAILED', 'EXPIRED', 'REFUNDED'] as const).map((status) => (
                    <div key={status} className="flex items-center justify-between py-3.5 text-xs">
                      <span className="text-[var(--fd-text-secondary)]">{status}</span>
                      <span className="font-semibold tabular-nums">{summary.subscriptions.byPaymentStatus[status] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--fd-border)] px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold">Eventos administrativos</h2>
                    <p className="mt-1 text-xs text-[var(--fd-muted)]">Acções recentes no domínio da plataforma.</p>
                  </div>
                  <Link href="/admin/audit" className="text-xs font-semibold text-sky-700 hover:text-sky-900">Ver auditoria</Link>
                </div>
                {summary.recentAuditEvents.length ? (
                  <div className="divide-y divide-[var(--fd-border)] px-5">
                    {summary.recentAuditEvents.map((event) => (
                      <div key={event.id} className="flex items-start justify-between gap-4 py-3.5">
                        <div className="flex min-w-0 items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{auditLabels[event.action] ?? event.action}</p>
                            <p className="mt-1 text-[11px] text-[var(--fd-muted)]">{event.admin?.name ?? 'Sistema'}</p>
                          </div>
                        </div>
                        <time className="shrink-0 text-[11px] text-[var(--fd-muted)]">{new Date(event.createdAt).toLocaleString('pt-AO')}</time>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-6 text-sm text-[var(--fd-muted)]">Ainda não existem eventos administrativos.</p>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </AdminShell>
  );
}
