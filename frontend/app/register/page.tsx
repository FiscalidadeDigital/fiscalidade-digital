'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
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
  const formRef = useRef<HTMLFormElement>(null);
  const focusFirstErrorRef = useRef(false);

  useEffect(() => {
    if (!focusFirstErrorRef.current) {
      return;
    }

    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
    focusFirstErrorRef.current = false;
  }, [fieldErrors]);

  function updateField<Key extends keyof RegistrationForm>(key: Key, value: RegistrationForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setFormError('');
  }

  function validateField(key: keyof RegistrationForm) {
    const nextErrors = validateRegistrationForm(form);
    setFieldErrors((current) => ({
      ...current,
      [key]: nextErrors[key],
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validateRegistrationForm(form);

    focusFirstErrorRef.current = Object.keys(nextErrors).length > 0;
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

  const passwordRequirementMet = form.password.length >= 12;

  return (
    <AuthFrame
      eyebrow="Criar conta"
      title="Criar conta"
      description="Crie a conta para começar a organizar a informação da sua empresa."
      backHref="/"
      backLabel="Voltar ao site"
    >
      <form ref={formRef} className="space-y-6" onSubmit={submit} noValidate>
        <section aria-labelledby="register-personal-data" className="space-y-4">
          <div>
            <h2 id="register-personal-data" className="text-base font-semibold text-[var(--fd-text-primary)]">Os seus dados</h2>
            <p className="mt-1 text-sm text-[var(--fd-text-secondary)]">Use um email a que tenha acesso.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="register-name" className="fd-label">Nome completo
              <input id="register-name" required autoComplete="name" value={form.name} disabled={loading} onChange={(event) => updateField('name', event.target.value)} onBlur={() => validateField('name')} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? 'register-name-error' : undefined} className="fd-field mt-1.5" />
              {fieldErrors.name && <span id="register-name-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.name}</span>}
            </label>
            <label htmlFor="register-email" className="fd-label">Email
              <input id="register-email" required type="email" autoComplete="email" value={form.email} disabled={loading} onChange={(event) => updateField('email', event.target.value)} onBlur={() => validateField('email')} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'register-email-error' : undefined} className="fd-field mt-1.5" placeholder="nome@empresa.ao" />
              {fieldErrors.email && <span id="register-email-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">{fieldErrors.email}</span>}
            </label>
          </div>
        </section>

        <section aria-labelledby="register-security" className="space-y-4 border-t border-[var(--fd-border)] pt-6">
          <div>
            <h2 id="register-security" className="text-base font-semibold text-[var(--fd-text-primary)]">Segurança da conta</h2>
            <p className="mt-1 text-sm text-[var(--fd-text-secondary)]">Escolha uma palavra-passe segura para a sua conta.</p>
          </div>
          <PasswordInput id="register-password" label="Palavra-passe" value={form.password} onChange={(value) => updateField('password', value)} onBlur={() => validateField('password')} autoComplete="new-password" error={fieldErrors.password} helperText="Pelo menos 12 caracteres." disabled={loading} />
          <p className="flex items-center gap-2 text-xs text-[var(--fd-text-secondary)]" aria-live="polite">
            {passwordRequirementMet ? <CheckCircle2 aria-hidden="true" size={16} className="text-fd-success" /> : <Circle aria-hidden="true" size={16} className="text-[var(--fd-text-muted)]" />}
            Pelo menos 12 caracteres
          </p>
          <PasswordInput id="register-confirm-password" label="Confirmar palavra-passe" value={form.confirmPassword} onChange={(value) => updateField('confirmPassword', value)} onBlur={() => validateField('confirmPassword')} autoComplete="new-password" error={fieldErrors.confirmPassword} disabled={loading} />
        </section>

        <fieldset aria-describedby={fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy ? 'registration-consent-errors' : undefined} className="space-y-3 border-y border-[var(--fd-border)] py-5">
          <legend className="px-1 text-sm font-semibold text-[var(--fd-text-primary)]">Termos e privacidade</legend>
          <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-[var(--fd-text-secondary)]"><input required type="checkbox" checked={form.acceptTerms} disabled={loading} aria-invalid={Boolean(fieldErrors.acceptTerms)} onChange={(event) => updateField('acceptTerms', event.target.checked)} onBlur={() => validateField('acceptTerms')} className="mt-1 h-5 w-5 shrink-0 accent-fd-primary" /><span>Li e aceito os <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-fd-accent underline underline-offset-2">Termos de Utilização</Link>.</span></label>
          <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-[var(--fd-text-secondary)]"><input required type="checkbox" checked={form.acceptPrivacyPolicy} disabled={loading} aria-invalid={Boolean(fieldErrors.acceptPrivacyPolicy)} onChange={(event) => updateField('acceptPrivacyPolicy', event.target.checked)} onBlur={() => validateField('acceptPrivacyPolicy')} className="mt-1 h-5 w-5 shrink-0 accent-fd-primary" /><span>Li e aceito a <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-fd-accent underline underline-offset-2">Política de Privacidade</Link>.</span></label>
          {(fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy) && <p id="registration-consent-errors" role="alert" className="text-sm text-red-700">{fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy}</p>}
        </fieldset>

        {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        <button disabled={loading} aria-busy={loading} className="fd-button-primary w-full">{loading ? 'A criar conta…' : 'Criar conta'}</button>
        <p className="text-xs leading-5 text-[var(--fd-text-muted)]">No passo seguinte, confirme o email para ativar a conta.</p>
      </form>
      <p className="mt-6 text-sm text-[var(--fd-text-muted)]">Já tem conta? <Link className="font-semibold text-fd-accent underline-offset-2 hover:underline" href="/login">Entrar</Link></p>
    </AuthFrame>
  );
}
