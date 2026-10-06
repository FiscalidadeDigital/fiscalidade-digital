'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import AuthFrame from '@/components/auth/AuthFrame';

function ResetPasswordContent() {
  const router = useRouter(); const params = useSearchParams();
  const [form, setForm] = useState({ email: params.get('email') ?? '', code: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); try { await api.post('/auth/reset-password', form); router.replace('/login'); } catch { setError('O código é inválido, expirou ou os dados não são válidos.'); } finally { setLoading(false); } }
  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <AuthFrame title="Definir nova palavra-passe" description="Utilize o código recebido e escolha uma palavra-passe exclusiva com pelo menos 12 caracteres." backHref="/forgot-password" backLabel="Voltar à recuperação">
    <form onSubmit={submit} className="space-y-4">
      <label className="fd-label">Email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => field('email', event.target.value)} className="fd-field mt-1.5" /></label>
      <label className="fd-label">Código de recuperação<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={form.code} onChange={(event) => field('code', event.target.value.replace(/\D/g, ''))} className="fd-field mt-1.5 text-center tracking-[.35em]" placeholder="000000" /></label>
      <label className="fd-label">Nova palavra-passe<input required type="password" autoComplete="new-password" minLength={12} value={form.password} onChange={(event) => field('password', event.target.value)} className="fd-field mt-1.5" /></label>
      <label className="fd-label">Confirmar palavra-passe<input required type="password" autoComplete="new-password" minLength={12} value={form.confirmPassword} onChange={(event) => field('confirmPassword', event.target.value)} className="fd-field mt-1.5" /></label>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={loading} className="fd-button-primary w-full">{loading ? 'A guardar…' : 'Guardar palavra-passe'}</button>
    </form>
  </AuthFrame>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-slate-100 p-4 text-sm text-slate-600">A carregar…</main>}><ResetPasswordContent /></Suspense>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-[#f3f5f7] p-4 text-[#172642]"><div className="w-full max-w-md rounded-xl border border-[#d9e0e7] bg-white p-6 text-sm text-[#66758d] shadow-sm sm:p-8">A carregar…</div></main>}><ResetPasswordContent /></Suspense>;
}
