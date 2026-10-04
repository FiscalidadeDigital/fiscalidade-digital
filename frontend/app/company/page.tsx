'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Edit3, Loader2, MapPin, Save, ShieldCheck } from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany, updateCompany } from '@/services/company';

type CompanyForm = {
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  sector: string;
  companyType: string;
  regime: string;
};

const emptyForm: CompanyForm = {
  name: '', nif: '', email: '', phone: '', address: '', city: '', sector: '', companyType: '', regime: '',
};

export default function CompanyPage() {
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void getCompany().then((company) => {
      setForm({
        name: company.name ?? '', nif: company.nif ?? '', email: company.email ?? '',
        phone: company.phone ?? '', address: company.address ?? '', city: company.city ?? '',
        sector: company.sector ?? '', companyType: company.companyType ?? '', regime: company.regime ?? '',
      });
    }).catch(() => setMessage('Não foi possível carregar os dados da empresa.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof CompanyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setMessage('');
    try {
      const { regime: _regime, ...editableCompany } = form;
      await updateCompany(editableCompany);
      setEditing(false); setMessage('Dados da empresa actualizados.');
    } catch {
      setMessage('Não foi possível guardar as alterações.');
    } finally { setSaving(false); }
  };

  const field = (label: string, key: keyof CompanyForm, readOnly = false) => (
    <label className="company-field">
      <span>{label}</span>
      <input value={form[key]} disabled={!editing || readOnly} onChange={(event) => set(key, event.target.value)} />
    </label>
  );

  return (
    <DashboardLayout>
      <main className="company-page">
        <header className="company-hero">
          <div><span className="company-kicker">GESTÃO EMPRESARIAL</span><h1>{loading ? 'A carregar…' : form.name || 'Empresa'}</h1><p>Identificação, enquadramento e contactos da sua organização.</p></div>
          <button type="button" className="company-edit" onClick={() => setEditing(true)} disabled={loading || editing}><Edit3 size={16} />Editar dados</button>
        </header>
        {message && <p role="status" className="company-message">{message}</p>}
        <form onSubmit={submit}>
          <section className="company-section"><h2><Building2 size={19} />Identificação</h2><div className="company-grid">{field('Razão social', 'name')}{field('NIF', 'nif', true)}{field('Tipo de empresa', 'companyType')}{field('Actividade / sector', 'sector')}</div></section>
          <section className="company-section"><h2><ShieldCheck size={19} />Dados fiscais</h2><div className="company-grid">{field('Regime fiscal', 'regime', true)}<p className="company-pending">Alterações de enquadramento fiscal exigem revisão e fonte oficial; não são automáticas.</p></div></section>
          <section className="company-section"><h2><MapPin size={19} />Endereço e contacto</h2><div className="company-grid">{field('Província / cidade', 'city')}{field('Endereço', 'address')}{field('E-mail', 'email')}{field('Telefone', 'phone')}</div></section>
          {editing && <div className="company-actions"><button type="button" onClick={() => setEditing(false)}>Cancelar</button><button type="submit" disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}Guardar alterações</button></div>}
        </form>
      </main>
    </DashboardLayout>
  );
}
