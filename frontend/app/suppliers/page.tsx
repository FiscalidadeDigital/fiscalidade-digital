'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Building2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
  type Supplier,
} from '@/services/supplier';

type FormData = {
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  nif: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<FormData>(EMPTY_FORM);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  async function loadSuppliers(
    refresh = false,
  ) {
    try {
      setError('');

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data =
        await getSuppliers();

      setSuppliers(data);
    } catch (err: any) {
      console.error(
        'Erro ao carregar fornecedores:',
        err,
      );

      setError(
        err?.response?.data?.message ||
          'Não foi possível carregar os fornecedores.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredSuppliers =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return suppliers;
      }

      return suppliers.filter(
        (supplier) =>
          supplier.name
            ?.toLowerCase()
            .includes(term) ||
          supplier.nif
            ?.toLowerCase()
            .includes(term) ||
          supplier.email
            ?.toLowerCase()
            .includes(term) ||
          supplier.phone
            ?.toLowerCase()
            .includes(term),
      );
    }, [suppliers, search]);

  const totalSuppliers =
    suppliers.length;

  const suppliersWithEmail =
    suppliers.filter(
      (supplier) => !!supplier.email,
    ).length;

  const suppliersWithPhone =
    suppliers.filter(
      (supplier) => !!supplier.phone,
    ).length;

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function openEditModal(
    supplier: Supplier,
  ) {
    setEditingId(supplier.id);

    setForm({
      name: supplier.name || '',
      nif: supplier.nif || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });

    setError('');
    setSuccess('');
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  function updateField(
    field: keyof FormData,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        'Informe o nome do fornecedor.',
      );

      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        name: form.name.trim(),
        nif:
          form.nif.trim() || undefined,
        email:
          form.email.trim() || undefined,
        phone:
          form.phone.trim() || undefined,
        address:
          form.address.trim() || undefined,
        notes:
          form.notes.trim() || undefined,
      };

      if (editingId) {
        await updateSupplier(
          editingId,
          payload,
        );

        setSuccess(
          'Fornecedor actualizado com sucesso.',
        );
      } else {
        await createSupplier(payload);

        setSuccess(
          'Fornecedor criado com sucesso.',
        );
      }

      await loadSuppliers();

      setTimeout(() => {
        setShowModal(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setSuccess('');
      }, 700);
    } catch (err: any) {
      console.error(
        'Erro ao guardar fornecedor:',
        err,
      );

      setError(
        err?.response?.data?.message ||
          'Não foi possível guardar o fornecedor.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    supplier: Supplier,
  ) {
    const confirmed =
      window.confirm(
        `Tem a certeza que deseja eliminar o fornecedor "${supplier.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteSupplier(
        supplier.id,
      );

      setSuppliers((current) =>
        current.filter(
          (item) =>
            item.id !== supplier.id,
        ),
      );

      setSuccess(
        'Fornecedor eliminado com sucesso.',
      );

      setTimeout(() => {
        setSuccess('');
      }, 2500);
    } catch (err: any) {
      console.error(
        'Erro ao eliminar fornecedor:',
        err,
      );

      setError(
        err?.response?.data?.message ||
          'Não foi possível eliminar o fornecedor.',
      );
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-full bg-[#f7f8fc] p-6 lg:p-8">

        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-2 text-sm font-semibold text-[#5146e5]">
                <Building2 size={18} />

                Fiscalidade Digital
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111b3b]">
                Fornecedores
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-[#7180a2]">
                Registe, consulte e organize os
                fornecedores da sua empresa.
              </p>

            </div>

            <button
              type="button"
              onClick={openCreateModal}
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

              Novo fornecedor
            </button>

          </div>

          {/* ALERTAS */}

          {error && !showModal && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && !showModal && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {success}
            </div>
          )}

          {/* RESUMO */}

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-[#7180a2]">
                    Total de fornecedores
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#111b3b]">
                    {totalSuppliers}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#5146e5]">
                  <Building2 size={23} />
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-[#7180a2]">
                    Com e-mail
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#111b3b]">
                    {suppliersWithEmail}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Mail size={22} />
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-[#7180a2]">
                    Com telefone
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#111b3b]">
                    {suppliersWithPhone}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <Phone size={22} />
                </div>

              </div>

            </div>

          </div>

          {/* PESQUISA */}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex flex-col gap-4 md:flex-row md:items-center">

              <div className="relative flex-1">

                <Search
                  size={18}
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Pesquisar por nome, NIF, e-mail ou telefone..."
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
                    text-slate-700
                    outline-none
                    transition
                    focus:border-[#5146e5]
                    focus:bg-white
                  "
                />

              </div>

              <button
                type="button"
                onClick={() =>
                  loadSuppliers(true)
                }
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
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
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

                Actualizar
              </button>

            </div>

          </div>

          {/* LISTA */}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="text-lg font-bold text-[#111b3b]">
                  Lista de fornecedores
                </h2>

                <p className="mt-1 text-sm text-[#7180a2]">
                  {filteredSuppliers.length}{' '}
                  fornecedor
                  {filteredSuppliers.length !== 1
                    ? 'es'
                    : ''}{' '}
                  encontrado
                  {filteredSuppliers.length !== 1
                    ? 's'
                    : ''}
                </p>

              </div>

            </div>

            {loading ? (
              <div className="px-6 py-16 text-center">

                <RefreshCw
                  size={28}
                  className="mx-auto animate-spin text-[#5146e5]"
                />

                <p className="mt-4 text-sm text-[#7180a2]">
                  A carregar fornecedores...
                </p>

              </div>
            ) : filteredSuppliers.length ===
              0 ? (
              <div className="px-6 py-16 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-[#5146e5]">
                  <Building2 size={30} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#111b3b]">
                  {search
                    ? 'Nenhum fornecedor encontrado'
                    : 'Ainda não existem fornecedores'}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7180a2]">
                  {search
                    ? 'Tente pesquisar utilizando outro nome, NIF, e-mail ou telefone.'
                    : 'Comece por cadastrar o primeiro fornecedor da sua empresa.'}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={
                      openCreateModal
                    }
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
                      transition
                      hover:bg-[#4338ca]
                    "
                  >
                    <Plus size={18} />

                    Adicionar fornecedor
                  </button>
                )}

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Fornecedor
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        NIF
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Contacto
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Morada
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                        Acções
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredSuppliers.map(
                      (supplier) => (
                        <tr
                          key={
                            supplier.id
                          }
                          className="
                            border-b
                            border-slate-100
                            last:border-0
                            hover:bg-slate-50/60
                          "
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#5146e5]">
                                <Building2
                                  size={20}
                                />
                              </div>

                              <div>

                                <p className="font-semibold text-[#111b3b]">
                                  {supplier.name}
                                </p>

                                {supplier.email && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {
                                      supplier.email
                                    }
                                  </p>
                                )}

                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <span className="text-sm text-slate-700">
                              {supplier.nif ||
                                '—'}
                            </span>

                          </td>

                          <td className="px-6 py-5">

                            <div className="space-y-1">

                              {supplier.phone && (
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                  <Phone
                                    size={14}
                                    className="text-slate-400"
                                  />

                                  {
                                    supplier.phone
                                  }
                                </div>
                              )}

                              {supplier.email && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Mail
                                    size={14}
                                    className="text-slate-400"
                                  />

                                  {
                                    supplier.email
                                  }
                                </div>
                              )}

                              {!supplier.phone &&
                                !supplier.email && (
                                  <span className="text-sm text-slate-400">
                                    —
                                  </span>
                                )}

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            {supplier.address ? (
                              <div className="flex max-w-[220px] items-start gap-2 text-sm text-slate-700">

                                <MapPin
                                  size={15}
                                  className="mt-0.5 shrink-0 text-slate-400"
                                />

                                <span>
                                  {
                                    supplier.address
                                  }
                                </span>

                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            )}

                          </td>

                          <td className="px-6 py-5">

                            <div className="flex justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    supplier,
                                  )
                                }
                                title="Editar fornecedor"
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  text-slate-600
                                  transition
                                  hover:border-indigo-200
                                  hover:bg-indigo-50
                                  hover:text-[#5146e5]
                                "
                              >
                                <Edit3
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    supplier,
                                  )
                                }
                                title="Eliminar fornecedor"
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  border-slate-200
                                  bg-white
                                  text-slate-600
                                  transition
                                  hover:border-red-200
                                  hover:bg-red-50
                                  hover:text-red-600
                                "
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>

                            </div>

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

      </div>

      {/* MODAL */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#111b3b]">
                  {editingId
                    ? 'Editar fornecedor'
                    : 'Novo fornecedor'}
                </h2>

                <p className="mt-1 text-sm text-[#7180a2]">
                  Preencha os dados do fornecedor.
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  disabled:opacity-50
                "
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nome do fornecedor *
                  </label>

                  <div className="relative">

                    <Building2
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateField(
                          'name',
                          event.target.value,
                        )
                      }
                      placeholder="Ex.: Empresa Comercial, Lda."
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
                        focus:border-[#5146e5]
                        focus:bg-white
                      "
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    NIF
                  </label>

                  <input
                    value={form.nif}
                    onChange={(event) =>
                      updateField(
                        'nif',
                        event.target.value,
                      )
                    }
                    placeholder="Número de identificação fiscal"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-[#5146e5]
                      focus:bg-white
                    "
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Telefone
                  </label>

                  <div className="relative">

                    <Phone
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateField(
                          'phone',
                          event.target.value,
                        )
                      }
                      placeholder="+244 9XX XXX XXX"
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
                        focus:border-[#5146e5]
                        focus:bg-white
                      "
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    E-mail
                  </label>

                  <div className="relative">

                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateField(
                          'email',
                          event.target.value,
                        )
                      }
                      placeholder="email@empresa.ao"
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
                        focus:border-[#5146e5]
                        focus:bg-white
                      "
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Morada
                  </label>

                  <div className="relative">

                    <MapPin
                      size={17}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      value={form.address}
                      onChange={(event) =>
                        updateField(
                          'address',
                          event.target.value,
                        )
                      }
                      placeholder="Luanda, Angola"
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
                        focus:border-[#5146e5]
                        focus:bg-white
                      "
                    />

                  </div>

                </div>

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Observações
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        'notes',
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="Informações adicionais sobre o fornecedor..."
                    className="
                      w-full
                      resize-none
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-[#5146e5]
                      focus:bg-white
                    "
                  />

                </div>

              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-slate-700
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
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
                    shadow-indigo-100
                    hover:bg-[#4338ca]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      A guardar...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />

                      {editingId
                        ? 'Guardar alterações'
                        : 'Criar fornecedor'}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </DashboardLayout>
  );
}