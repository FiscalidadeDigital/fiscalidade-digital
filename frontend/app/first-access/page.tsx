'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import AuthFrame from '@/components/auth/AuthFrame';

function FirstAccessContent() {
  const router = useRouter(); const params = useSearchParams();
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '', acceptTerms: false, acceptPrivacyPolicy: false });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const field = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); const token = params.get('token');
    if (!token) return setError('O convite é inválido.');
    if (form.password !== form.confirmPassword) return setError('As palavras-passe não coincidem.');
    setLoading(true); setError('');
    try { await api.post('/auth/invitations/accept', { token, ...form }); router.replace('/login'); }
    catch { setError('O convite é inválido, expirou ou já foi utilizado.'); }
    finally { setLoading(false); }
  }
  return <AuthFrame title="Primeiro acesso" description="Complete o perfil associado ao convite e defina uma palavra-passe pessoal." backHref="/login">
    <form onSubmit={submit} className="space-y-4">
      <label className="fd-label">Nome completo<input required minLength={2} autoComplete="name" value={form.name} onChange={(event) => field('name', event.target.value)} className="fd-field mt-1.5" /></label>
      <label className="fd-label">Palavra-passe<input required type="password" autoComplete="new-password" minLength={12} value={form.password} onChange={(event) => field('password', event.target.value)} className="fd-field mt-1.5" /></label>
      <label className="fd-label">Confirmar palavra-passe<input required type="password" autoComplete="new-password" minLength={12} value={form.confirmPassword} onChange={(event) => field('confirmPassword', event.target.value)} className="fd-field mt-1.5" /></label>
      <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><legend className="px-1 text-sm font-semibold text-slate-800">Consentimentos obrigatórios</legend><label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required type="checkbox" className="mt-1" checked={form.acceptTerms} onChange={(event) => field('acceptTerms', event.target.checked)} /><span>Aceito os <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0b6f93] underline">Termos de Utilização</Link>.</span></label><label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required type="checkbox" className="mt-1" checked={form.acceptPrivacyPolicy} onChange={(event) => field('acceptPrivacyPolicy', event.target.checked)} /><span>Aceito a <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0b6f93] underline">Política de Privacidade</Link>.</span></label></fieldset>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={loading} className="fd-button-primary w-full">{loading ? 'A criar acesso…' : 'Criar acesso'}</button>
    </form>
  </AuthFrame>;
}

export default function FirstAccessPage() {
  return <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-slate-100 p-4 text-sm text-slate-600">A carregar…</main>}><FirstAccessContent /></Suspense>;
}
