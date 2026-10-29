'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Mail } from 'lucide-react';
import api from '@/services/api';
import AuthFrame from '@/components/auth/AuthFrame';
import { normalizeRecoveryEmail } from '@/lib/auth-form-validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: normalizeRecoveryEmail(email) });
      setSent(true);
    } catch {
      setError('Não foi possível processar o pedido agora. Aguarde e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame eyebrow="RECUPERAR ACESSO" title="Recuperar acesso" description="Receba um código temporário para definir uma nova palavra-passe." backHref="/login" backLabel="Voltar ao início de sessão">
      {sent ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          <h2 className="mt-3 text-lg font-semibold text-emerald-950">Pedido recebido</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900">Se existir uma conta associada, enviámos um código de recuperação para esse email.</p>
          <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="fd-button-primary mt-5 w-full">Introduzir código</Link>
          <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-[#0b6f93] underline underline-offset-2">Voltar ao início de sessão</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-slate-700"><Mail className="mb-2 h-5 w-5 text-cyan-800" />Por segurança, a confirmação não revela se o email está registado.</div>
          <label htmlFor="forgot-password-email" className="fd-label">Email da conta
            <input id="forgot-password-email" required type="email" autoComplete="email" value={email} disabled={loading} onChange={(event) => setEmail(event.target.value)} className="fd-field mt-1.5" placeholder="nome@empresa.ao" />
          </label>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button disabled={loading} aria-busy={loading} className="fd-button-primary w-full">{loading ? 'A processar…' : 'Enviar instruções'}</button>
        </form>
      )}
    </AuthFrame>
  );
}
