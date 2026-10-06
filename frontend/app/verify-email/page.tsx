'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import AuthFrame from '@/components/auth/AuthFrame';

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(''); setNotice('');
    try {
      const { data } = await api.post('/auth/verify-email', { email, code });
      sessionStorage.setItem('fd-onboarding-token', data.onboardingToken);
      router.replace('/onboarding');
    } catch {
      setError('Não foi possível confirmar este código. Verifique os dados ou solicite um novo código.');
    } finally { setLoading(false); }
  }

  async function resend() {
    if (!email) return setError('Introduza primeiro o email utilizado no registo.');
    setResending(true); setError(''); setNotice('');
    try {
      await api.post('/auth/resend-verification', { email });
      setNotice('Se existir um registo pendente, enviámos novas instruções. Aguarde antes de pedir outro código.');
    } catch (cause: unknown) {
      const status = (cause as { response?: { status?: number } })?.response?.status;
      setError(status === 429 ? 'Aguarde antes de pedir um novo código.' : 'Não foi possível reenviar o código agora. Tente novamente mais tarde.');
    } finally { setResending(false); }
  }

  return <AuthFrame title="Confirme o email" description="Introduza o código de seis dígitos enviado para o seu email. O código é temporário e só pode ser utilizado uma vez." backHref="/register" backLabel="Voltar ao registo">
    <form onSubmit={submit} className="space-y-5">
      <label className="fd-label">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="fd-field mt-1.5" /></label>
      <label className="fd-label">Código de confirmação<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="fd-field mt-1.5 text-center text-lg tracking-[.35em]" placeholder="000000" /></label>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <button disabled={loading || resending} className="fd-button-primary w-full">{loading ? 'A confirmar…' : 'Confirmar email'}</button>
      <button type="button" onClick={() => void resend()} disabled={loading || resending} className="fd-button-secondary w-full">{resending ? 'A reenviar…' : 'Reenviar código'}</button>
    </form>
  </AuthFrame>;
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-slate-100 p-4 text-sm text-slate-600">A carregar…</main>}><VerifyEmailContent /></Suspense>;
}
