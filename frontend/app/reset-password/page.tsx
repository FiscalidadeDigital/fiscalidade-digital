'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';

function ResetPasswordContent() {
  const router = useRouter(); const params = useSearchParams();
  const [form, setForm] = useState({ email: params.get('email') ?? '', code: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); try { await api.post('/auth/reset-password', form); router.replace('/login'); } catch { setError('O código é inválido, expirou ou os dados não são válidos.'); } finally { setLoading(false); } }
  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <main className="fd-auth-page grid min-h-screen place-items-center bg-[#f3f5f7] p-4 text-[#172642]"><form onSubmit={submit} className="w-full max-w-md rounded-xl border border-[#d9e0e7] bg-white p-6 shadow-sm sm:p-8"><h1 className="text-2xl font-semibold">Nova palavra-passe</h1><input required type="email" value={form.email} onChange={(e) => field('email', e.target.value)} className="mt-6 w-full rounded-md border p-3" placeholder="Email" /><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={form.code} onChange={(e) => field('code', e.target.value.replace(/\D/g, ''))} className="mt-3 w-full rounded-md border p-3 tracking-[.35em]" placeholder="Código" /><input required type="password" minLength={12} value={form.password} onChange={(e) => field('password', e.target.value)} className="mt-3 w-full rounded-md border p-3" placeholder="Nova palavra-passe" /><input required type="password" minLength={12} value={form.confirmPassword} onChange={(e) => field('confirmPassword', e.target.value)} className="mt-3 w-full rounded-md border p-3" placeholder="Confirmar palavra-passe" />{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-md bg-[#0b6f93] p-3 font-semibold text-white disabled:opacity-60">{loading ? 'A guardar…' : 'Guardar palavra-passe'}</button></form></main>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-[#f3f5f7] p-4 text-[#172642]"><div className="w-full max-w-md rounded-xl border border-[#d9e0e7] bg-white p-6 text-sm text-[#66758d] shadow-sm sm:p-8">A carregar…</div></main>}><ResetPasswordContent /></Suspense>;
}
