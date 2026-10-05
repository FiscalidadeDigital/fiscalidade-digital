'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

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
  return <main className="fd-auth-page grid min-h-screen place-items-center bg-[#f3f5f7] p-4 text-[#172642]"><form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-[#d9e0e7] bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#0b6f93]">Passo 2 de 2</p><h1 className="mt-3 text-2xl font-semibold">Configure a empresa</h1><p className="mt-2 text-sm leading-6 text-[#66758d]">Os enquadramentos são independentes por imposto. Pode concluir agora e configurá-los depois na Central Fiscal.</p><label className="mt-6 block text-sm font-medium">Nome da empresa<input required value={companyName} onChange={(event) => setCompanyName(event.target.value)} className="mt-1 w-full rounded-md border p-3" /></label><label className="mt-4 block text-sm font-medium">NIF<input required value={nif} onChange={(event) => setNif(event.target.value)} className="mt-1 w-full rounded-md border p-3" /></label><fieldset className="mt-6 space-y-3"><legend className="text-sm font-semibold">Enquadramentos iniciais (opcional)</legend>{enrollments.map((item, index) => <div key={item.taxType} className="rounded-lg border border-[#d9e0e7] p-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={item.enabled} onChange={(event) => change(index, { enabled: event.target.checked })} />Configurar {item.taxType === 'IVA' ? 'IVA' : 'Imposto Industrial'}</label>{item.enabled && <div className="mt-3 grid gap-3 sm:grid-cols-2"><select value={item.regime} onChange={(event) => change(index, { regime: event.target.value as Enrollment['regime'] })} className="rounded-md border p-2.5"><option value="GERAL">Regime Geral</option><option value="SIMPLIFICADO">Regime Simplificado</option></select><input required type="date" value={item.validFrom} onChange={(event) => change(index, { validFrom: event.target.value })} className="rounded-md border p-2.5" /></div>}</div>)}</fieldset>{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-md bg-[#0b6f93] p-3 font-semibold text-white">{loading ? 'A concluir…' : 'Concluir onboarding'}</button></form></main>;
}
