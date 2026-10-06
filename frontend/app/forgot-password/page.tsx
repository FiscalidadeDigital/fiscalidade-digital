'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import AuthFrame from '@/components/auth/AuthFrame';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch {
      setError('Não foi possível processar o pedido agora. Aguarde e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return <AuthFrame title="Recuperar acesso" description="Receba um código temporário para definir uma nova palavra-passe. A resposta não confirma se o email está registado.">
    {sent ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <CheckCircle2 className="h-6 w-6 text-emerald-700" />
      <h2 className="mt-3 font-semibold text-emerald-950">Pedido recebido</h2>
      <p className="mt-2 text-sm leading-6 text-emerald-900">Se existir uma conta associada, enviámos um código de recuperação.</p>
      <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="fd-button-primary mt-5 w-full">Introduzir código</Link>
    </div> : <form onSubmit={submit} className="space-y-5">
      <label className="fd-label">Email da conta<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="fd-field mt-1.5" placeholder="nome@empresa.ao" /></label>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={loading} className="fd-button-primary w-full">{loading ? 'A processar…' : 'Enviar instruções'}</button>
    </form>}
  </AuthFrame>;
}
