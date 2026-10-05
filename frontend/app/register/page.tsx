'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/services/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false, acceptPrivacyPolicy: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('As palavras-passe não coincidem.');
    setLoading(true);
    try {
      const result = await register(form);
      router.replace(`/verify-email?email=${encodeURIComponent(result.email)}`);
    } catch (cause: unknown) {
      const message = (cause as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Não foi possível criar a conta.');
    } finally { setLoading(false); }
  }

  const field = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  return <main className="fd-auth-page min-h-screen bg-[#f3f5f7] px-4 py-8 text-[#172642] sm:px-6 lg:grid lg:place-items-center">
    <section className="mx-auto w-full max-w-md rounded-xl border border-[#d9e0e7] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#0b6f93]">Fiscalidade Digital</p>
      <h1 className="mt-3 text-2xl font-semibold">Criar conta</h1>
      <p className="mt-2 text-sm leading-6 text-[#66758d]">Comece por proteger a sua conta. A empresa e os enquadramentos fiscais são configurados depois da confirmação do email.</p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium">Nome completo<input required value={form.name} onChange={(e) => field('name', e.target.value)} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2.5" /></label>
        <label className="block text-sm font-medium">Email<input required type="email" value={form.email} onChange={(e) => field('email', e.target.value)} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2.5" /></label>
        <label className="block text-sm font-medium">Palavra-passe<input required type="password" minLength={12} value={form.password} onChange={(e) => field('password', e.target.value)} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2.5" /></label>
        <label className="block text-sm font-medium">Confirmar palavra-passe<input required type="password" minLength={12} value={form.confirmPassword} onChange={(e) => field('confirmPassword', e.target.value)} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2.5" /></label>
        <label className="flex gap-2 text-sm"><input required type="checkbox" checked={form.acceptTerms} onChange={(e) => field('acceptTerms', e.target.checked)} />Aceito os termos de utilização.</label>
        <label className="flex gap-2 text-sm"><input required type="checkbox" checked={form.acceptPrivacyPolicy} onChange={(e) => field('acceptPrivacyPolicy', e.target.checked)} />Aceito a política de privacidade.</label>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-md bg-[#0b6f93] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'A criar conta…' : 'Continuar'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-[#66758d]">Já tem conta? <Link className="font-semibold text-[#0b6f93]" href="/login">Inicie sessão</Link></p>
    </section>
  </main>;
}
