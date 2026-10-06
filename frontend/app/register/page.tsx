'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/services/auth';
import AuthFrame from '@/components/auth/AuthFrame';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false, acceptPrivacyPolicy: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('As palavras-passe não coincidem.');
    setLoading(true);
    try { const result = await register(form); router.replace(`/verify-email?email=${encodeURIComponent(result.email)}`); }
    catch (cause: unknown) { const response = (cause as { response?: { status?: number; data?: { message?: string } } })?.response; setError(response?.status === 429 ? 'Foram efectuadas várias tentativas. Aguarde alguns instantes e tente novamente.' : response?.data?.message || 'Não foi possível criar a conta.'); }
    finally { setLoading(false); }
  }
  const field = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return <AuthFrame eyebrow="CRIAR CONTA" title="Comece a organizar a gestão fiscal da sua empresa." description="Crie a sua conta e tenha num só lugar as obrigações fiscais, prazos, alertas, facturação e informação essencial da sua empresa." backHref="/" backLabel="Voltar ao site"><form className="mt-7 space-y-4" onSubmit={submit}><label className="fd-label">Nome completo<input required autoComplete="name" value={form.name} onChange={(e) => field('name', e.target.value)} className="fd-field mt-1.5" /></label><label className="fd-label">Email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => field('email', e.target.value)} className="fd-field mt-1.5" /></label><label className="fd-label">Palavra-passe<input required type="password" autoComplete="new-password" minLength={12} value={form.password} onChange={(e) => field('password', e.target.value)} className="fd-field mt-1.5" /></label><label className="fd-label">Confirmar palavra-passe<input required type="password" autoComplete="new-password" minLength={12} value={form.confirmPassword} onChange={(e) => field('confirmPassword', e.target.value)} className="fd-field mt-1.5" /></label><fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><legend className="px-1 text-sm font-semibold text-slate-800">Consentimentos obrigatórios</legend><label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required type="checkbox" checked={form.acceptTerms} onChange={(e) => field('acceptTerms', e.target.checked)} className="mt-1" /><span>Li e aceito os <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0b6f93] underline">Termos de Utilização</Link>.</span></label><label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required type="checkbox" checked={form.acceptPrivacyPolicy} onChange={(e) => field('acceptPrivacyPolicy', e.target.checked)} className="mt-1" /><span>Li e aceito a <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0b6f93] underline">Política de Privacidade</Link>.</span></label></fieldset>{error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="fd-button-primary w-full">{loading ? 'A criar conta…' : 'Criar conta'}</button></form><p className="mt-6 text-center text-sm text-[#66758d]">Já tem uma conta? <Link className="font-semibold text-[#0b6f93]" href="/login">Iniciar sessão</Link></p></AuthFrame>;
}
