"use client";

import { useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Search,
  FileText,
  CalendarDays,
  ChevronDown,
  X,
  Trash2,
  Save,
  Upload,
} from "lucide-react";

type InvoiceItem = {
  id: number;
  productName: string;
  quantity: string;
  unitPrice: string;
  ivaRate: string;
};

type PurchaseInvoice = {
  id: number;
  invoiceNumber: string;
  supplier: string;
  supplierNif: string;
  issuedAt: string;
  subtotal: number;
  iva: number;
  withholdingTax: number;
  total: number;
  status: "PENDING" | "REGISTERED";
};

const initialInvoices: PurchaseInvoice[] = [];

const emptyItem = (): InvoiceItem => ({
  id: Date.now() + Math.random(),
  productName: "",
  quantity: "1",
  unitPrice: "",
  ivaRate: "14",
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] =
    useState<PurchaseInvoice[]>(initialInvoices);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierNif, setSupplierNif] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [withholdingTax, setWithholdingTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    emptyItem(),
  ]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        invoice.supplier
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        invoice.supplierNif.includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;

      return sum + quantity * unitPrice;
    }, 0);
  }, [items]);

  const iva = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const rate = Number(item.ivaRate) || 0;

      const base = quantity * unitPrice;

      return sum + base * (rate / 100);
    }, 0);
  }, [items]);

  const withholding = Number(withholdingTax) || 0;

  const total = subtotal + iva - withholding;

  const updateItem = (
    id: number,
    field: keyof InvoiceItem,
    value: string,
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      emptyItem(),
    ]);
  };

  const removeItem = (id: number) => {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (item) => item.id !== id,
      );
    });
  };

  const resetForm = () => {
    setInvoiceNumber("");
    setSupplier("");
    setSupplierNif("");
    setIssuedAt("");
    setWithholdingTax("0");
    setNotes("");
    setItems([emptyItem()]);
  };

  const saveInvoice = () => {
    if (
      !invoiceNumber ||
      !supplier ||
      !issuedAt ||
      items.some(
        (item) =>
          !item.productName ||
          !item.quantity ||
          !item.unitPrice,
      )
    ) {
      alert(
        "Preencha os dados da factura e todos os itens.",
      );

      return;
    }

    const newInvoice: PurchaseInvoice = {
      id: Date.now(),
      invoiceNumber,
      supplier,
      supplierNif,
      issuedAt,
      subtotal,
      iva,
      withholdingTax: withholding,
      total,
      status: "REGISTERED",
    };

    setInvoices((current) => [
      newInvoice,
      ...current,
    ]);

    resetForm();
    setShowModal(false);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7f9fc] p-6 lg:p-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-[#7180a0]">
              <FileText size={16} />
              Fiscalidade / Facturas Recebidas
            </div>

            <h1 className="text-3xl font-bold text-[#0f1b3d]">
              Facturas Recebidas
            </h1>

            <p className="mt-2 text-sm text-[#7180a0]">
              Registe as facturas recebidas dos seus
              fornecedores e mantenha os dados fiscais
              organizados.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#5146e5] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#453bd1]"
          >
            <Plus size={19} />
            Nova factura recebida
          </button>
        </div>

        {/* RESUMO */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e7eaf2] bg-white p-5">
            <p className="text-sm text-[#7a86a0]">
              Facturas registadas
            </p>

            <p className="mt-2 text-2xl font-bold text-[#0f1b3d]">
              {invoices.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7eaf2] bg-white p-5">
            <p className="text-sm text-[#7a86a0]">
              Total das facturas
            </p>

            <p className="mt-2 text-2xl font-bold text-[#0f1b3d]">
              {formatCurrency(
                invoices.reduce(
                  (sum, invoice) =>
                    sum + invoice.total,
                  0,
                ),
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7eaf2] bg-white p-5">
            <p className="text-sm text-[#7a86a0]">
              IVA suportado
            </p>

            <p className="mt-2 text-2xl font-bold text-[#0f1b3d]">
              {formatCurrency(
                invoices.reduce(
                  (sum, invoice) =>
                    sum + invoice.iva,
                  0,
                ),
              )}
            </p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="mb-5 rounded-2xl border border-[#e7eaf2] bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8792aa]"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Pesquisar por factura, fornecedor ou NIF..."
                className="w-full rounded-xl border border-[#e1e5ee] bg-[#fbfcfe] py-3 pl-11 pr-4 text-sm outline-none focus:border-[#5146e5]"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="appearance-none rounded-xl border border-[#e1e5ee] bg-[#fbfcfe] px-4 py-3 pr-10 text-sm outline-none"
              >
                <option value="ALL">
                  Todos os estados
                </option>
                <option value="REGISTERED">
                  Registadas
                </option>
                <option value="PENDING">
                  Pendentes
                </option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7180a0]"
              />
            </div>
          </div>
        </div>

        {/* TABELA */}
        <div className="overflow-hidden rounded-2xl border border-[#e7eaf2] bg-white">
          <div className="border-b border-[#eef0f5] px-6 py-5">
            <h2 className="font-bold text-[#0f1b3d]">
              Registo de facturas
            </h2>

            <p className="mt-1 text-sm text-[#7a86a0]">
              Facturas recebidas pela empresa.
            </p>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0efff] text-[#5146e5]">
                <FileText size={26} />
              </div>

              <h3 className="font-semibold text-[#0f1b3d]">
                Nenhuma factura encontrada
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-[#7a86a0]">
                Comece por registar uma factura recebida
                de um fornecedor.
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="mt-5 rounded-xl bg-[#5146e5] px-5 py-3 text-sm font-semibold text-white"
              >
                Registar primeira factura
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#eef0f5] bg-[#fafbfe] text-left text-xs uppercase tracking-wide text-[#7a86a0]">
                    <th className="px-6 py-4">
                      Factura
                    </th>
                    <th className="px-6 py-4">
                      Fornecedor
                    </th>
                    <th className="px-6 py-4">
                      Data
                    </th>
                    <th className="px-6 py-4">
                      Subtotal
                    </th>
                    <th className="px-6 py-4">
                      IVA
                    </th>
                    <th className="px-6 py-4">
                      Total
                    </th>
                    <th className="px-6 py-4">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map(
                    (invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-[#f0f2f6] last:border-0"
                      >
                        <td className="px-6 py-5">
                          <div className="font-semibold text-[#0f1b3d]">
                            {invoice.invoiceNumber}
                          </div>

                          <div className="text-xs text-[#8792aa]">
                            Documento recebido
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="font-medium text-[#24304f]">
                            {invoice.supplier}
                          </div>

                          <div className="text-xs text-[#8792aa]">
                            {invoice.supplierNif ||
                              "NIF não informado"}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-[#56627e]">
                          {new Date(
                            invoice.issuedAt,
                          ).toLocaleDateString(
                            "pt-PT",
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm font-medium">
                          {formatCurrency(
                            invoice.subtotal,
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm font-medium">
                          {formatCurrency(
                            invoice.iva,
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm font-bold text-[#0f1b3d]">
                          {formatCurrency(
                            invoice.total,
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-[#eafaf3] px-3 py-1.5 text-xs font-semibold text-[#0b9b68]">
                            Registada
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1b3d]/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eef0f5] bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#0f1b3d]">
                  Nova factura recebida
                </h2>

                <p className="mt-1 text-sm text-[#7a86a0]">
                  Registe os dados exactamente como
                  constam na factura do fornecedor.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-[#7180a0] hover:bg-[#f4f5f8]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-7 p-6">

              {/* DADOS PRINCIPAIS */}
              <section>
                <h3 className="mb-4 font-bold text-[#0f1b3d]">
                  Dados da factura
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Nº da factura *
                    </label>

                    <input
                      value={invoiceNumber}
                      onChange={(e) =>
                        setInvoiceNumber(
                          e.target.value,
                        )
                      }
                      placeholder="FT 2026/001"
                      className="w-full rounded-xl border border-[#dfe4ee] px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Data de emissão *
                    </label>

                    <input
                      type="date"
                      value={issuedAt}
                      onChange={(e) =>
                        setIssuedAt(e.target.value)
                      }
                      className="w-full rounded-xl border border-[#dfe4ee] px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Fornecedor *
                    </label>

                    <input
                      value={supplier}
                      onChange={(e) =>
                        setSupplier(e.target.value)
                      }
                      placeholder="Nome da empresa fornecedora"
                      className="w-full rounded-xl border border-[#dfe4ee] px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      NIF do fornecedor
                    </label>

                    <input
                      value={supplierNif}
                      onChange={(e) =>
                        setSupplierNif(
                          e.target.value,
                        )
                      }
                      placeholder="500000000"
                      className="w-full rounded-xl border border-[#dfe4ee] px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Retenção
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={withholdingTax}
                      onChange={(e) =>
                        setWithholdingTax(
                          e.target.value,
                        )
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-[#dfe4ee] px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-medium">
                      Documento
                    </label>

                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfd5e3] bg-[#fafbfe] px-4 py-3 text-sm text-[#65718c]"
                    >
                      <Upload size={17} />
                      Anexar factura PDF
                    </button>
                  </div>
                </div>
              </section>

              {/* ITENS */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#0f1b3d]">
                      Itens da factura
                    </h3>

                    <p className="mt-1 text-sm text-[#7a86a0]">
                      Adicione todos os produtos ou
                      serviços constantes no documento.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 rounded-xl border border-[#5146e5] px-4 py-2.5 text-sm font-semibold text-[#5146e5]"
                  >
                    <Plus size={17} />
                    Adicionar item
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#e6e9f0]">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-[#fafbfe]">
                      <tr className="text-left text-xs uppercase text-[#7a86a0]">
                        <th className="px-4 py-3">
                          Produto / Serviço
                        </th>
                        <th className="px-4 py-3">
                          Quantidade
                        </th>
                        <th className="px-4 py-3">
                          Preço unitário
                        </th>
                        <th className="px-4 py-3">
                          IVA %
                        </th>
                        <th className="px-4 py-3">
                          Total
                        </th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => {
                        const itemTotal =
                          (Number(item.quantity) ||
                            0) *
                          (Number(item.unitPrice) ||
                            0);

                        return (
                          <tr
                            key={item.id}
                            className="border-t border-[#eef0f5]"
                          >
                            <td className="px-4 py-3">
                              <input
                                value={
                                  item.productName
                                }
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "productName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Ex.: Computador"
                                className="w-full rounded-lg border border-[#dfe4ee] px-3 py-2.5 text-sm outline-none focus:border-[#5146e5]"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={
                                  item.quantity
                                }
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-28 rounded-lg border border-[#dfe4ee] px-3 py-2.5 text-sm outline-none"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={
                                  item.unitPrice
                                }
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "unitPrice",
                                    e.target.value,
                                  )
                                }
                                placeholder="0"
                                className="w-36 rounded-lg border border-[#dfe4ee] px-3 py-2.5 text-sm outline-none"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                value={
                                  item.ivaRate
                                }
                                onChange={(e) =>
                                  updateItem(
                                    item.id,
                                    "ivaRate",
                                    e.target.value,
                                  )
                                }
                                className="w-24 rounded-lg border border-[#dfe4ee] px-3 py-2.5 text-sm outline-none"
                              />
                            </td>

                            <td className="px-4 py-3 font-semibold">
                              {formatCurrency(
                                itemTotal,
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    item.id,
                                  )
                                }
                                className="rounded-lg p-2 text-[#e65d5d] hover:bg-[#fff0f0]"
                              >
                                <Trash2 size={17} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* RESUMO */}
              <section className="ml-auto max-w-md rounded-2xl bg-[#f8f8ff] p-5">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-[#7180a0]">
                    Subtotal
                  </span>

                  <strong>
                    {formatCurrency(subtotal)}
                  </strong>
                </div>

                <div className="flex justify-between py-2 text-sm">
                  <span className="text-[#7180a0]">
                    IVA
                  </span>

                  <strong>
                    {formatCurrency(iva)}
                  </strong>
                </div>

                <div className="flex justify-between py-2 text-sm">
                  <span className="text-[#7180a0]">
                    Retenção
                  </span>

                  <strong>
                    - {formatCurrency(withholding)}
                  </strong>
                </div>

                <div className="my-2 border-t border-[#dedff2]" />

                <div className="flex justify-between py-2">
                  <span className="font-bold text-[#0f1b3d]">
                    Total
                  </span>

                  <strong className="text-xl text-[#5146e5]">
                    {formatCurrency(total)}
                  </strong>
                </div>
              </section>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Observações
                </label>

                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                  placeholder="Observações sobre a factura..."
                  rows={3}
                  className="w-full rounded-xl border border-[#dfe4ee] px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#eef0f5] bg-white px-6 py-4">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
                className="rounded-xl border border-[#dfe4ee] px-5 py-3 text-sm font-semibold text-[#53607c]"
              >
                Cancelar
              </button>

              <button
                onClick={saveInvoice}
                className="flex items-center gap-2 rounded-xl bg-[#5146e5] px-5 py-3 text-sm font-semibold text-white"
              >
                <Save size={17} />
                Registar factura
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
