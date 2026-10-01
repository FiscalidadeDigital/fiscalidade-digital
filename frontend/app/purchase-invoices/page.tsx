"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Search,
  FileText,
  ChevronDown,
  X,
  Trash2,
  Save,
} from "lucide-react";
import {
  createPurchaseInvoice,
  getPurchaseInvoices,
} from "@/services/purchase-invoice";
import {
  getSuppliers,
  type Supplier,
} from "@/services/supplier";

type InvoiceItem = {
  id: number;
  productName: string;
  quantity: string;
  unitPrice: string;
};

type PurchaseInvoice = {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  issuedAt: string;
  subtotal: number | string;
  iva: number | string;
  withholdingTax: number | string;
  total: number | string;
  status: "PENDING" | "PAID" | "CANCELLED";
};

const emptyItem = (): InvoiceItem => ({
  id: Date.now() + Math.random(),
  productName: "",
  quantity: "1",
  unitPrice: "",
});

const formatCurrency = (value: number | string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [ivaAmount, setIvaAmount] = useState("");
  const [withholdingTax, setWithholdingTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    emptyItem(),
  ]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [invoiceData, supplierData] = await Promise.all([
        getPurchaseInvoices(),
        getSuppliers(),
      ]);
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setSuppliers(supplierData);
    } catch {
      setLoadError(
        "Não foi possível carregar as facturas e os fornecedores. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const suppliersById = useMemo(
    () => new Map(suppliers.map((entry) => [entry.id, entry])),
    [suppliers],
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (suppliersById.get(invoice.supplierId)?.name ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (suppliersById.get(invoice.supplierId)?.nif ?? "").includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter, suppliersById]);

  const iva = Number(ivaAmount);
  const withholding = Number(withholdingTax);

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
    setSupplierId("");
    setIssuedAt("");
    setIvaAmount("");
    setWithholdingTax("");
    setNotes("");
    setItems([emptyItem()]);
  };

  const saveInvoice = async () => {
    if (
      !invoiceNumber.trim() ||
      !supplierId ||
      !issuedAt ||
      ivaAmount.trim() === "" ||
      withholdingTax.trim() === "" ||
      !Number.isFinite(iva) ||
      !Number.isFinite(withholding) ||
      items.some(
        (item) => !item.productName.trim() ||
          !Number.isFinite(Number(item.quantity)) ||
          Number(item.quantity) <= 0 ||
          !Number.isFinite(Number(item.unitPrice)) ||
          Number(item.unitPrice) < 0,
      )
    ) {
      setSaveError("Preencha os dados da factura e confirme valores válidos em todos os itens.");
      return;
    }

    if (iva < 0 || withholding < 0) {
      setSaveError("IVA e retenção têm de ser valores não negativos.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    try {
      await createPurchaseInvoice({
        supplierId,
        invoiceNumber: invoiceNumber.trim(),
        issuedAt,
        iva,
        withholdingTax: withholding,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productName: item.productName.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      await refreshData();
      resetForm();
      setShowModal(false);
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null &&
        "response" in error && typeof error.response === "object" &&
        error.response !== null && "data" in error.response &&
        typeof error.response.data === "object" && error.response.data !== null &&
        "message" in error.response.data && typeof error.response.data.message === "string"
          ? error.response.data.message
          : "Não foi possível registar a factura. Verifique os dados e tente novamente.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
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

          <div className="flex flex-wrap gap-3">
            <Link
              href="/purchase-invoices/import"
              className="flex items-center justify-center gap-2 rounded-xl border border-[#d9ddec] bg-white px-5 py-3 text-sm font-semibold text-[#273558] shadow-sm transition hover:border-[#5146e5]"
            >
              <FileText size={18} />
              Importar documento
            </Link>
            <button
              onClick={() => {
                setSaveError("");
                setShowModal(true);
              }}
              disabled={isLoading || Boolean(loadError)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#5146e5] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#453bd1]"
            >
              <Plus size={19} />
              Nova factura recebida
            </button>
          </div>
        </div>

        {/* RESUMO */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e7eaf2] bg-white p-5">
            <p className="text-sm text-[#7a86a0]">
              Facturas registadas
            </p>

            <p className="mt-2 text-2xl font-bold text-[#0f1b3d]">
              {isLoading ? "…" : loadError ? "—" : invoices.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7eaf2] bg-white p-5">
            <p className="text-sm text-[#7a86a0]">
              Total das facturas
            </p>

            <p className="mt-2 text-2xl font-bold text-[#0f1b3d]">
              {isLoading || loadError ? "—" : formatCurrency(
                invoices.reduce(
                  (sum, invoice) =>
                    sum + Number(invoice.total),
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
              {isLoading || loadError ? "—" : formatCurrency(
                invoices.reduce(
                  (sum, invoice) =>
                    sum + Number(invoice.iva),
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
                <option value="PENDING">
                  Pendentes
                </option>
                <option value="PAID">
                  Pagas
                </option>
                <option value="CANCELLED">
                  Anuladas
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

          {isLoading ? (
            <div className="px-6 py-16 text-center text-sm text-[#7180a0]">
              A carregar facturas recebidas…
            </div>
          ) : loadError ? (
            <div className="px-6 py-16 text-center">
              <p role="alert" className="text-sm text-red-700">{loadError}</p>
              <button
                onClick={() => void refreshData()}
                className="mt-4 rounded-xl border border-[#dfe4ee] px-4 py-2 text-sm font-semibold"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredInvoices.length === 0 ? (
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
                onClick={() => {
                  setSaveError("");
                  setShowModal(true);
                }}
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
                            {suppliersById.get(invoice.supplierId)?.name ?? "Fornecedor indisponível"}
                          </div>

                          <div className="text-xs text-[#8792aa]">
                            {suppliersById.get(invoice.supplierId)?.nif ||
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
                          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            invoice.status === "PAID"
                              ? "bg-[#eafaf3] text-[#0b9b68]"
                              : invoice.status === "CANCELLED"
                                ? "bg-[#fff0f0] text-[#c33]"
                                : "bg-[#fff6e5] text-[#986500]"
                          }`}>
                            {invoice.status === "PAID"
                              ? "Paga"
                              : invoice.status === "CANCELLED"
                                ? "Anulada"
                                : "Pendente"}
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
              {saveError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </p>
              )}

              {suppliers.length === 0 && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Não há fornecedores disponíveis nesta empresa. Crie um fornecedor antes de registar a factura.
                </p>
              )}

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

                    {suppliers.length > 0 ? (
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full rounded-xl border border-[#dfe4ee] bg-white px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                      >
                        <option value="">Seleccione um fornecedor</option>
                        {suppliers.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.name}{entry.nif ? ` — ${entry.nif}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        Registe primeiro um <Link href="/suppliers" className="font-semibold underline">fornecedor</Link>.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      NIF do fornecedor
                    </label>
                    <p className="rounded-xl border border-[#dfe4ee] bg-[#fafbfe] px-4 py-3 text-sm text-[#56627e]">
                      {suppliersById.get(supplierId)?.nif || "NIF não informado"}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      IVA indicado na factura (AOA) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={ivaAmount}
                      onChange={(e) => setIvaAmount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-[#dfe4ee] px-4 py-3 text-sm outline-none focus:border-[#5146e5]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Retenção indicada na factura (AOA) *
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
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

                  <p className="text-xs text-[#7180a0] lg:col-span-2">
                    Os valores de IVA e retenção são registados conforme o documento de origem; esta página não calcula nem valida taxas fiscais.
                  </p>
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
                  <table className="w-full min-w-[700px]">
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
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => (
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
                                step="0.001"
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
                                step="0.01"
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="ml-auto max-w-md rounded-2xl bg-[#f8f8ff] p-5 text-sm text-[#56627e]">
                O subtotal e o total apresentados depois do registo vêm da API. Esta página não estima impostos nem arredondamentos.
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
                disabled={isSaving || suppliers.length === 0}
                className="flex items-center gap-2 rounded-xl bg-[#5146e5] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={17} />
                {isSaving ? "A registar…" : "Registar factura"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
