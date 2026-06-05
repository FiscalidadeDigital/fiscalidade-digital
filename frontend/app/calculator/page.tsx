'use client';

import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany } from '@/services/company';

import {
  calculateIVA,
  calculateRetention,
  calculateIndustrial,
} from '@/services/calculator';

export default function CalculatorPage() {
  const [company, setCompany] = useState<any>(null);

  const [base, setBase] = useState('');

  const [iva, setIva] = useState<any>(null);

  const [retencao, setRetencao] =
    useState<any>(null);

  const [industrial, setIndustrial] =
    useState<any>(null);

  const [custos, setCustos] =
    useState('');

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    const data = await getCompany();
    setCompany(data);
  }

  async function calcularIVA() {
    const result =
      await calculateIVA(
        Number(base),
      );

    setIva(result);
  }

  async function calcularRetencao() {
    const result =
      await calculateRetention(
        Number(base),
      );

    setRetencao(result);
  }

  async function calcularIndustrial() {
    const result =
      await calculateIndustrial(
        Number(base),
        Number(custos),
      );

    setIndustrial(result);
  }

  if (!company) {
    return <div>Carregando...</div>;
  }

  return (
    <DashboardLayout company={company}>
      <h1 className="text-4xl font-bold mb-8">
        Calculadora Fiscal
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow">

          <h2 className="font-bold mb-4">
            IVA
          </h2>

          <input
            type="number"
            placeholder="Base"
            value={base}
            onChange={(e) =>
              setBase(e.target.value)
            }
            className="w-full border p-3 rounded-lg mb-4"
          />

          <button
            onClick={calcularIVA}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Calcular
          </button>

          {iva && (
            <div className="mt-4">
              <p>
                IVA: {iva.iva} AOA
              </p>

              <p>
                Total: {iva.total} AOA
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">

          <h2 className="font-bold mb-4">
            Retenção
          </h2>

          <button
            onClick={calcularRetencao}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg"
          >
            Calcular
          </button>

          {retencao && (
            <div className="mt-4">
              <p>
                Retenção:
                {retencao.retencao}
              </p>

              <p>
                Líquido:
                {retencao.liquido}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">

          <h2 className="font-bold mb-4">
            Industrial
          </h2>

          <input
            type="number"
            placeholder="Receitas"
            value={base}
            onChange={(e) =>
              setBase(e.target.value)
            }
            className="w-full border p-3 rounded-lg mb-3"
          />

          <input
            type="number"
            placeholder="Custos"
            value={custos}
            onChange={(e) =>
              setCustos(
                e.target.value,
              )
            }
            className="w-full border p-3 rounded-lg mb-4"
          />

          <button
            onClick={calcularIndustrial}
            className="bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Calcular
          </button>

          {industrial && (
            <div className="mt-4">
              <p>
                Lucro:
                {industrial.lucro}
              </p>

              <p>
                Imposto:
                {industrial.imposto}
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}