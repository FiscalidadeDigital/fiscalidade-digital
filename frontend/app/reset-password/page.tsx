'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import AuthFrame from '@/components/auth/AuthFrame';
import PasswordInput from '@/components/auth/PasswordInput';
import { validateResetPasswordForm, type FieldErrors, type ResetPasswordForm } from '@/lib/auth-form-validation';

function ResetPasswordContent() {
  const params = useSearchParams();
  const [form, setForm] = useState<ResetPasswordForm>({ email: params.get('email') ?? '', code: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ResetPasswordForm>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  function updateField<Key extends keyof ResetPasswordForm>(key: Key, value: ResetPasswordForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validateResetPasswordForm(form);

    setFieldErrors(nextErrors);
    setError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await api.post('/auth/reset-password', form);
      setCompleted(true);
    } catch {
      setError('O código é inválido, expirou ou os dados não são válidos. Peça um novo código e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame eyebrow="RECUPERAR ACESSO" title="Definir nova palavra-passe" description="Utilize o código recebido e escolha uma palavra-passe exclusiva com pelo menos 12 caracteres." backHref="/forgot-password" backLabel="Voltar à recuperação">
      {completed ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          <h2 className="mt-3 text-lg font-semibold text-emerald-950">Palavra-passe actualizada</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900">Já pode iniciar sessão com a nova palavra-passe.</p>
          <Link href="/login" className="fd-button-primary mt-5 w-full">Ir para iniciar sessão</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <label htmlFor="reset-password-email" className="fd-label">Email
            <input id="reset-password-email" required type="email" autoComplete="email" value={form.email} disabled={loading} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'reset-password-email-error' : undefined} className="fd-field mt-1.5" />
            {fieldErrors.email && <span id="reset-password-email-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.email}</span>}
          </label>
          <label htmlFor="reset-password-code" className="fd-label">Código de recuperação
            <input id="reset-password-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={form.code} disabled={loading} onChange={(event) => updateField('code', event.target.value.replace(/\D/g, ''))} aria-invalid={Boolean(fieldErrors.code)} aria-describedby={fieldErrors.code ? 'reset-password-code-error' : undefined} className="fd-field mt-1.5 text-center tracking-[.35em]" placeholder="000000" />
            {fieldErrors.code && <span id="reset-password-code-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.code}</span>}
          </label>
          <PasswordInput id="reset-password-new" label="Nova palavra-passe" value={form.password} onChange={(value) => updateField('password', value)} autoComplete="new-password" error={fieldErrors.password} helperText="Pelo menos 12 caracteres." disabled={loading} />
          <PasswordInput id="reset-password-confirm" label="Confirmar palavra-passe" value={form.confirmPassword} onChange={(value) => updateField('confirmPassword', value)} autoComplete="new-password" error={fieldErrors.confirmPassword} disabled={loading} />
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error} <Link href="/forgot-password" className="font-semibold underline underline-offset-2">Pedir novo código</Link></p>}
          <button disabled={loading} aria-busy={loading} className="fd-button-primary w-full">{loading ? 'A guardar…' : 'Guardar palavra-passe'}</button>
        </form>
      )}
    </AuthFrame>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-slate-100 p-4 text-sm text-slate-600">A carregar…</main>}><ResetPasswordContent /></Suspense>;
}
