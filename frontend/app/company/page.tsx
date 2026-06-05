'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany, updateCompany } from '@/services/company';
import { Building2, Mail, Phone, MapPin, Save, FileText } from 'lucide-react';

export default function CompanyPage() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      const data = await getCompany();
      setCompany(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updateCompany(company);
      alert('Empresa atualizada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar empresa');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-10">Carregando...</div>;

  return (
    <DashboardLayout company={company}>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-white/20 flex items-center justify-center">
            <Building2 size={50} />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{company.name}</h1>
            <p className="text-blue-100 text-lg">{company.sector}</p>
            <div className="flex gap-3 mt-4 flex-wrap">
              <span className="bg-white/20 px-4 py-2 rounded-xl">NIF: {company.nif}</span>
              <span className="bg-white/20 px-4 py-2 rounded-xl">Regime: {company.regime}</span>
              <span className="bg-white/20 px-4 py-2 rounded-xl">Retenção: {company.retentionRate}%</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 shadow space-y-5">
            <h2 className="text-2xl font-bold mb-6">Dados da Empresa</h2>

            {['name', 'nif', 'email', 'phone', 'address'].map((field) => (
              <div key={field}>
                <label className="font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input
                  value={company[field] || ''}
                  onChange={(e) => setCompany({ ...company, [field]: e.target.value })}
                  className="w-full border rounded-xl p-3 mt-2"
                />
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Guardando...' : 'Guardar Alterações'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow">
              <Mail className="text-blue-600 mb-3" />
              <h3 className="font-bold">Email</h3>
              <p>{company.email}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow">
              <Phone className="text-green-600 mb-3" />
              <h3 className="font-bold">Telefone</h3>
              <p>{company.phone}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow">
              <MapPin className="text-red-600 mb-3" />
              <h3 className="font-bold">Endereço</h3>
              <p>{company.address}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow">
              <FileText className="text-orange-600 mb-3" />
              <h3 className="font-bold">Regime Fiscal</h3>
              <p>{company.regime}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}