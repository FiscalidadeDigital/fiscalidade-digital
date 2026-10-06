'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import AuthFrame from '@/components/auth/AuthFrame';

type Enrollment = { enabled: boolean; taxType: 'IVA' | 'INDUSTRIAL'; regime: 'GERAL' | 'SIMPLIFICADO'; validFrom: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(''); const [nif, setNif] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([
    { enabled: false, taxType: 'IVA', regime: 'GERAL', validFrom: new Date().toISOString().slice(0, 10) },
    { enabled: false, taxType: 'INDUSTRIAL', regime: 'GERAL', validFrom: new Date().toISOString().slice(0, 10) },
  ]);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const change = (index: number, patch: Partial<Enrollment>) => setEnrollments((all) => all.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  async function submit(event: FormEvent) {
    event.preventDefault(); const onboardingToken = sessionStorage.getItem('fd-onboarding-token');
    if (!onboardingToken) return setError('A sessão de onboarding expirou. Confirme o email novamente.');
    setLoading(true); setError('');
    try {
      await api.post('/auth/complete-onboarding', { onboardingToken, companyName, nif, enrollments: enrollments.filter((item) => item.enabled).map(({ enabled, ...item }) => item) });
      sessionStorage.removeItem('fd-onboarding-token'); router.replace('/login');
    } catch { setError('Não foi possível concluir a configuração. Confirme os dados e tente novamente.'); }
    finally { setLoading(false); }
  }
  return <AuthFrame eyebrow="Passo 2 de 2" title="Configure a empresa" description="A situação fiscal pode ser confirmada por imposto. Pode concluir agora e rever os dados depois na área Situação Fiscal." backHref="/verify-email" backLabel="Voltar à confirmação" wide>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2"><label className="fd-label">Nome da empresa<input required autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="fd-field mt-1.5" /></label><label className="fd-label">NIF<input required value={nif} onChange={(event) => setNif(event.target.value)} className="fd-field mt-1.5" /></label></div>
      <fieldset className="space-y-3"><legend className="text-sm font-semibold text-slate-900">Dados fiscais iniciais <span className="font-normal text-slate-500">(opcional)</span></legend>{enrollments.map((item, index) => <div key={item.taxType} className="rounded-xl border border-slate-200 p-4"><label className="flex items-center gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={item.enabled} onChange={(event) => change(index, { enabled: event.target.checked })} />Confirmar dados de {item.taxType === 'IVA' ? 'IVA' : 'Imposto Industrial'}</label>{item.enabled && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="fd-label">Regime<select value={item.regime} onChange={(event) => change(index, { regime: event.target.value as Enrollment['regime'] })} className="fd-field mt-1.5"><option value="GERAL">Regime Geral</option><option value="SIMPLIFICADO">Regime Simplificado</option></select></label><label className="fd-label">Início da vigência<input required type="date" value={item.validFrom} onChange={(event) => change(index, { validFrom: event.target.value })} className="fd-field mt-1.5" /></label></div>}</div>)}</fieldset>
      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Registe somente enquadramentos conhecidos. A aplicação não presume um regime fiscal universal para a empresa.</p>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={loading} className="fd-button-primary w-full">{loading ? 'A concluir…' : 'Concluir configuração'}</button>
    </form>
  </AuthFrame>;
}
