'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  RadioTower,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceManagementNav from '@/components/invoices/InvoiceManagementNav';
import {
  electronicInvoicingError,
  electronicStatusLabel,
  getElectronicReadiness,
  getElectronicSubmissions,
  type ElectronicReadiness,
  type ElectronicSubmission,
} from '@/services/electronic-invoicing';

export default function ElectronicInvoicingPage() {
  const [readiness, setReadiness] = useState<ElectronicReadiness | null>(
    null,
  );
  const [submissions, setSubmissions] = useState<ElectronicSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getElectronicReadiness(), getElectronicSubmissions()])
      .then(([ready, rows]) => {
        setReadiness(ready);
        setSubmissions(rows);
      })
      .catch((requestError) =>
        setError(
          electronicInvoicingError(
            requestError,
            'Não foi possível carregar a situação de facturação electrónica.',
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
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-fd-accent">
            Facturação
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--fd-text-primary)]">
            Facturação Electrónica
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--fd-text-secondary)]">
            Acompanhe a preparação e o estado dos documentos electrónicos.
          </p>
        </header>
        <InvoiceManagementNav className="mt-5" />
        <aside className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Certificação oficial pendente</p>
            <p className="mt-1">
              Esta funcionalidade está em preparação e ainda não representa
              disponibilidade oficial confirmada pela AGT.
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
            <Loader2 className="h-5 w-5 animate-spin text-fd-accent" />
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Disponibilidade"
                value={readiness?.available ? 'Preparada' : 'Pendente'}
                icon={RadioTower}
              />
              <Metric
                label="Pendentes"
                value={String(counts(['READY']))}
                icon={Clock3}
              />
              <Metric
                label="Em processamento"
                value={String(counts(['SUBMITTING', 'SUBMITTED', 'PROCESSING']))}
                icon={Clock3}
              />
              <Metric
                label="Validadas"
                value={String(counts(['VALID']))}
                icon={CheckCircle2}
              />
            </section>
            <section className="mt-6 overflow-hidden rounded-xl border border-[var(--fd-border)] bg-[var(--fd-surface)]">
              <div className="border-b border-[var(--fd-border)] p-5">
                <h2 className="font-semibold text-[var(--fd-text-primary)]">
                  Submissões da empresa
                </h2>
                <p className="mt-1 text-xs text-[var(--fd-muted)]">
                  Situação actual: {electronicStatusLabel(readiness?.status)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-[var(--fd-table-header)] text-xs uppercase text-[var(--fd-muted)]">
                    <tr>
                      <th className="px-5 py-3">Documento</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Mensagem</th>
                      <th className="px-5 py-3">Actualização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--fd-border)]">
                    {submissions.length ? (
                      submissions.map((row, index) => (
                        <tr
                          key={`${row.documentNumber ?? 'documento'}-${row.status}-${index}`}
                        >
                          <td className="px-5 py-4 font-semibold text-fd-accent">
                            {row.documentNumber || 'Documento em preparação'}
                          </td>
                          <td className="px-4 py-4">
                            {electronicStatusLabel(row.status)}
                          </td>
                          <td className="px-4 py-4 text-xs text-[var(--fd-muted)]">
                            {row.message || '—'}
                          </td>
                          <td className="px-5 py-4">
                            {row.lastUpdatedAt
                              ? new Date(row.lastUpdatedAt).toLocaleString(
                                  'pt-AO',
                                )
                              : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="h-40 text-center text-[var(--fd-muted)]"
                        >
                          Ainda não existem submissões electrónicas.
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
        <Icon className="h-4 w-4 text-fd-accent" />
      </div>
      <p className="mt-3 text-xl font-semibold text-[var(--fd-text-primary)]">
        {value}
      </p>
    </article>
  );
}
