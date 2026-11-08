"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader } from "@/components/ui/enterprise";
import revenueService from "@/services/revenue";

const money = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function RevenuePage() {
  const [revenues, setRevenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const data = await revenueService.findAll();
      setRevenues(data);
    } catch (requestError) {
      console.error(requestError);
      setError("Não foi possível carregar as receitas da empresa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1500px]">
        <PageHeader
          eyebrow="Gestão financeira"
          title="Receitas da empresa"
          description="Acompanhe os valores registados por período."
        />

        <section className="fd-panel mt-6">
          {error ? (
            <p role="alert" className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-800">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="grid min-h-56 place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-fd-accent" aria-label="A carregar receitas" />
            </div>
          ) : revenues.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr>
                    <th className="px-5 py-3">Mês</th>
                    <th className="px-4 py-3 text-right">Ano</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-5 py-3">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--fd-border)]">
                  {revenues.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4 font-semibold text-[var(--fd-text-primary)]">
                        {item.month}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-[var(--fd-text-secondary)]">
                        {item.year}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums text-[var(--fd-text-primary)]">
                        {money.format(Number(item.amount || 0))}
                      </td>
                      <td className="px-5 py-4 text-[var(--fd-text-secondary)]">
                        {item.notes || "Sem observações"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Ainda não existem receitas registadas"
              description="Quando houver valores registados, serão apresentados aqui por período."
            />
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
