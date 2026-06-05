'use client';

import { useEffect, useMemo, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';
import api from '@/services/api';

import {
  Users,
  Building2,
  User,
  Search,
  Plus,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';

export default function ClientsPage() {
  const [company, setCompany] =
    useState<any>(null);

  const [clients, setClients] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [form, setForm] = useState({
    name: '',
    nif: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const companyData =
        await getCompany();

      const clientsData =
        await api.get('/clients');

      setCompany(companyData);

      setClients(clientsData.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createClient() {
    try {
      await api.post(
        '/clients',
        form,
      );

      setShowModal(false);

      setForm({
        name: '',
        nif: '',
        email: '',
        phone: '',
        address: '',
      });

      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteClient(
    id: string,
  ) {
    if (
      !confirm(
        'Eliminar cliente?',
      )
    )
      return;

    try {
      await api.delete(
        `/clients/${id}`,
      );

      loadData();
    } catch (error) {
      console.error(error);
    }
  }

  const filteredClients =
    useMemo(() => {
      return clients.filter(
        (client) =>
          client.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase(),
            ) ||
          client.nif
            ?.toLowerCase()
            .includes(
              search.toLowerCase(),
            ),
      );
    }, [clients, search]);

  if (loading || !company) {
    return (
      <div className="p-10">
        Carregando...
      </div>
    );
  }

  return (
    <DashboardLayout company={company}>

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800">
          Clientes
        </h1>

        <p className="text-slate-500 mt-1">
          Gestão da carteira de clientes
        </p>

      </div>

      {/* KPIS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl shadow p-5">

          <Users className="text-blue-600 mb-3" />

          <div className="text-slate-500">
            Total Clientes
          </div>

          <div className="text-3xl font-bold mt-2">
            {clients.length}
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow p-5">

          <Building2 className="text-green-600 mb-3" />

          <div className="text-slate-500">
            Empresas
          </div>

          <div className="text-3xl font-bold mt-2">
            {clients.length}
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow p-5">

          <User className="text-orange-500 mb-3" />

          <div className="text-slate-500">
            Activos
          </div>

          <div className="text-3xl font-bold mt-2">
            {clients.length}
          </div>

        </div>

      </div>

      {/* PESQUISA */}

      <div className="bg-white rounded-2xl shadow p-5 mt-6">

        <div className="flex justify-between gap-4">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-3 text-slate-400"
            />

            <input
              type="text"
              placeholder="Pesquisar cliente..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
              className="w-full border rounded-xl pl-10 pr-4 py-3"
            />

          </div>

          <button
            onClick={() =>
              setShowModal(true)
            }
            className="bg-blue-600 text-white px-5 rounded-xl flex items-center gap-2"
          >
            <Plus size={18} />
            Novo Cliente
          </button>

        </div>

      </div>

      {/* TABELA */}

      <div className="bg-white rounded-2xl shadow mt-6 overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                Nome
              </th>

              <th className="text-left p-4">
                NIF
              </th>

              <th className="text-left p-4">
                Email
              </th>

              <th className="text-left p-4">
                Telefone
              </th>

              <th className="text-center p-4">
                Acções
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredClients.map(
              (client) => (
                <tr
                  key={client.id}
                  className="border-t"
                >
                  <td className="p-4 font-medium">
                    {client.name}
                  </td>

                  <td className="p-4">
                    {client.nif}
                  </td>

                  <td className="p-4">
                    {client.email}
                  </td>

                  <td className="p-4">
                    {client.phone}
                  </td>

                  <td className="p-4 text-center">

                    <button
                      onClick={() =>
                        deleteClient(
                          client.id,
                        )
                      }
                      className="text-red-500"
                    >
                      <Trash2
                        size={18}
                      />
                    </button>

                  </td>
                </tr>
              ),
            )}

            {filteredClients.length ===
              0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-10 text-slate-500"
                >
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* MODAL */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl w-full max-w-xl p-6">

            <h2 className="text-2xl font-bold mb-5">
              Novo Cliente
            </h2>

            <div className="space-y-4">

              <input
                placeholder="Nome"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              <input
                placeholder="NIF"
                value={form.nif}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nif:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              <input
                placeholder="Telefone"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              <input
                placeholder="Endereço"
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="px-5 py-3 border rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={
                  createClient
                }
                className="px-5 py-3 bg-blue-600 text-white rounded-xl"
              >
                Guardar
              </button>

            </div>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}