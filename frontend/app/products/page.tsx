'use client';

import { useEffect, useState } from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';

import {
  getProducts,
  createProduct,
  deleteProduct,
} from '@/services/product';

import {
  Plus,
  Trash2,
  Package,
} from 'lucide-react';

export default function ProductsPage() {
  const [company, setCompany] =
    useState<any>(null);

  const [products, setProducts] =
    useState<any[]>([]);

  const [name, setName] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const companyData =
        await getCompany();

      const productsData =
        await getProducts();

      setCompany(companyData);
      setProducts(productsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      if (!name || !price) {
        alert(
          'Preencha todos os campos.',
        );
        return;
      }

      await createProduct({
        name,
        price: Number(price),

        // IMPORTANTE
        tenantId:
          company?.tenantId ||
          company?.id,
      });

      setName('');
      setPrice('');

      await loadData();

      alert(
        'Produto criado com sucesso.',
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Erro ao criar produto.',
      );
    }
  }

  async function handleDelete(
    id: string,
  ) {
    try {
      await deleteProduct(id);

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        'Erro ao remover produto.',
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

  return (
    <DashboardLayout company={company}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            Produtos
          </h1>

          <p className="text-slate-500 mt-1">
            Gestão de produtos e
            serviços
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome do Produto"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder="Preço"
            value={price}
            onChange={(e) =>
              setPrice(e.target.value)
            }
            className="border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleCreate}
          className="mt-4 bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
          <Package
            size={20}
            className="text-blue-600"
          />

          <span className="font-semibold">
            Lista de Produtos
          </span>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-4">
                Produto
              </th>

              <th className="text-left p-4">
                Preço
              </th>

              <th className="text-center p-4">
                Acções
              </th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="text-center p-8 text-slate-500"
                >
                  Nenhum produto
                  registado.
                </td>
              </tr>
            )}

            {products.map(
              (product: any) => (
                <tr
                  key={product.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="p-4">
                    {product.name}
                  </td>

                  <td className="p-4 font-medium">
                    {Number(
                      product.price,
                    ).toLocaleString(
                      'pt-PT',
                    )}{' '}
                    AOA
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        handleDelete(
                          product.id,
                        )
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2
                        size={18}
                      />
                    </button>
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