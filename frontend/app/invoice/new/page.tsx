'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany } from '@/services/company';
import { getClients } from '@/services/client';
import { createInvoice } from '@/services/invoice';

type Item = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<Item[]>([
    { productName: '', quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setError('');
      const [companyData, clientData] = await Promise.all([
        getCompany(),
        getClients(),
      ]);
      setCompany(companyData);
      setClients(Array.isArray(clientData) ? clientData : []);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os dados da empresa.');
    }
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (field === 'productName') {
          return { ...item, productName: value };
        }
        const numeric = Number(value);
        return {
          ...item,
          [field]: Number.isFinite(numeric) ? numeric : 0,
        };
      }),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { productName: '', quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems((current) => current.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const iva = subtotal * 0.14;
  const retentionRate =
    Number(company?.retentionRate ?? 0) > 0
      ? Number(company.retentionRate) / 100
      : company?.regime === 'GERAL'
        ? 0.065
        : 0;
  const withholdingTax = subtotal * retentionRate;
  const total = subtotal + iva - withholdingTax;

  function money(value: number) {
    return `${value.toLocaleString('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} Kz`;
  }

  async function handleSubmit() {
    try {
      setError('');

      if (!clientId) {
        setError('Selecione um cliente.');
        return;
      }

      if (!items.length) {
        setError('Adicione pelo menos um item.');
        return;
      }

      const invalid = items.some(
        (item) =>
          !item.productName.trim() ||
          item.quantity <= 0 ||
          item.unitPrice <= 0 ||
          !Number.isFinite(item.quantity) ||
          !Number.isFinite(item.unitPrice),
      );

      if (invalid) {
        setError('Preencha correctamente todos os itens.');
        return;
      }

      setLoading(true);

      const invoice = await createInvoice({
        clientId,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productName: item.productName.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      alert(
        `Factura ${invoice?.invoiceNumber ?? ''} criada com sucesso.`,
      );
      router.push('/invoice');
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          'Erro ao criar factura.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!company) {
    return <div className="p-8">{error || 'Carregando...'}</div>;
  }

  return (
    <DashboardLayout company={company}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.push('/invoice')}
            className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold mb-2">
              <FileText size={18} /> Facturação
            </div>
            <h1 className="text-4xl font-bold">Nova Factura</h1>
            <p className="text-slate-500 mt-2">
              Registe uma nova factura da sua empresa.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-8">
          <section>
            <h2 className="text-xl font-bold">Dados da factura</h2>
            <div className="grid md:grid-cols-2 gap-6 mt-5">
              <div>
                <label className="block mb-2 font-medium">Cliente</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={loading}
                  className="w-full border rounded-xl p-3.5"
                >
                  <option value="">Seleccione o cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                      {client.nif ? ` — NIF: ${client.nif}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Número da factura
                </label>
                <div className="border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl p-3.5 font-semibold">
                  Gerado automaticamente
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  O próximo número é atribuído pelo backend por empresa e ano.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Produtos / Serviços</h2>
                <p className="text-slate-500 mt-1">
                  Adicione os itens que fazem parte da factura.
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                disabled={loading}
                className="bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2"
              >
                <Plus size={18} /> Adicionar item
              </button>
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_140px_180px_180px_50px] gap-4 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-500">
                <span>Produto / Serviço</span>
                <span>Quantidade</span>
                <span>Preço unitário</span>
                <span>Total</span>
                <span />
              </div>

              {items.map((item, index) => (
                <div key={index} className="p-5 border-t first:border-t-0">
                  <div className="grid md:grid-cols-[1fr_140px_180px_180px_50px] gap-4 items-end">
                    <input
                      value={item.productName}
                      onChange={(e) =>
                        updateItem(index, 'productName', e.target.value)
                      }
                      disabled={loading}
                      placeholder="Ex.: Consultoria fiscal"
                      className="border rounded-xl p-3"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', e.target.value)
                      }
                      disabled={loading}
                      className="border rounded-xl p-3"
                    />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) =>
                        updateItem(index, 'unitPrice', e.target.value)
                      }
                      disabled={loading}
                      placeholder="0,00"
                      className="border rounded-xl p-3"
                    />
                    <div className="h-[50px] rounded-xl bg-slate-50 border flex items-center px-3 font-semibold">
                      {money(item.quantity * item.unitPrice)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={loading || items.length === 1}
                      className="h-[50px] rounded-xl flex items-center justify-center text-red-500 disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                rows={7}
                placeholder="Observações opcionais..."
                className="w-full border rounded-xl p-3.5 resize-none"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 border p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Calculator size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold">Resumo fiscal</h3>
                  <p className="text-sm text-slate-500">Pré-visualização</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>IVA (14%)</span>
                  <strong>{money(iva)}</strong>
                </div>
                {withholdingTax > 0 && (
                  <div className="flex justify-between">
                    <span>Retenção</span>
                    <strong>-{money(withholdingTax)}</strong>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {money(total)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  O backend recalcula e valida os valores no momento da emissão.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex gap-3">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <div>
              <p className="font-semibold">Numeração automática</p>
              <p className="text-sm text-slate-600">
                O número não é digitado pelo utilizador e segue a sequência existente da empresa.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/invoice')}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-slate-100 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <FileText size={18} />
              {loading ? 'A emitir...' : 'Emitir Factura'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
