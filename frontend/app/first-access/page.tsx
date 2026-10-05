'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';

export default function FirstAccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '', acceptTerms: false, acceptPrivacyPolicy: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const field = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    const token = params.get('token');
    if (!token) return setError('O convite é inválido.');
    setLoading(true); setError('');
    try { await api.post('/auth/invitations/accept', { token, ...form }); router.replace('/login'); }
    catch { setError('O convite é inválido, expirou ou já foi utilizado.'); }
    finally { setLoading(false); }
  }
  return <main className="fd-auth-page grid min-h-screen place-items-center bg-[#f3f5f7] p-4 text-[#172642]"><form onSubmit={submit} className="w-full max-w-md rounded-xl border border-[#d9e0e7] bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#0b6f93]">Fiscalidade Digital</p><h1 className="mt-3 text-2xl font-semibold">Primeiro acesso</h1><p className="mt-2 text-sm text-[#66758d]">Complete o seu perfil e escolha uma palavra-passe pessoal.</p><input required minLength={2} value={form.name} onChange={(event) => field('name', event.target.value)} className="mt-6 w-full rounded-md border p-3" placeholder="Nome completo" /><input required type="password" minLength={12} value={form.password} onChange={(event) => field('password', event.target.value)} className="mt-3 w-full rounded-md border p-3" placeholder="Palavra-passe" /><input required type="password" minLength={12} value={form.confirmPassword} onChange={(event) => field('confirmPassword', event.target.value)} className="mt-3 w-full rounded-md border p-3" placeholder="Confirmar palavra-passe" /><label className="mt-4 flex gap-2 text-xs"><input required type="checkbox" checked={form.acceptTerms} onChange={(event) => field('acceptTerms', event.target.checked)} />Aceito os Termos de Utilização.</label><label className="mt-3 flex gap-2 text-xs"><input required type="checkbox" checked={form.acceptPrivacyPolicy} onChange={(event) => field('acceptPrivacyPolicy', event.target.checked)} />Aceito a Política de Privacidade.</label>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-md bg-[#0b6f93] p-3 font-semibold text-white disabled:opacity-60">{loading ? 'A criar acesso…' : 'Criar acesso'}</button></form></main>;
}
