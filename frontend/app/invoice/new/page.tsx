'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';
import { getClients } from '@/services/client';
import { createInvoice } from '@/services/invoice';

export default function NewInvoicePage() {
  const router = useRouter();

  const [company, setCompany] =
    useState<any>(null);

  const [clients, setClients] =
    useState<any[]>([]);

  const [clientId, setClientId] =
    useState('');

  const [subtotal, setSubtotal] =
    useState('');

  const [notes, setNotes] =
    useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const companyData =
        await getCompany();

      const clientData =
        await getClients();

      console.log(
        'COMPANY DATA:',
        companyData,
      );

      console.log(
        'CLIENTS:',
        clientData,
      );

      setCompany(companyData);
      setClients(clientData);
    } catch (error) {
      console.error(
        'Erro ao carregar dados:',
        error,
      );
    }
  }

  async function handleSubmit() {
    try {
      if (!clientId) {
        alert(
          'Selecione um cliente',
        );
        return;
      }

      if (!subtotal) {
        alert(
          'Informe o subtotal',
        );
        return;
      }

      const payload = {
        tenantId:
          company.tenantId ||
          company.id,

        clientId,

        subtotal:
          Number(subtotal),

        notes,

        items: [
          {
            productName:
              'Serviço Fiscal',

            quantity: 1,

            unitPrice:
              Number(subtotal),
          },
        ],
      };

      console.log(
        'ENVIANDO FACTURA:',
        payload,
      );
console.log(
  'PAYLOAD ENVIADO:',
  payload,
);
      await createInvoice(
        payload,
      );

      alert(
        'Factura criada com sucesso',
      );

      router.push(
        '/invoice',
      );
    } catch (error) {
      console.error(
        'Erro ao criar factura:',
        error,
      );

      alert(
        'Erro ao criar factura',
      );
    }
  }

  if (!company) {
    return (
      <div className="p-8">
        Carregando...
      </div>
    );
  }

  return (
    <DashboardLayout
      company={company}
    >
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          Nova Factura
        </h1>

        <div className="bg-white rounded-2xl shadow p-6">

          <div className="space-y-5">

            <div>

              <label className="block mb-2 font-medium">
                Cliente
              </label>

              <select
                value={clientId}
                onChange={(e) =>
                  setClientId(
                    e.target.value,
                  )
                }
                className="w-full border rounded-xl p-3"
              >
                <option value="">
                  Selecione
                </option>

                {clients.map(
                  (client) => (
                    <option
                      key={client.id}
                      value={
                        client.id
                      }
                    >
                      {client.name}
                    </option>
                  ),
                )}
              </select>

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Subtotal
              </label>

              <input
                type="number"
                value={subtotal}
                onChange={(e) =>
                  setSubtotal(
                    e.target.value,
                  )
                }
                className="w-full border rounded-xl p-3"
              />

            </div>

            <div>

              <label className="block mb-2 font-medium">
                Observações
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value,
                  )
                }
                rows={4}
                className="w-full border rounded-xl p-3"
              />

            </div>

            <div className="flex gap-3">

              <button
                onClick={
                  handleSubmit
                }
                className="bg-blue-600 text-white px-6 py-3 rounded-xl"
              >
                Emitir Factura
              </button>

              <button
                onClick={() =>
                  router.push(
                    '/invoice',
                  )
                }
                className="bg-slate-200 px-6 py-3 rounded-xl"
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}