'use client';

import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany } from '@/services/company';
import { getCalculationHistory } from '@/services/calculator';

export default function HistoryPage() {
  const [company, setCompany] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
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
    return <div>Carregando...</div>;
  }

  return (
    <DashboardLayout company={company}>
      <h1 className="text-5xl font-bold mb-2">
        Histórico Fiscal
      </h1>

      <p className="text-slate-600 text-xl mb-8">
        Todos os cálculos realizados pela empresa
      </p>

      <div className="bg-white rounded-2xl shadow p-6">

        <input
          type="text"
          placeholder="Pesquisar imposto..."
          className="w-full border rounded-xl p-4 mb-8"
        />

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="text-left p-4">
                Imposto
              </th>

              <th className="text-left p-4">
                Valor
              </th>

              <th className="text-left p-4">
                Taxa
              </th>

              <th className="text-left p-4">
                Resultado
              </th>

              <th className="text-left p-4">
                Data
              </th>
            </tr>
          </thead>

          <tbody>

            {history.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-8 text-slate-500"
                >
                  Nenhum cálculo encontrado
                </td>
              </tr>
            )}

            {history.map((item: any) => (
              <tr
                key={item.id}
                className="border-b"
              >
                <td className="p-4">
                  {item.taxType}
                </td>

                <td className="p-4">
                  {item.baseAmount?.toLocaleString()}
                </td>

                <td className="p-4">
                  {item.taxRate}%
                </td>

                <td className="p-4 font-bold text-green-600">
                  {item.taxAmount?.toLocaleString()} AOA
                </td>

                <td className="p-4">
                  {new Date(
                    item.createdAt,
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>
    </DashboardLayout>
  );
}