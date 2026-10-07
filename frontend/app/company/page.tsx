'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Building2,
  Edit3,
  ExternalLink,
  Loader2,
  MapPin,
  Save,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader, Panel, StatCard } from '@/components/ui/enterprise';
import { getCompany, updateCompany } from '@/services/company';
import {
  listFiscalEnrollments,
  type FiscalEnrollment,
} from '@/services/fiscal-enrollments';
import type { Tenant } from '@/services/auth';

type CompanyForm = Pick<Tenant, 'name' | 'nif'> & {
  email: string;
  phone: string;
  address: string;
  city: string;
  sector: string;
  companyType: string;
};

const emptyForm: CompanyForm = {
  name: '',
  nif: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  sector: '',
  companyType: '',
};
const taxLabels: Record<string, string> = {
  IVA: 'IVA',
  INDUSTRIAL: 'Imposto Industrial',
  IRT: 'IRT',
  SS: 'INSS',
  SAFT: 'SAF-T',
};

export default function CompanyPage() {
  const [company, setCompany] = useState<Tenant | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [enrollments, setEnrollments] = useState<FiscalEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([getCompany(), listFiscalEnrollments()])
      .then(([data, fiscal]) => {
        setCompany(data);
        setForm({
          name: data.name ?? '',
          nif: data.nif ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          sector: data.sector ?? '',
          companyType: data.companyType ?? '',
        });
        setEnrollments(fiscal.filter((item) => item.status === 'ACTIVE'));
      })
      .catch(() =>
        setError('Não foi possível carregar todos os dados da empresa.'),
      )
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof CompanyForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await updateCompany(form);
      setCompany(updated);
      setEditing(false);
      setMessage('Dados da empresa actualizados.');
    } catch {
      setError('Não foi possível guardar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: keyof CompanyForm, readOnly = false) => (
    <label className="fd-label">
      {label}
      <input
        value={form[key] ?? ''}
        disabled={!editing || readOnly}
        onChange={(event) => set(key, event.target.value)}
        className="fd-field mt-1.5 disabled:bg-slate-50 disabled:text-slate-700"
      />
    </label>
  );

  return (
    <DashboardLayout company={company ?? undefined}>
      <main className="fd-workspace-page mx-auto w-full max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Empresa"
          title={loading ? 'A carregar…' : form.name || 'Perfil empresarial'}
          description="Identificação, contactos e enquadramentos fiscais vigentes."
          actions={
            <button
              type="button"
              className="fd-button-secondary"
              onClick={() => setEditing(true)}
              disabled={loading || editing}
            >
              <Edit3 size={16} />
              Editar dados
            </button>
          }
        />

        <div className="fd-stat-grid" aria-label="Resumo da empresa">
          <StatCard label="NIF" value={form.nif || 'Não informado'} />
          <StatCard
            label="Estado"
            value={company?.status || 'Não disponível'}
          />
          <StatCard
            label="Plano"
            value={company?.planType || 'Não disponível'}
          />
        </div>

        {message && (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
          <Section icon={<Building2 size={19} />} title="Dados gerais">
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Razão social', 'name')}
              {field('NIF', 'nif', true)}
              {field('Tipo de empresa', 'companyType')}
              {field('Actividade / sector', 'sector')}
            </div>
          </Section>
          <Section icon={<MapPin size={19} />} title="Contactos e endereço">
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Província / cidade', 'city')}
              {field('Endereço', 'address')}
              {field('Email', 'email')}
              {field('Telefone', 'phone')}
            </div>
          </Section>
          {editing && (
            <div className="flex flex-col-reverse gap-3 lg:col-span-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="fd-button-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="fd-button-primary"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Guardar alterações
              </button>
            </div>
          )}
        </form>

        <Panel
          title="Situação Fiscal"
          description="Estado confirmado de cada imposto e respectivo período de vigência."
          actions={
            <Link href="/fiscal-situation" className="fd-button-secondary">
              <ExternalLink size={15} />
              Ver situação fiscal
            </Link>
          }
        >
          {enrollments.length ? (
            <div className="divide-y divide-slate-200">
              {enrollments.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {taxLabels[item.taxType] || item.taxType}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.regime} · desde{' '}
                      {new Date(item.validFrom).toLocaleDateString('pt-AO')}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Activo
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">
                Sem enquadramentos activos
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Registe apenas enquadramentos confirmados para cada imposto.
              </p>
            </div>
          )}
        </Panel>
      </main>
    </DashboardLayout>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="mb-5 flex items-center gap-2 font-semibold text-[#102447]">
        <span className="text-[#0b6f93]">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
