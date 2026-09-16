'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import {
  getInvoices,
  markInvoicePaid,
  cancelInvoice,
  openInvoicePdf,
} from '@/services/invoice';

type Invoice = {
  id: string;
  invoiceNumber?: string;
  number?: string;

  subtotal?: number | string;
  iva?: number | string;
  vat?: number | string;
  total?: number | string;

  status?: string;

  notes?: string;

  client?: {
    id?: string;
    name?: string;
    nif?: string;
  };

  clientId?: string;

  createdAt?: string;
};

const money = (value: number) =>
  new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');

  const [error, setError] = useState('');

  async function loadInvoices() {
    try {
      setError('');

      const response = await getInvoices();

      console.log('FACTURAS RECEBIDAS DO BACKEND:', response);

      let data: any[] = [];

      if (Array.isArray(response)) {
        data = response;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      } else if (Array.isArray(response?.invoices)) {
        data = response.invoices;
      } else if (Array.isArray(response?.items)) {
        data = response.items;
      }

      setInvoices(data);
    } catch (err: any) {
      console.error('Erro ao carregar facturas:', err);

      setError(
        err?.response?.data?.message ||
          'Não foi possível carregar as facturas.',
      );

      setInvoices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadInvoices();
  }

  async function handlePay(id: string) {
    try {
      await markInvoicePaid(id);

      await loadInvoices();
    } catch (err) {
      console.error('Erro ao pagar factura:', err);

      alert('Não foi possível actualizar a factura.');
    }
  }

  async function handleCancel(id: string) {
    const confirmed = window.confirm(
      'Tem certeza que deseja cancelar esta factura?',
    );

    if (!confirmed) {
      return;
    }

    try {
      await cancelInvoice(id);

      await loadInvoices();
    } catch (err) {
      console.error('Erro ao cancelar factura:', err);

      alert('Não foi possível cancelar a factura.');
    }
  }

  const filteredInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return invoices;
    }

    return invoices.filter((invoice) => {
      const invoiceNumber =
        invoice.invoiceNumber ||
        invoice.number ||
        '';

      const clientName =
        invoice.client?.name ||
        '';

      const clientNif =
        invoice.client?.nif ||
        '';

      return (
        String(invoiceNumber)
          .toLowerCase()
          .includes(term) ||
        clientName
          .toLowerCase()
          .includes(term) ||
        clientNif
          .toLowerCase()
          .includes(term)
      );
    });
  }, [invoices, search]);

  const totalFacturado = invoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total || 0),
    0,
  );

  const totalIVA = invoices.reduce(
    (sum, invoice) => {
      if (invoice.iva !== undefined) {
        return sum + Number(invoice.iva || 0);
      }

      if (invoice.vat !== undefined) {
        return sum + Number(invoice.vat || 0);
      }

      const subtotal = Number(
        invoice.subtotal || 0,
      );

      return sum + subtotal * 0.14;
    },
    0,
  );

  const getStatus = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'PAGA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <CheckCircle size={13} />
            Paga
          </span>
        );

      case 'CANCELLED':
      case 'CANCELED':
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <XCircle size={13} />
            Cancelada
          </span>
        );

      default:
        return (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            Pendente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-full bg-[#f7f8fc] p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <RefreshCw
                size={30}
                className="mx-auto animate-spin text-[#5146e5]"
              />

              <p className="mt-4 text-sm text-slate-500">
                A carregar facturas...
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full bg-[#f7f8fc] p-6 lg:p-8">

        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2 text-sm font-semibold text-[#5146e5]">
                <FileText size={18} />
                Fiscalidade Digital
              </div>

              <h1 className="mt-2 text-3xl font-bold text-[#111b3b]">
                Facturas
              </h1>

              <p className="mt-1 text-sm text-[#7180a2]">
                Registe, consulte e acompanhe as facturas da sua empresa.
              </p>

            </div>

            <Link
              href="/invoices/new"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#5146e5]
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-indigo-200
                transition
                hover:bg-[#4338ca]
              "
            >
              <Plus size={18} />
              Nova Factura
            </Link>

          </div>

          {/* RESUMO */}

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">

              <p className="text-sm font-medium text-[#7180a2]">
                Facturas emitidas
              </p>

              <p className="mt-2 text-3xl font-bold text-[#111b3b]">
                {invoices.length}
              </p>

            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">

              <p className="text-sm font-medium text-[#7180a2]">
                Total facturado
              </p>

              <p className="mt-2 text-3xl font-bold text-[#111b3b]">
                {money(totalFacturado)}
              </p>

            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">

              <p className="text-sm font-medium text-[#7180a2]">
                IVA gerado
              </p>

              <p className="mt-2 text-3xl font-bold text-[#111b3b]">
                {money(totalIVA)}
              </p>

            </div>

          </div>

          {/* ERRO */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* FILTROS */}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-col gap-4 md:flex-row md:items-center">

              <div className="relative flex-1">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Pesquisar por número, cliente ou NIF..."
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    py-3
                    pl-11
                    pr-4
                    text-sm
                    outline-none
                    transition
                    focus:border-[#5146e5]
                    focus:bg-white
                  "
                />

              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-50
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                Atualizar
              </button>

            </div>

          </div>

          {/* LISTA */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <h2 className="text-lg font-bold text-[#111b3b]">
                Facturas emitidas
              </h2>

              <p className="mt-1 text-sm text-[#7180a2]">
                Todas as facturas registadas pela empresa.
              </p>

            </div>

            {filteredInvoices.length === 0 ? (

              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-[#5146e5]">
                  <FileText size={30} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#111b3b]">
                  {invoices.length === 0
                    ? 'Ainda não existem facturas'
                    : 'Nenhuma factura encontrada'}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7180a2]">
                  {invoices.length === 0
                    ? 'Comece por emitir uma nova factura.'
                    : 'Tente pesquisar utilizando outro número, cliente ou NIF.'}
                </p>

                {invoices.length === 0 && (
                  <Link
                    href="/invoices/new"
                    className="
                      mt-6
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-[#5146e5]
                      px-5
                      py-3
                      text-sm
                      font-semibold
                      text-white
                      hover:bg-[#4338ca]
                    "
                  >
                    <Plus size={18} />
                    Criar primeira factura
                  </Link>
                )}

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px]">

                  <thead className="bg-slate-50">

                    <tr>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Factura
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Cliente
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Subtotal
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        IVA
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Total
                      </th>

                      <th className="p-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        Estado
                      </th>

                      <th className="p-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                        Acções
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredInvoices.map(
                      (invoice) => {

                        const invoiceNumber =
                          invoice.invoiceNumber ||
                          invoice.number ||
                          invoice.id;

                        const subtotal =
                          Number(
                            invoice.subtotal || 0,
                          );

                        const iva =
                          invoice.iva !== undefined
                            ? Number(invoice.iva || 0)
                            : invoice.vat !== undefined
                              ? Number(invoice.vat || 0)
                              : subtotal * 0.14;

                        const total =
                          invoice.total !== undefined
                            ? Number(invoice.total || 0)
                            : subtotal + iva;

                        return (
                          <tr
                            key={invoice.id}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >

                            <td className="p-4">

                              <div className="font-bold text-[#111b3b]">
                                {invoiceNumber}
                              </div>

                              {invoice.createdAt && (
                                <div className="mt-1 text-xs text-slate-400">
                                  {new Date(
                                    invoice.createdAt,
                                  ).toLocaleDateString(
                                    'pt-AO',
                                  )}
                                </div>
                              )}

                            </td>

                            <td className="p-4">

                              <div className="font-medium text-slate-700">
                                {invoice.client?.name ||
                                  'Cliente'}
                              </div>

                              {invoice.client?.nif && (
                                <div className="mt-1 text-xs text-slate-400">
                                  NIF: {invoice.client.nif}
                                </div>
                              )}

                            </td>

                            <td className="p-4 text-sm font-medium text-slate-700">
                              {money(subtotal)}
                            </td>

                            <td className="p-4 text-sm font-medium text-slate-700">
                              {money(iva)}
                            </td>

                            <td className="p-4 text-sm font-bold text-[#111b3b]">
                              {money(total)}
                            </td>

                            <td className="p-4">
                              {getStatus(
                                invoice.status,
                              )}
                            </td>

                            <td className="p-4">

                              <div className="flex flex-wrap justify-center gap-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openInvoicePdf(
                                      invoice.id,
                                    )
                                  }
                                  className="
                                    inline-flex
                                    items-center
                                    gap-1
                                    rounded-lg
                                    bg-blue-600
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-white
                                    hover:bg-blue-700
                                  "
                                >
                                  <Download size={14} />
                                  PDF
                                </button>

                                {invoice.status?.toUpperCase() ===
                                  'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePay(
                                          invoice.id,
                                        )
                                      }
                                      className="
                                        inline-flex
                                        items-center
                                        gap-1
                                        rounded-lg
                                        bg-green-600
                                        px-3
                                        py-2
                                        text-xs
                                        font-semibold
                                        text-white
                                        hover:bg-green-700
                                      "
                                    >
                                      <CheckCircle
                                        size={14}
                                      />
                                      Pagar
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCancel(
                                          invoice.id,
                                        )
                                      }
                                      className="
                                        inline-flex
                                        items-center
                                        gap-1
                                        rounded-lg
                                        bg-red-600
                                        px-3
                                        py-2
                                        text-xs
                                        font-semibold
                                        text-white
                                        hover:bg-red-700
                                      "
                                    >
                                      <XCircle
                                        size={14}
                                      />
                                      Cancelar
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    console.log(
                                      'Factura:',
                                      invoice,
                                    )
                                  }
                                  className="
                                    inline-flex
                                    items-center
                                    gap-1
                                    rounded-lg
                                    border
                                    border-slate-200
                                    bg-white
                                    px-3
                                    py-2
                                    text-xs
                                    font-semibold
                                    text-slate-700
                                    hover:bg-slate-50
                                  "
                                >
                                  <Eye size={14} />
                                  Ver
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      },
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
