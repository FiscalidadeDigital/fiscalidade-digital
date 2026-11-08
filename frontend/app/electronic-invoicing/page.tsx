'use client';

import { AlertTriangle, CheckCircle2, Clock3, Loader2, RadioTower } from 'lucide-react';
import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  electronicInvoicingError,
  getElectronicReadiness,
  getElectronicSubmissions,
  type ElectronicReadiness,
  type ElectronicSubmission,
} from '@/services/electronic-invoicing';

const labels: Record<string, string> = {
  READY: 'Pronto para enviar',
  SUBMITTING: 'A enviar',
  SUBMITTED: 'Enviado',
  PROCESSING: 'Em análise',
  VALID: 'Validado',
  INVALID: 'Precisa de revisão',
  REJECTED: 'Não aceite',
  ERROR: 'Não concluído',
};

function statusLabel(status: string) {
  return labels[status] || 'Em acompanhamento';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-AO');
}

export default function ElectronicInvoicingPage() {
  const [readiness, setReadiness] = useState<ElectronicReadiness | null>(null);
  const [submissions, setSubmissions] = useState<ElectronicSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getElectronicReadiness(), getElectronicSubmissions()])
      .then(([nextReadiness, rows]) => {
        setReadiness(nextReadiness);
        setSubmissions(rows);
      })
      .catch((requestError) =>
        setError(
          electronicInvoicingError(
            requestError,
            'Não foi possível carregar o acompanhamento dos documentos.',
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const counts = (statuses: string[]) =>
    submissions.filter((entry) => statuses.includes(entry.status)).length;

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-7xl pb-12">
        <header className="border-b border-[var(--fd-border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-sky-700">
            Faturação
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--fd-text-primary)]">
            Faturação eletrónica
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--fd-text-secondary)]">
            Acompanhe o envio e o estado dos seus documentos fiscais.
          </p>
        </header>

        <aside className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Acompanhamento disponível</p>
            <p className="mt-1">
              Confirme o estado de cada documento antes de o considerar concluído.
            </p>
          </div>
        </aside>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid min-h-52 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-sky-700" />
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Envio disponível"
                value={readiness?.available ? 'Disponível' : 'Por confirmar'}
                icon={RadioTower}
              />
              <Metric label="Por enviar" value={String(counts(['READY']))} icon={Clock3} />
              <Metric
                label="Em acompanhamento"
                value={String(counts(['SUBMITTING', 'SUBMITTED', 'PROCESSING']))}
                icon={Clock3}
              />
              <Metric
                label="Validados"
                value={String(counts(['VALID']))}
                icon={CheckCircle2}
              />
            </section>

            <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)]">
              <div className="border-b border-[var(--fd-border)] p-5">
                <h2 className="font-semibold text-[var(--fd-text-primary)]">
                  Documentos acompanhados
                </h2>
                <p className="mt-1 text-xs text-[var(--fd-muted)]">
                  Consulte o estado mais recente de cada documento.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-[var(--fd-table-header)] text-xs uppercase text-[var(--fd-muted)]">
                    <tr>
                      <th className="px-5 py-3">Documento</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-5 py-3">Atualização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fd-border)]">
                    {submissions.length ? (
                      submissions.map((row, index) => (
                        <tr key={`${row.documentNumber ?? 'documento'}-${index}`}>
                          <td className="px-5 py-4 font-semibold text-[var(--fd-text-primary)]">
                            {row.documentNumber || 'Documento em preparação'}
                          </td>
                          <td className="px-4 py-4">{statusLabel(row.status)}</td>
                          <td className="px-5 py-4">
                            {formatDate(row.lastUpdatedAt ?? row.submittedAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="h-40 text-center text-[var(--fd-muted)]"
                        >
                          Ainda não existem documentos para acompanhar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof RadioTower;
}) {
  return (
    <article className="rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--fd-muted)]">{label}</p>
        <Icon className="h-4 w-4 text-sky-700" />
      </div>
      <p className="mt-3 text-xl font-semibold text-[var(--fd-text-primary)]">
        {value}
      </p>
    </article>
  );
}
