'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  Download,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany } from '@/services/company';
import {
  cancelInvoice,
  getInvoices,
  markInvoicePaid,
  openInvoicePdf,
} from '@/services/invoice';

export default function InvoicePage() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadData(refresh = false) {
    try {
      setError('');
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [companyData, invoiceData] = await Promise.all([
        getCompany(),
        getInvoices(),
      ]);

      setCompany(companyData);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Não foi possível carregar as facturas.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const stats = useMemo(() => {
    const active = invoices.filter((i) => i.status !== 'CANCELLED');
    const paid = invoices.filter((i) => i.status === 'PAID');
    const pending = invoices.filter((i) => i.status === 'PENDING');

    return {
      count: invoices.length,
      total: active.reduce((s, i) => s + Number(i.total || 0), 0),
      paid: paid.reduce((s, i) => s + Number(i.total || 0), 0),
      pending: pending.reduce((s, i) => s + Number(i.total || 0), 0),
    };
  }, [invoices]);

  function money(value: number) {
    return `${Number(value || 0).toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Kz`;
  }

  async function handlePay(id: string) {
    if (!window.confirm('Tem a certeza de que deseja marcar esta factura como paga?')) return;
    try {
      await markInvoicePaid(id);
      await loadData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao actualizar factura.');
    }
  }

  async function handleCancel(id: string) {
    if (!window.confirm('Tem a certeza de que deseja cancelar esta factura?')) return;
    try {
      await cancelInvoice(id);
      await loadData(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao cancelar factura.');
    }
  }

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!company) return <div className="p-8">{error || 'Empresa não encontrada.'}</div>;

  return (
    <DashboardLayout company={company}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
              <FileText size={18} /> Gestão Financeira
            </div>
            <h1 className="text-4xl font-bold">Facturação</h1>
            <p className="text-slate-500 mt-2">
              Gestão de facturas emitidas pela empresa.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="px-4 py-3 rounded-xl bg-white border flex items-center gap-2 font-semibold disabled:opacity-50"
            >
              <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => router.push('/invoice/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-semibold"
            >
              <Plus size={18} /> Nova Factura
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border p-6">
            <p className="text-sm text-slate-500">Facturas emitidas</p>
            <p className="text-3xl font-bold mt-2">{stats.count}</p>
          </div>
          <div className="bg-white rounded-2xl border p-6">
            <p className="text-sm text-slate-500">Total facturado</p>
            <p className="text-2xl font-bold mt-2">{money(stats.total)}</p>
          </div>
          <div className="bg-white rounded-2xl border p-6">
            <p className="text-sm text-slate-500">Total recebido</p>
            <p className="text-2xl font-bold mt-2">{money(stats.paid)}</p>
          </div>
          <div className="bg-white rounded-2xl border p-6">
            <p className="text-sm text-slate-500">Por receber</p>
            <p className="text-2xl font-bold mt-2">{money(stats.pending)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-blue-600" />
              <div>
                <h2 className="font-semibold text-lg">Facturas Emitidas</h2>
                <p className="text-sm text-slate-500">Todas as facturas registadas pela empresa.</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4">Factura</th>
                  <th className="text-left p-4">Cliente</th>
                  <th className="text-left p-4">Subtotal</th>
                  <th className="text-left p-4">IVA</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Estado</th>
                  <th className="text-center p-4">Acções</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      Nenhuma factura registada.
                    </td>
                  </tr>
                ) : invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-semibold">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-slate-400">
                        {invoice.createdAt
                          ? new Date(invoice.createdAt).toLocaleDateString('pt-AO')
                          : '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{invoice.client?.name || 'Cliente'}</div>
                      {invoice.client?.nif && (
                        <div className="text-xs text-slate-400">NIF: {invoice.client.nif}</div>
                      )}
                    </td>
                    <td className="p-4">{money(invoice.subtotal)}</td>
                    <td className="p-4">{money(invoice.iva)}</td>
                    <td className="p-4 font-bold">{money(invoice.total)}</td>
                    <td className="p-4">
                      {invoice.status === 'PAID' && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm inline-flex items-center gap-1">
                          <CheckCircle size={14} /> Paga
                        </span>
                      )}
                      {invoice.status === 'PENDING' && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Pendente</span>
                      )}
                      {invoice.status === 'CANCELLED' && (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm inline-flex items-center gap-1">
                          <XCircle size={14} /> Cancelada
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button
                          type="button"
                          onClick={() => void openInvoicePdf(invoice.id)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-1"
                        >
                          <Download size={14} /> PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/invoice/${invoice.id}`)}
                          className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-1"
                        >
                          <Eye size={14} /> Ver
                        </button>
                        {invoice.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => void handlePay(invoice.id)}
                              className="bg-green-600 text-white px-3 py-2 rounded-lg"
                            >
                              Pagar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleCancel(invoice.id)}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
