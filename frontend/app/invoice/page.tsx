'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';

import {
  getInvoices,
  markInvoicePaid,
  cancelInvoice,
  openInvoicePdf,
} from '@/services/invoice';

import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function InvoicePage() {
  const router = useRouter();

  const [company, setCompany] =
    useState<any>(null);

  const [invoices, setInvoices] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const companyData =
        await getCompany();

      const invoiceData =
        await getInvoices();

      setCompany(companyData);
      setInvoices(invoiceData);
    } catch (error) {
      console.error(
        'Erro ao carregar facturas:',
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(
    id: string,
  ) {
    try {
      await markInvoicePaid(id);

      alert(
        'Factura marcada como paga.',
      );

      loadData();
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao actualizar factura.',
      );
    }
  }

  async function handleCancel(
    id: string,
  ) {
    try {
      await cancelInvoice(id);

      alert(
        'Factura cancelada.',
      );

      loadData();
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao cancelar factura.',
      );
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        Carregando...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8">
        Empresa não encontrada.
      </div>
    );
  }

  return (
    <DashboardLayout company={company}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            Facturação
          </h1>

          <p className="text-slate-500">
            Gestão de facturas emitidas
          </p>
        </div>

        <button
          onClick={() =>
            router.push('/invoice/new')
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Nova Factura
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-5 border-b flex items-center gap-3">
          <FileText
            size={22}
            className="text-blue-600"
          />

          <span className="font-semibold text-lg">
            Facturas Emitidas
          </span>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">
                Factura
              </th>

              <th className="text-left p-4">
                Cliente
              </th>

              <th className="text-left p-4">
                Total
              </th>

              <th className="text-left p-4">
                Estado
              </th>

              <th className="text-center p-4">
                Acções
              </th>
            </tr>
          </thead>

          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-slate-500"
                >
                  Nenhuma factura registada.
                </td>
              </tr>
            )}

            {invoices.map(
              (invoice: any) => (
                <tr
                  key={invoice.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="p-4 font-semibold">
                    {invoice.invoiceNumber}
                  </td>

                  <td className="p-4">
                    {invoice.client?.name}
                  </td>

                  <td className="p-4">
                    {Number(
                      invoice.total,
                    ).toLocaleString()}
                    {' '}
                    AOA
                  </td>

                  <td className="p-4">
                    {invoice.status ===
                      'PAID' && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        Paga
                      </span>
                    )}

                    {invoice.status ===
                      'PENDING' && (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                        Pendente
                      </span>
                    )}

                    {invoice.status ===
                      'CANCELLED' && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                        Cancelada
                      </span>
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex gap-2 justify-center flex-wrap">

                      <button
                        onClick={() =>
                          openInvoicePdf(
                            invoice.id,
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                      >
                        PDF
                      </button>

                      {invoice.status ===
                        'PENDING' && (
                        <>
                          <button
                            onClick={() =>
                              handlePay(
                                invoice.id,
                              )
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                          >
                            <CheckCircle size={14} />
                            Pagar
                          </button>

                          <button
                            onClick={() =>
                              handleCancel(
                                invoice.id,
                              )
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                          >
                            <XCircle size={14} />
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}