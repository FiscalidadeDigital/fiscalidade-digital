'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';

export default function VerifyEmailPage() {
  const router = useRouter(); const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? ''); const [code, setCode] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); try { const { data } = await api.post('/auth/verify-email', { email, code }); sessionStorage.setItem('fd-onboarding-token', data.onboardingToken); router.replace('/onboarding'); } catch { setError('Não foi possível confirmar este código.'); } finally { setLoading(false); } }
  return <main className="fd-auth-page grid min-h-screen place-items-center bg-[#f3f5f7] p-4 text-[#172642]"><form onSubmit={submit} className="w-full max-w-md rounded-xl border border-[#d9e0e7] bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#0b6f93]">Fiscalidade Digital</p><h1 className="mt-3 text-2xl font-semibold">Confirme o email</h1><p className="mt-2 text-sm text-[#66758d]">Introduza o código de seis dígitos enviado para o seu email.</p><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-6 w-full rounded-md border p-3" placeholder="Email" /><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="mt-3 w-full rounded-md border p-3 tracking-[.45em]" placeholder="000000" />{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-md bg-[#0b6f93] p-3 font-semibold text-white">{loading ? 'A confirmar…' : 'Confirmar email'}</button></form></main>;
}
