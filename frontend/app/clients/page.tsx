'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';
import api from '@/services/api';

import type { Tenant } from '@/services/auth';

import {
  Building2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';

// =====================================================
// TIPOS
// =====================================================

interface Client {
  id: string;
  tenantId?: string;

  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

interface ClientForm {
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

// =====================================================
// FORMULÁRIO VAZIO
// =====================================================

const emptyForm: ClientForm = {
  name: '',
  nif: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

// =====================================================
// PÁGINA
// =====================================================

export default function ClientsPage() {
  // ===================================================
  // ESTADO DE MONTAGEM
  // ===================================================

  const [mounted, setMounted] =
    useState(false);

  // ===================================================
  // EMPRESA
  // ===================================================

  const [company, setCompany] =
    useState<Tenant | null>(null);

  // ===================================================
  // CLIENTES
  // ===================================================

  const [clients, setClients] =
    useState<Client[]>([]);

  // ===================================================
  // PESQUISA
  // ===================================================

  const [search, setSearch] =
    useState('');

  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // ===================================================
  // ERROS
  // ===================================================

  const [error, setError] =
    useState('');

  // ===================================================
  // MODAL
  // ===================================================

  const [showModal, setShowModal] =
    useState(false);

  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] =
    useState<ClientForm>(emptyForm);

  // ===================================================
  // MONTAGEM
  // ===================================================
  //
  // Isto evita o Hydration failed do Next.js.
  //
  // A página só começa a renderizar o conteúdo
  // dependente do navegador depois da montagem.
  // ===================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  // ===================================================
  // CARREGAR DADOS
  // ===================================================

  const loadData = useCallback(
    async (
      showRefresh = false,
    ) => {
      try {
        setError('');

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // -----------------------------------------------
        // EMPRESA
        // -----------------------------------------------

        const companyData =
          await getCompany();

        // -----------------------------------------------
        // CLIENTES
        // -----------------------------------------------

        const clientsResponse =
          await api.get<Client[]>(
            '/clients',
          );

        setCompany(
          companyData,
        );

        setClients(
          Array.isArray(
            clientsResponse.data,
          )
            ? clientsResponse.data
            : [],
        );
      } catch (err: any) {
        console.error(
          'Erro ao carregar clientes:',
          err,
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Não foi possível carregar os clientes.';

        setError(
          Array.isArray(message)
            ? message.join(', ')
            : String(message),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // ===================================================
  // CARREGAMENTO INICIAL
  // ===================================================

  useEffect(() => {
    if (!mounted) {
      return;
    }

    loadData();
  }, [
    mounted,
    loadData,
  ]);

  // ===================================================
  // ABRIR MODAL NOVO CLIENTE
  // ===================================================

  function openCreateModal() {
    setEditingClient(null);

    setForm({
      ...emptyForm,
    });

    setError('');

    setShowModal(true);
  }

  // ===================================================
  // ABRIR MODAL EDITAR
  // ===================================================

  function openEditModal(
    client: Client,
  ) {
    setEditingClient(client);

    setForm({
      name: client.name || '',
      nif: client.nif || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
    });

    setError('');

    setShowModal(true);
  }

  // ===================================================
  // FECHAR MODAL
  // ===================================================

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingClient(null);

    setForm({
      ...emptyForm,
    });
  }

  // ===================================================
  // ALTERAR FORM
  // ===================================================

  function updateForm(
    field: keyof ClientForm,
    value: string,
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      }),
    );
  }

  // ===================================================
  // CRIAR / ATUALIZAR
  // ===================================================

  async function saveClient() {
    const name =
      form.name.trim();

    if (!name) {
      setError(
        'O nome do cliente é obrigatório.',
      );

      return;
    }

    try {
      setSaving(true);

      setError('');

      const payload = {
        name,
        nif:
          form.nif.trim() ||
          null,
        email:
          form.email.trim() ||
          null,
        phone:
          form.phone.trim() ||
          null,
        address:
          form.address.trim() ||
          null,
        notes:
          form.notes.trim() ||
          null,
      };

      // -----------------------------------------------
      // EDITAR
      // -----------------------------------------------

      if (editingClient) {
        const response =
          await api.patch<Client>(
            `/clients/${editingClient.id}`,
            payload,
          );

        setClients(
          (previous) =>
            previous.map(
              (client) =>
                client.id ===
                editingClient.id
                  ? {
                      ...client,
                      ...response.data,
                    }
                  : client,
            ),
        );
      }

      // -----------------------------------------------
      // CRIAR
      // -----------------------------------------------

      else {
        const response =
          await api.post<Client>(
            '/clients',
            payload,
          );

        setClients(
          (previous) => [
            response.data,
            ...previous,
          ],
        );
      }

      // -----------------------------------------------
      // FECHAR
      // -----------------------------------------------

      setShowModal(false);

      setEditingClient(null);

      setForm({
        ...emptyForm,
      });
    } catch (err: any) {
      console.error(
        'Erro ao guardar cliente:',
        err,
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível guardar o cliente.';

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : String(message),
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // ELIMINAR
  // ===================================================

  async function deleteClient(
    client: Client,
  ) {
    const confirmed =
      window.confirm(
        `Tem a certeza que deseja eliminar "${client.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        client.id,
      );

      setError('');

      await api.delete(
        `/clients/${client.id}`,
      );

      setClients(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              client.id,
          ),
      );
    } catch (err: any) {
      console.error(
        'Erro ao eliminar cliente:',
        err,
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível eliminar o cliente.';

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : String(message),
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ===================================================
  // CLIENTES FILTRADOS
  // ===================================================

  const filteredClients =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return clients;
      }

      return clients.filter(
        (client) => {
          return (
            client.name
              ?.toLowerCase()
              .includes(value) ||
            client.nif
              ?.toLowerCase()
              .includes(value) ||
            client.email
              ?.toLowerCase()
              .includes(value) ||
            client.phone
              ?.toLowerCase()
              .includes(value)
          );
        },
      );
    }, [
      clients,
      search,
    ]);

  // ===================================================
  // ESTATÍSTICAS
  // ===================================================

  const totalClients =
    clients.length;

  const clientsWithContact =
    clients.filter(
      (client) =>
        Boolean(
          client.email ||
          client.phone,
        ),
    ).length;

  const clientsWithNif =
    clients.filter(
      (client) =>
        Boolean(
          client.nif?.trim(),
        ),
    ).length;

  // ===================================================
  // NOME DA EMPRESA
  // ===================================================

  const companyName =
    company?.name ||
    'Empresa';

  const companyNif =
    company?.nif ||
    'NIF não disponível';

  // ===================================================
  // HYDRATION PROTECTION
  // ===================================================

  if (!mounted) {
    return null;
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
            <Loader2
              size={30}
              className="animate-spin text-blue-600"
            />
          </div>

          <p className="mt-5 text-sm font-semibold text-slate-800">
            A carregar clientes
          </p>

          <p className="mt-1 text-xs text-slate-400">
            A sincronizar os dados da empresa...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // EMPRESA NÃO ENCONTRADA
  // ===================================================

  if (!company) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <Building2
              size={30}
              className="text-red-500"
            />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Empresa não encontrada
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Não foi possível identificar a
            empresa autenticada.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              loadData()
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw size={17} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <DashboardLayout
      company={company}
    >
      <div className="min-h-full pb-10">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
                Gestão Comercial
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Clientes
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Gerencie a carteira de clientes
              da sua empresa.
            </p>

          </div>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
          >
            <Plus size={19} />
            Novo Cliente
          </button>

        </div>

        {/* =================================================
            ERRO
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-500">
              <FileText
                size={18}
              />
            </div>

            <div className="flex-1">

              <p className="text-sm font-bold text-red-700">
                Ocorreu um problema
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
              className="rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {/* =================================================
            EMPRESA
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
              <Building2
                size={23}
                className="text-blue-600"
              />
            </div>

            <div className="min-w-0">

              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Empresa
              </p>

              <h2 className="truncate text-lg font-bold text-slate-900">
                {companyName}
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                NIF: {companyNif}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            KPIS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Total de Clientes
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {totalClients}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Clientes cadastrados
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Users
                  size={21}
                  className="text-blue-600"
                />
              </div>

            </div>

          </div>

          {/* CONTACTO */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Com contacto
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {clientsWithContact}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Email ou telefone
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <Phone
                  size={21}
                  className="text-emerald-600"
                />
              </div>

            </div>

          </div>

          {/* NIF */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  Com NIF
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {clientsWithNif}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Clientes identificados
                </p>

              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <UserRound
                  size={21}
                  className="text-orange-500"
                />
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            LISTA
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* BARRA */}

          <div className="border-b border-slate-100 p-4 md:p-5">

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

              <div className="relative w-full lg:max-w-xl">

                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Pesquisar por nome, NIF, email ou telefone..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

              </div>

              <button
                type="button"
                onClick={() =>
                  loadData(true)
                }
                disabled={refreshing}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

          {/* =================================================
              DESKTOP TABLE
          ================================================= */}

          <div className="hidden overflow-x-auto md:block">

            <table className="w-full min-w-[850px]">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50/70">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cliente
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    NIF
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contacto
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Endereço
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Acções
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredClients.map(
                  (client) => (
                    <tr
                      key={
                        client.id
                      }
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >

                      {/* CLIENTE */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                            {client.name
                              ?.charAt(
                                0,
                              )
                              ?.toUpperCase() ||
                              'C'}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-800">
                              {client.name}
                            </p>

                            {client.notes && (
                              <p className="mt-0.5 max-w-[250px] truncate text-xs text-slate-400">
                                {client.notes}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* NIF */}

                      <td className="px-5 py-4">

                        <span className="text-sm text-slate-600">
                          {client.nif ||
                            '—'}
                        </span>

                      </td>

                      {/* CONTACTO */}

                      <td className="px-5 py-4">

                        <div className="space-y-1">

                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail
                                size={14}
                                className="text-slate-400"
                              />
                              <span className="max-w-[220px] truncate">
                                {client.email}
                              </span>
                            </div>
                          )}

                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone
                                size={14}
                                className="text-slate-400"
                              />
                              <span>
                                {client.phone}
                              </span>
                            </div>
                          )}

                          {!client.email &&
                            !client.phone && (
                              <span className="text-sm text-slate-400">
                                Sem contacto
                              </span>
                            )}

                        </div>

                      </td>

                      {/* ENDEREÇO */}

                      <td className="px-5 py-4">

                        <div className="flex max-w-[220px] items-center gap-2 text-sm text-slate-600">

                          {client.address ? (
                            <>
                              <MapPin
                                size={14}
                                className="shrink-0 text-slate-400"
                              />

                              <span className="truncate">
                                {client.address}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400">
                              —
                            </span>
                          )}

                        </div>

                      </td>

                      {/* ACÇÕES */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                client,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            title="Editar cliente"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteClient(
                                client,
                              )
                            }
                            disabled={
                              deletingId ===
                              client.id
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Eliminar cliente"
                          >
                            {deletingId ===
                            client.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={16}
                              />
                            )}
                          </button>

                        </div>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>

          {/* =================================================
              MOBILE
          ================================================= */}

          <div className="divide-y divide-slate-100 md:hidden">

            {filteredClients.map(
              (client) => (
                <div
                  key={
                    client.id
                  }
                  className="p-5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                        {client.name
                          ?.charAt(
                            0,
                          )
                          ?.toUpperCase() ||
                          'C'}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-bold text-slate-800">
                          {client.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          NIF:{' '}
                          {client.nif ||
                            'Não informado'}
                        </p>

                      </div>

                    </div>

                    <div className="flex shrink-0 gap-1">

                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            client,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteClient(
                            client,
                          )
                        }
                        disabled={
                          deletingId ===
                          client.id
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        {deletingId ===
                        client.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={16}
                          />
                        )}
                      </button>

                    </div>

                  </div>

                  <div className="mt-4 space-y-2">

                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail
                          size={15}
                        />
                        {client.email}
                      </div>
                    )}

                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone
                          size={15}
                        />
                        {client.phone}
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin
                          size={15}
                        />
                        {client.address}
                      </div>
                    )}

                  </div>

                </div>
              ),
            )}

          </div>

          {/* =================================================
              VAZIO
          ================================================= */}

          {filteredClients.length ===
            0 && (
            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                {search ? (
                  <Search
                    size={27}
                    className="text-slate-400"
                  />
                ) : (
                  <Users
                    size={27}
                    className="text-slate-400"
                  />
                )}
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-800">
                {search
                  ? 'Nenhum cliente encontrado'
                  : 'Ainda não existem clientes'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search
                  ? 'Tente pesquisar usando outro nome, NIF, email ou telefone.'
                  : 'Cadastre o primeiro cliente da sua empresa para começar a gerir a sua carteira.'}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <Plus
                    size={17}
                  />
                  Cadastrar primeiro cliente
                </button>
              )}

            </div>
          )}

          {/* =================================================
              FOOTER DA LISTA
          ================================================= */}

          {filteredClients.length >
            0 && (
            <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">

              <p className="text-xs font-medium text-slate-400">
                A mostrar{' '}
                <span className="font-bold text-slate-600">
                  {filteredClients.length}
                </span>{' '}
                de{' '}
                <span className="font-bold text-slate-600">
                  {clients.length}
                </span>{' '}
                clientes
              </p>

            </div>
          )}

        </div>

      </div>

      {/* ===================================================
          MODAL CLIENTE
      =================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER MODAL */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    {editingClient ? (
                      <Pencil
                        size={18}
                        className="text-blue-600"
                      />
                    ) : (
                      <Users
                        size={19}
                        className="text-blue-600"
                      />
                    )}
                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-slate-900">
                      {editingClient
                        ? 'Editar Cliente'
                        : 'Novo Cliente'}
                    </h2>

                    <p className="text-xs text-slate-400">
                      {editingClient
                        ? 'Atualize os dados do cliente'
                        : 'Cadastre um novo cliente'}
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* NOME */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nome do cliente
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      form.name
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'name',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ex.: Empresa ABC, Lda."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* NIF */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    NIF
                  </label>

                  <input
                    type="text"
                    value={
                      form.nif
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'nif',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Número de identificação fiscal"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* TELEFONE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Telefone
                  </label>

                  <input
                    type="tel"
                    value={
                      form.phone
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'phone',
                        event.target
                          .value,
                      )
                    }
                    placeholder="+244 9xx xxx xxx"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'email',
                        event.target
                          .value,
                      )
                    }
                    placeholder="cliente@email.com"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* ENDEREÇO */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Endereço
                  </label>

                  <input
                    type="text"
                    value={
                      form.address
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'address',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Luanda, Angola"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

                {/* OBSERVAÇÕES */}

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Observações
                  </label>

                  <textarea
                    value={
                      form.notes
                    }
                    onChange={(
                      event,
                    ) =>
                      updateForm(
                        'notes',
                        event.target
                          .value,
                      )
                    }
                    placeholder="Informações adicionais sobre o cliente..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                </div>

              </div>

            </div>

            {/* FOOTER MODAL */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  saveClient
                }
                disabled={
                  saving ||
                  !form.name.trim()
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    A guardar...
                  </>
                ) : (
                  <>
                    <Plus
                      size={17}
                    />

                    {editingClient
                      ? 'Guardar alterações'
                      : 'Cadastrar cliente'}
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}