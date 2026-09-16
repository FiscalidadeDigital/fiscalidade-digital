'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Calculator,
  CheckCircle2,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';
import { getClients } from '@/services/client';
import { createInvoice } from '@/services/invoice';

type InvoiceItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

export default function NewInvoicePage() {
  const router = useRouter();

  const [company, setCompany] =
    useState<any>(null);

  const [clients, setClients] =
    useState<any[]>([]);

  const [clientId, setClientId] =
    useState('');

  const [items, setItems] =
    useState<InvoiceItem[]>([
      {
        productName: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);

  const [notes, setNotes] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setError('');

      const [
        companyData,
        clientData,
      ] = await Promise.all([
        getCompany(),
        getClients(),
      ]);

      setCompany(
        companyData,
      );

      setClients(
        Array.isArray(
          clientData,
        )
          ? clientData
          : [],
      );
    } catch (error) {
      console.error(
        'Erro ao carregar dados:',
        error,
      );

      setError(
        'Não foi possível carregar os dados da empresa.',
      );
    }
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        productName: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  }

  function removeItem(
    index: number,
  ) {
    setItems((current) => {
      if (
        current.length === 1
      ) {
        return current;
      }

      return current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      );
    });
  }

  function updateItem(
    index: number,
    field: keyof InvoiceItem,
    value: string,
  ) {
    setItems((current) =>
      current.map(
        (
          item,
          itemIndex,
        ) => {
          if (
            itemIndex !== index
          ) {
            return item;
          }

          if (
            field ===
            'productName'
          ) {
            return {
              ...item,
              productName:
                value,
            };
          }

          const numericValue =
            Number(value);

          return {
            ...item,
            [field]:
              Number.isFinite(
                numericValue,
              )
                ? numericValue
                : 0,
          };
        },
      ),
    );
  }

  const subtotal =
    items.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.quantity *
          item.unitPrice,
      0,
    );

  /*
   * Estes valores são apenas
   * uma pré-visualização.
   *
   * O valor definitivo é calculado
   * pelo backend.
   */
  const iva =
    subtotal * 0.14;

  const total =
    subtotal + iva;

  function formatAOA(
    value: number,
  ) {
    return `${Number(
      value || 0,
    ).toLocaleString(
      'pt-AO',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )} Kz`;
  }

  async function handleSubmit() {
    try {
      setError('');

      if (!clientId) {
        setError(
          'Selecione um cliente.',
        );
        return;
      }

      if (
        items.length === 0
      ) {
        setError(
          'Adicione pelo menos um item à factura.',
        );
        return;
      }

      const invalidItem =
        items.find(
          (item) =>
            !item.productName.trim() ||
            !Number.isFinite(
              item.quantity,
            ) ||
            item.quantity <= 0 ||
            !Number.isFinite(
              item.unitPrice,
            ) ||
            item.unitPrice <= 0,
        );

      if (invalidItem) {
        setError(
          'Preencha correctamente a descrição, quantidade e preço de todos os itens.',
        );
        return;
      }

      if (
        subtotal <= 0
      ) {
        setError(
          'O subtotal da factura deve ser maior que zero.',
        );
        return;
      }

      setLoading(true);

      /*
       * IMPORTANTE:
       *
       * Não enviamos:
       *
       * tenantId
       * invoiceNumber
       * IVA
       * retenção
       * total
       *
       * O backend é responsável por
       * determinar esses dados.
       */
      const invoice =
        await createInvoice({
          clientId,
          notes:
            notes.trim() ||
            undefined,
          items:
            items.map(
              (item) => ({
                productName:
                  item.productName.trim(),
                quantity:
                  item.quantity,
                unitPrice:
                  item.unitPrice,
              }),
            ),
        });

      alert(
        `Factura ${
          invoice?.invoiceNumber ??
          ''
        } criada com sucesso.`,
      );

      router.push(
        '/invoice',
      );
    } catch (error: any) {
      console.error(
        'Erro ao criar factura:',
        error,
      );

      const message =
        error?.response?.data
          ?.message;

      setError(
        Array.isArray(
          message,
        )
          ? message.join(
              ', ',
            )
          : message ||
              'Erro ao criar factura.',
      );
    } finally {
      setLoading(false);
    }
  }

  if (!company) {
    return (
      <div className="p-8">
        {error ||
          'Carregando...'}
      </div>
    );
  }

  return (
    <DashboardLayout
      company={company}
    >
      <div className="max-w-6xl mx-auto">

        <div className="flex items-start gap-4 mb-8">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/invoice',
              )
            }
            className="mt-1 w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50"
          >
            <ArrowLeft
              size={20}
            />
          </button>

          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <FileText
                size={18}
              />

              <span className="font-semibold">
                Facturação
              </span>
            </div>

            <h1 className="text-4xl font-bold text-slate-900">
              Nova Factura
            </h1>

            <p className="text-slate-500 mt-2">
              Registe uma nova factura da sua empresa.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Dados da factura
            </h2>

            <p className="text-slate-500 mt-1">
              Seleccione o cliente e adicione os produtos ou serviços.
            </p>
          </div>

          <div className="p-6 space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block mb-2 font-medium text-slate-800">
                  Cliente
                </label>

                <select
                  value={
                    clientId
                  }
                  onChange={(
                    event,
                  ) =>
                    setClientId(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    loading
                  }
                  className="w-full border border-slate-200 rounded-xl p-3.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">
                    Seleccione o cliente
                  </option>

                  {clients.map(
                    (
                      client,
                    ) => (
                      <option
                        key={
                          client.id
                        }
                        value={
                          client.id
                        }
                      >
                        {
                          client.name
                        }

                        {client.nif
                          ? ` — NIF: ${client.nif}`
                          : ''}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-slate-800">
                  Número da factura
                </label>

                <div className="w-full border border-indigo-200 bg-indigo-50 rounded-xl p-3.5 text-indigo-700 font-semibold">
                  Gerado automaticamente
                </div>

                <p className="text-sm text-slate-500 mt-2">
                  O servidor atribui o próximo número disponível da empresa.
                </p>
              </div>

            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
              <CheckCircle2
                size={20}
                className="text-emerald-600 mt-0.5"
              />

              <div>
                <p className="font-semibold text-slate-800">
                  Numeração automática
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  A sequência é controlada pelo backend por empresa e ano.
                </p>
              </div>
            </div>

            <div>

              <div className="flex items-center justify-between mb-4">

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Produtos / Serviços
                  </h2>

                  <p className="text-slate-500 mt-1">
                    Adicione os itens da factura.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    addItem
                  }
                  disabled={
                    loading
                  }
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2"
                >
                  <Plus
                    size={18}
                  />

                  Adicionar item
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden">

                <div className="hidden md:grid grid-cols-[1fr_140px_180px_180px_50px] gap-4 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-500">
                  <span>
                    Produto / Serviço
                  </span>

                  <span>
                    Quantidade
                  </span>

                  <span>
                    Preço unitário
                  </span>

                  <span>
                    Total
                  </span>

                  <span />
                </div>

                <div className="divide-y divide-slate-200">

                  {items.map(
                    (
                      item,
                      index,
                    ) => {
                      const itemTotal =
                        item.quantity *
                        item.unitPrice;

                      return (
                        <div
                          key={
                            index
                          }
                          className="p-5"
                        >

                          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_180px_180px_50px] gap-4 items-end">

                            <div>
                              <label className="block md:hidden mb-2 text-sm font-medium">
                                Produto / Serviço
                              </label>

                              <input
                                type="text"
                                value={
                                  item.productName
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateItem(
                                    index,
                                    'productName',
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                disabled={
                                  loading
                                }
                                placeholder="Ex.: Serviço de consultoria"
                                className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block md:hidden mb-2 text-sm font-medium">
                                Quantidade
                              </label>

                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateItem(
                                    index,
                                    'quantity',
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                disabled={
                                  loading
                                }
                                className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block md:hidden mb-2 text-sm font-medium">
                                Preço unitário
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={
                                  item.unitPrice ||
                                  ''
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateItem(
                                    index,
                                    'unitPrice',
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                disabled={
                                  loading
                                }
                                placeholder="0,00"
                                className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block md:hidden mb-2 text-sm font-medium">
                                Total
                              </label>

                              <div className="h-[50px] flex items-center px-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold">
                                {formatAOA(
                                  itemTotal,
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeItem(
                                  index,
                                )
                              }
                              disabled={
                                loading ||
                                items.length ===
                                  1
                              }
                              className="h-[50px] rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 disabled:opacity-30"
                              title="Remover item"
                            >
                              <Trash2
                                size={18}
                              />
                            </button>

                          </div>
                        </div>
                      );
                    },
                  )}

                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div>
                <label className="block mb-2 font-medium text-slate-800">
                  Observações
                </label>

                <textarea
                  value={
                    notes
                  }
                  onChange={(
                    event,
                  ) =>
                    setNotes(
                      event.target
                        .value,
                    )
                  }
                  rows={6}
                  disabled={
                    loading
                  }
                  placeholder="Observações opcionais..."
                  className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Calculator
                      size={20}
                      className="text-indigo-600"
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Resumo fiscal
                    </h3>

                    <p className="text-sm text-slate-500">
                      Pré-visualização
                    </p>
                  </div>
                </div>

                <div className="space-y-3">

                  <div className="flex justify-between text-slate-600">
                    <span>
                      Subtotal
                    </span>

                    <span className="font-medium">
                      {formatAOA(
                        subtotal,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>
                      IVA (14%)
                    </span>

                    <span className="font-medium">
                      {formatAOA(
                        iva,
                      )}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mt-4 flex justify-between items-center">
                    <span className="font-bold text-slate-900">
                      Total estimado
                    </span>

                    <span className="text-2xl font-bold text-indigo-600">
                      {formatAOA(
                        total,
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 pt-2">
                    O cálculo definitivo é validado pelo backend no momento da emissão.
                  </p>

                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/invoice',
                  )
                }
                disabled={
                  loading
                }
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 font-semibold text-slate-700"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleSubmit
                }
                disabled={
                  loading
                }
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2"
              >
                <FileText
                  size={18}
                />

                {loading
                  ? 'A emitir...'
                  : 'Emitir Factura'}
              </button>

            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}