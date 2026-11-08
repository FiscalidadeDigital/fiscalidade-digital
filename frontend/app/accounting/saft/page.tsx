'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCode2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getSafeErrorMessage } from '@/lib/safe-error';
import {
  downloadSaft,
  getSaftPreflight,
  getSaftSummary,
  type SaftPreflight,
  type SaftSummary,
} from '@/services/accounting-saft';

const money = (value: string) =>
  `${new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))} Kz`;

export default function SaftPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<SaftSummary | null>(null);
  const [preflight, setPreflight] = useState<SaftPreflight | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (fiscalYear: number) => {
    setLoading(true);
    setError('');
    try {
      const [nextSummary, nextPreflight] = await Promise.all([
        getSaftSummary(fiscalYear),
        getSaftPreflight(fiscalYear),
      ]);
      setSummary(nextSummary);
      setPreflight(nextPreflight);
    } catch (requestError) {
      setError(
        getSafeErrorMessage(
          requestError,
          'Não foi possível avaliar os dados SAF-T deste período.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(year);
  }, [load, year]);

  const download = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadSaft(year);
    } catch (requestError) {
      setError(
        getSafeErrorMessage(
          requestError,
          'O ficheiro não foi gerado. Reveja os dados e tente novamente.',
        ),
      );
    } finally {
      setDownloading(false);
    }
  };

  const blockingIssues =
    preflight?.issues.filter((issue) => issue.severity === 'BLOCKING') ?? [];
  const warningIssues =
    preflight?.issues.filter((issue) => issue.severity === 'WARNING') ?? [];

  return (
    <DashboardLayout>
      <main className="fd-theme-scope min-h-full bg-[var(--fd-page)] text-[var(--fd-text)]">
        <header className="border-b border-[var(--fd-border)] bg-[var(--fd-surface)] px-4 py-6 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal-700">
                Fiscalidade
              </p>
              <h1 className="mt-2 text-2xl font-semibold">SAF-T</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--fd-muted)]">
                Prepare e exporte os dados fiscais da empresa.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-medium text-[var(--fd-muted)]">
                Exercício
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  className="mt-1 block w-28 rounded-lg border border-[var(--fd-border)] bg-[var(--fd-input)] px-3 py-2 text-sm"
                />
              </label>
              <button
                onClick={() => void load(year)}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--fd-border)] px-3 text-sm font-semibold"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {loading && !summary ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
            </div>
          ) : summary && preflight ? (
            <>
              <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {[
                  ['Documentos', summary.documentCount],
                  ['Clientes', summary.customerCount],
                  ['Produtos/Serviços', summary.productCount],
                  ['Anulados', summary.cancelledCount],
                  ['Base tributável', money(summary.taxableBase)],
                  ['IVA', money(summary.taxAmount)],
                  ['Total', money(summary.grossTotal)],
                ].map(([label, value]) => (
                  <article
                    key={String(label)}
                    className="min-w-0 rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-4"
                  >
                    <p className="truncate text-xs text-[var(--fd-muted)]">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-lg font-semibold tabular-nums">
                      {value}
                    </p>
                  </article>
                ))}
              </section>

              <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                <div className="overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)]">
                  <div className="border-b border-[var(--fd-border)] px-5 py-4">
                    <h2 className="font-semibold">Verificação dos dados</h2>
                    <p className="mt-1 text-xs text-[var(--fd-muted)]">
                      Reveja os pontos assinalados antes de gerar o ficheiro.
                    </p>
                  </div>
                  <div className="divide-y divide-[var(--fd-border)]">
                    {blockingIssues.length || warningIssues.length ? (
                      <>
                        {blockingIssues.length > 0 && (
                          <div className="flex gap-3 px-5 py-4">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                            <div>
                              <p className="text-sm font-medium">
                                Existem {blockingIssues.length} ponto(s) que precisam de
                                correção antes da exportação.
                              </p>
                            </div>
                          </div>
                        )}
                        {warningIssues.length > 0 && (
                          <div className="flex gap-3 px-5 py-4">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <div>
                              <p className="text-sm font-medium">
                                Existem {warningIssues.length} ponto(s) a rever.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-3 p-5 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Dados prontos para gerar o ficheiro.
                      </div>
                    )}
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-5">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-5 w-5 text-teal-700" />
                      <h2 className="font-semibold">Ficheiro SAF-T</h2>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--fd-muted)]">
                      O ficheiro é preparado com os dados do exercício selecionado.
                    </p>
                    <button
                      onClick={() => void download()}
                      disabled={!preflight.ready || downloading}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Gerar ficheiro SAF-T
                    </button>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
                    <p className="text-sm font-semibold">Antes de enviar</p>
                    <p className="mt-2 text-xs leading-5">
                      Confirme se os dados da empresa e do período estão completos.
                    </p>
                  </div>
                </aside>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </DashboardLayout>
  );
}
