'use client';

import {
  AlertTriangle,
  BookOpenCheck,
  Building2,
  Database,
  ExternalLink,
  FileWarning,
  Loader2,
  RefreshCw,
  Table2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  getSaftReadiness,
  SaftReadiness,
} from '@/services/accounting-saft';

function StateBadge({ state }: { state: string }) {
  const blocked = state === 'BLOCKED' || state === 'INCOMPLETE';
  return (
    <span
      className={`rounded-md border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        blocked
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {state === 'BLOCKED'
        ? 'Bloqueado'
        : state === 'INCOMPLETE'
          ? 'Incompleto'
          : 'Parcial'}
    </span>
  );
}

export default function AccountingSaftPage() {
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [readiness, setReadiness] = useState<SaftReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (year: number) => {
    setLoading(true);
    setError('');
    try {
      setReadiness(await getSaftReadiness(year));
    } catch {
      setReadiness(null);
      setError('Não foi possível avaliar os dados contabilísticos deste período.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(new Date().getFullYear());
  }, [load]);

  return (
    <DashboardLayout>
      <div className="fd-theme-scope min-h-full bg-[var(--fd-page)] text-[var(--fd-text)]">
        <header className="border-b border-[var(--fd-border)] bg-[var(--fd-surface)] px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Contabilidade</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Preparação SAF-T (AO) contabilístico</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--fd-muted)]">
                Diagnóstico dos dados disponíveis para cabeçalho, tabelas mestres e movimentos contabilísticos. A geração XML permanece desactivada enquanto faltarem estrutura oficial validada e razão contabilístico completo.
              </p>
            </div>

            <div className="flex items-end gap-2">
              <label className="text-xs font-medium text-[var(--fd-muted)]">
                Exercício
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={fiscalYear}
                  onChange={(event) => setFiscalYear(Number(event.target.value))}
                  className="mt-1.5 block w-28 rounded-lg border border-[var(--fd-border)] bg-[var(--fd-surface)] px-3 py-2 text-sm text-[var(--fd-text)] outline-none focus:border-teal-600"
                />
              </label>
              <button
                type="button"
                onClick={() => void load(fiscalYear)}
                disabled={loading}
                className="flex h-[38px] items-center gap-2 rounded-lg bg-teal-700 px-3.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Avaliar
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {loading && !readiness ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-700" aria-label="A avaliar dados" />
            </div>
          ) : readiness ? (
            <>
              <section className="flex flex-col justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950 sm:flex-row sm:items-start">
                <div className="flex gap-3">
                  <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                  <div>
                    <h2 className="text-sm font-semibold">Exportação ainda indisponível</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-amber-900/80">
                      Não é produzido qualquer XML provisório. O diagnóstico identifica os dados e componentes em falta antes de uma implementação verificável.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-md border border-amber-300 px-2.5 py-1 text-xs font-semibold">
                  {readiness.blockingIssues.length} bloqueios
                </span>
              </section>

              <section className="mt-6 grid gap-px overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-border)] md:grid-cols-3">
                {[
                  {
                    label: 'Cabeçalho',
                    state: readiness.sections.header.state,
                    icon: Building2,
                    detail: readiness.sections.header.company.nifPresent
                      ? 'Identificação fiscal presente'
                      : 'Identificação fiscal incompleta',
                  },
                  {
                    label: 'Tabelas mestres',
                    state: readiness.sections.masterData.state,
                    icon: Table2,
                    detail: `${readiness.sections.masterData.clients} clientes · ${readiness.sections.masterData.suppliers} fornecedores · ${readiness.sections.masterData.products} produtos`,
                  },
                  {
                    label: 'Movimentos contabilísticos',
                    state: readiness.sections.accountingMovements.state,
                    icon: BookOpenCheck,
                    detail: `${readiness.sections.accountingMovements.journalEntries} lançamentos no razão`,
                  },
                ].map(({ label, state, icon: Icon, detail }) => (
                  <article key={label} className="bg-[var(--fd-surface)] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--fd-border)]">
                        <Icon className="h-4 w-4 text-teal-700" />
                      </div>
                      <StateBadge state={state} />
                    </div>
                    <h2 className="mt-5 text-sm font-semibold">{label}</h2>
                    <p className="mt-1 text-xs leading-5 text-[var(--fd-muted)]">{detail}</p>
                  </article>
                ))}
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)]">
                  <div className="border-b border-[var(--fd-border)] px-5 py-4">
                    <h2 className="text-sm font-semibold">Bloqueios de implementação</h2>
                    <p className="mt-1 text-xs text-[var(--fd-muted)]">Todos têm de ser resolvidos e testados antes de activar a exportação.</p>
                  </div>
                  <div className="divide-y divide-[var(--fd-border)]">
                    {readiness.blockingIssues.map((issue) => (
                      <div key={issue.code} className="flex gap-3 px-5 py-4">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <div>
                          <p className="text-sm font-medium">{issue.message}</p>
                          <p className="mt-1 font-mono text-[10px] text-[var(--fd-muted)]">{issue.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-teal-700" />
                      <h2 className="text-sm font-semibold">Dados do exercício</h2>
                    </div>
                    <dl className="mt-4 space-y-3 text-sm">
                      {[
                        ['Facturas emitidas', readiness.sections.accountingMovements.salesDocuments],
                        ['Facturas de compra', readiness.sections.accountingMovements.purchaseDocuments],
                        ['Movimentos fiscais', readiness.sections.accountingMovements.taxTransactions],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="flex justify-between gap-3 border-b border-[var(--fd-border)] pb-3 last:border-0 last:pb-0">
                          <dt className="text-[var(--fd-muted)]">{label}</dt>
                          <dd className="font-semibold tabular-nums">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5">
                    <h2 className="text-sm font-semibold">Referência confirmada</h2>
                    <p className="mt-2 text-xs leading-5 text-[var(--fd-muted)]">
                      {readiness.legalReference.diploma}. O comunicado oficial confirma as três secções estruturais, sem substituir o artefacto técnico integral.
                    </p>
                    <a
                      href={readiness.legalReference.officialNoticeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-teal-700 hover:underline"
                    >
                      Consultar comunicado da AGT
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </section>

              {readiness.dataQualityIssues.length > 0 && (
                <section className="mt-6 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5">
                  <h2 className="text-sm font-semibold">Qualidade dos dados mestres</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {readiness.dataQualityIssues.map((issue) => (
                      <div key={issue.code} className="rounded-lg border border-[var(--fd-border)] p-4">
                        <p className="text-sm font-medium">{issue.message}</p>
                        <p className="mt-2 text-xs text-[var(--fd-muted)]">{issue.count} registos</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
