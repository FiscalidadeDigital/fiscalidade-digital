'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/services/auth';
import AuthFrame from '@/components/auth/AuthFrame';
import PasswordInput from '@/components/auth/PasswordInput';
import { validateRegistrationForm, type FieldErrors, type RegistrationForm } from '@/lib/auth-form-validation';

const initialForm: RegistrationForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptPrivacyPolicy: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegistrationForm>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField<Key extends keyof RegistrationForm>(key: Key, value: RegistrationForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validateRegistrationForm(form);

    setFieldErrors(nextErrors);
    setFormError('');
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const result = await register(form);
      router.replace(`/verify-email?email=${encodeURIComponent(result.email)}`);
    } catch (cause: unknown) {
      const response = (cause as { response?: { status?: number; data?: { message?: unknown } } })?.response;
      const message = response?.data?.message;
      setFormError(response?.status === 429
        ? 'Foram efectuadas várias tentativas. Aguarde alguns instantes e tente novamente.'
        : typeof message === 'string' ? message : 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame eyebrow="CRIAR CONTA" title="Criar conta" description="Crie a conta para começar a organizar a informação da sua empresa." backHref="/" backLabel="Voltar ao site">
      <form className="space-y-4" onSubmit={submit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor="register-name" className="fd-label">Nome completo
            <input id="register-name" required autoComplete="name" value={form.name} onChange={(event) => updateField('name', event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'register-name-error' : undefined} className="fd-field mt-1.5" />
            {fieldErrors.name && <span id="register-name-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.name}</span>}
          </label>
          <label htmlFor="register-email" className="fd-label">Email
            <input id="register-email" required type="email" autoComplete="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'register-email-error' : undefined} className="fd-field mt-1.5" />
            {fieldErrors.email && <span id="register-email-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.email}</span>}
          </label>
        </div>
        <PasswordInput id="register-password" label="Palavra-passe" value={form.password} onChange={(value) => updateField('password', value)} autoComplete="new-password" error={fieldErrors.password} helperText="Pelo menos 12 caracteres." disabled={loading} />
        <PasswordInput id="register-confirm-password" label="Confirmar palavra-passe" value={form.confirmPassword} onChange={(value) => updateField('confirmPassword', value)} autoComplete="new-password" error={fieldErrors.confirmPassword} disabled={loading} />
        <fieldset aria-describedby={fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy ? 'registration-consent-errors' : undefined} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">Consentimentos obrigatórios</legend>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required type="checkbox" checked={form.acceptTerms} disabled={loading} onChange={(event) => updateField('acceptTerms', event.target.checked)} className="mt-1" /><span>Li e aceito os <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0b6f93] underline underline-offset-2">Termos de Utilização</Link>.</span></label>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700"><input required type="checkbox" checked={form.acceptPrivacyPolicy} disabled={loading} onChange={(event) => updateField('acceptPrivacyPolicy', event.target.checked)} className="mt-1" /><span>Li e aceito a <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0b6f93] underline underline-offset-2">Política de Privacidade</Link>.</span></label>
          {(fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy) && <p id="registration-consent-errors" role="alert" className="text-sm text-red-700">{fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy}</p>}
        </fieldset>
        {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <button disabled={loading} aria-busy={loading} className="fd-button-primary w-full">{loading ? 'A criar conta…' : 'Criar conta'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-[#66758d]">Já tem conta? <Link className="font-semibold text-[#0b6f93] underline-offset-2 hover:underline" href="/login">Entrar</Link></p>
    </AuthFrame>
  );
}
