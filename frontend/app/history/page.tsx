'use client';

import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  EmptyState,
  PageHeader,
  Skeleton,
} from '@/components/ui/enterprise';
import { getCompany } from '@/services/company';
import { getCalculationHistory } from '@/services/calculator';

const money = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function HistoryPage() {
  const [company, setCompany] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    const companyData = await getCompany();
    setCompany(companyData);

    try {
      const data =
        await getCalculationHistory();

      setHistory(data);
    } catch {
      setHistory([]);
    }
  }

  if (!company) {
    return (
      <DashboardLayout>
        <main className="mx-auto w-full max-w-[1500px]">
          <div className="space-y-4">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-5 w-96 max-w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout company={company}>
      <main className="mx-auto w-full max-w-[1500px]">
        <PageHeader
          eyebrow="Simulador fiscal"
          title="Histórico fiscal"
          description="Consulte os cálculos guardados pela empresa, com valores e datas no formato local."
        />

        <section className="fd-panel mt-6">
          <div className="border-b border-[var(--fd-border)] p-4">
            <label className="relative block max-w-xl">
              <span className="sr-only">Pesquisar imposto</span>
              <input
                type="text"
                placeholder="Pesquisar imposto..."
                className="h-11 w-full border bg-[var(--fd-input)] px-3 text-sm outline-none focus:border-fd-accent focus:ring-2 focus:ring-fd-focus"
              />
            </label>
          </div>

          {history.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr>
                    <th className="px-5 py-3">Imposto</th>
                    <th className="px-4 py-3 text-right">Valor base</th>
                    <th className="px-4 py-3 text-right">Taxa</th>
                    <th className="px-4 py-3 text-right">Resultado</th>
                    <th className="px-5 py-3 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fd-border)]">
                  {history.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4 font-semibold text-[var(--fd-text-primary)]">
                        {item.taxType}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-[var(--fd-text-secondary)]">
                        {money.format(Number(item.baseAmount || 0))}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-[var(--fd-text-secondary)]">
                        {item.taxRate}%
                      </td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums text-fd-success">
                        {money.format(Number(item.taxAmount || 0))}
                      </td>
                      <td className="px-5 py-4 text-right text-[var(--fd-text-secondary)]">
                        {new Date(item.createdAt).toLocaleDateString('pt-AO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Ainda não existem cálculos guardados"
              description="Os cálculos realizados pela empresa aparecerão aqui."
            />
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
