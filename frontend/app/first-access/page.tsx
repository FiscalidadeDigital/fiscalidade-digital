'use client';

import {
  type FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthFrame from '@/components/auth/AuthFrame';
import PasswordInput from '@/components/auth/PasswordInput';
import api from '@/services/api';

type FirstAccessForm = {
  name: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
};

type FirstAccessErrors = Partial<Record<keyof FirstAccessForm, string>>;

const initialForm: FirstAccessForm = {
  name: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptPrivacyPolicy: false,
};

function FirstAccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState<FirstAccessForm>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<FirstAccessErrors>({});
  const [error, setError] = useState('');
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

  function updateField<Key extends keyof FirstAccessForm>(
    key: Key,
    value: FirstAccessForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  }

  function validateForm(): FirstAccessErrors {
    const errors: FirstAccessErrors = {};

    if (form.name.trim().length < 2) {
      errors.name = 'Indique o seu nome completo.';
    }

    if (form.password.length < 12) {
      errors.password = 'A palavra-passe deve ter pelo menos 12 caracteres.';
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'As palavras-passe não coincidem.';
    }

    if (!form.acceptTerms) {
      errors.acceptTerms = 'É necessário aceitar os Termos de Utilização.';
    }

    if (!form.acceptPrivacyPolicy) {
      errors.acceptPrivacyPolicy = 'É necessário aceitar a Política de Privacidade.';
    }

    return errors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const token = params.get('token');

    if (!token) {
      setError('O convite é inválido. Peça um novo convite ao administrador da empresa.');
      return;
    }

    const nextFieldErrors = validateForm();
    focusFirstErrorRef.current = Object.keys(nextFieldErrors).length > 0;
    setFieldErrors(nextFieldErrors);
    setError('');

    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/invitations/accept', { token, ...form });
      router.replace('/login');
    } catch {
      setError('O convite é inválido, expirou ou já foi utilizado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="ACESSO POR CONVITE"
      title="Primeiro acesso"
      description="Complete o perfil associado ao convite e defina uma palavra-passe pessoal."
      backHref="/login"
      backLabel="Voltar ao início de sessão"
    >
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
        <label htmlFor="first-access-name" className="fd-label">
          Nome completo
          <input
            id="first-access-name"
            required
            minLength={2}
            autoComplete="name"
            value={form.name}
            disabled={loading}
            onChange={(event) => updateField('name', event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'first-access-name-error' : undefined}
            className="fd-field mt-1.5"
          />
          {fieldErrors.name ? (
            <span id="first-access-name-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">
              {fieldErrors.name}
            </span>
          ) : null}
        </label>

        <PasswordInput
          id="first-access-password"
          label="Palavra-passe"
          value={form.password}
          onChange={(value) => updateField('password', value)}
          autoComplete="new-password"
          error={fieldErrors.password}
          helperText="Pelo menos 12 caracteres."
          disabled={loading}
        />

        <PasswordInput
          id="first-access-confirm-password"
          label="Confirmar palavra-passe"
          value={form.confirmPassword}
          onChange={(value) => updateField('confirmPassword', value)}
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          disabled={loading}
        />

        <fieldset
          aria-describedby={
            fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy
              ? 'first-access-consent-errors'
              : undefined
          }
          className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <legend className="px-1 text-sm font-semibold text-slate-800">
            Consentimentos obrigatórios
          </legend>
          <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-slate-700">
            <input
              required
              type="checkbox"
              checked={form.acceptTerms}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.acceptTerms)}
              onChange={(event) => updateField('acceptTerms', event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-fd-primary"
            />
            <span>
              Aceito os{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-fd-accent underline underline-offset-2">
                Termos de Utilização
              </Link>.
            </span>
          </label>
          <label className="flex min-h-11 items-start gap-3 text-sm leading-6 text-slate-700">
            <input
              required
              type="checkbox"
              checked={form.acceptPrivacyPolicy}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.acceptPrivacyPolicy)}
              onChange={(event) => updateField('acceptPrivacyPolicy', event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-fd-primary"
            />
            <span>
              Aceito a{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-fd-accent underline underline-offset-2">
                Política de Privacidade
              </Link>.
            </span>
          </label>
          {fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy ? (
            <p id="first-access-consent-errors" role="alert" className="text-sm text-red-700">
              {fieldErrors.acceptTerms || fieldErrors.acceptPrivacyPolicy}
            </p>
          ) : null}
        </fieldset>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button disabled={loading} aria-busy={loading} className="fd-button-primary w-full">
          {loading ? 'A criar acesso…' : 'Criar acesso'}
        </button>
      </form>
    </AuthFrame>
  );
}

export default function FirstAccessPage() {
  return (
    <Suspense fallback={<main className="fd-auth-page grid min-h-screen place-items-center bg-slate-100 p-4 text-sm text-slate-600">A carregar…</main>}>
      <FirstAccessContent />
    </Suspense>
  );
}
