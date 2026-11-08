'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AuthFrame from '@/components/auth/AuthFrame';
import PasswordInput from '@/components/auth/PasswordInput';
import { useAuth } from '@/context/AuthContext';
import { getSafeInternalRedirect } from '@/lib/route-access';

function getLoginErrorMessage(cause: unknown): string {
  const response = (
    cause as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    }
  )?.response;
  const message = response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (cause instanceof Error && cause.message) {
    return cause.message;
  }

  return 'Não foi possível iniciar sessão.';
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const focusFirstErrorRef = useRef(false);
  const [sessionNotice] = useState(() => (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('reason') === 'session-expired'
      ? 'A sua sessão terminou por segurança. Inicie sessão novamente para continuar.'
      : ''
  ));

  useEffect(() => {
    if (!focusFirstErrorRef.current) {
      return;
    }

    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
    focusFirstErrorRef.current = false;
  }, [fieldErrors]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const nextFieldErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!normalizedEmail) {
      nextFieldErrors.email = 'Introduza o seu email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextFieldErrors.email = 'Introduza um email válido.';
    }

    if (!password) {
      nextFieldErrors.password = 'Introduza a sua palavra-passe.';
    } else if (password.length < 6) {
      nextFieldErrors.password = 'A palavra-passe deve ter pelo menos 6 caracteres.';
    }

    focusFirstErrorRef.current = Object.keys(nextFieldErrors).length > 0;
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    setLoading(true);
    try {
      await login(normalizedEmail, password);

      const requestedRedirect = typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search).get('redirect');

      router.replace(getSafeInternalRedirect(requestedRedirect));
    } catch (cause: unknown) {
      setError(getLoginErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="INICIAR SESSÃO"
      title="Entrar na plataforma"
      description="Aceda à informação fiscal e empresarial da sua empresa."
      backHref="/"
      backLabel="Voltar ao site"
    >
      <form ref={formRef} onSubmit={handleLogin} noValidate className="space-y-4">
        {sessionNotice && (
          <p role="status" className="rounded-lg border border-fd-accent-soft bg-fd-accent-soft p-3 text-sm leading-6 text-fd-primary">
            {sessionNotice}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
            {error}
          </p>
        )}

        <label htmlFor="login-email" className="fd-label">
          Email
          <input
            id="login-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            disabled={loading}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((current) => ({ ...current, email: undefined }));
              setError('');
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            className="fd-field mt-1.5"
            placeholder="nome@empresa.ao"
          />
          {fieldErrors.email && (
            <span id="login-email-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">
              {fieldErrors.email}
            </span>
          )}
        </label>

        <div className="relative pt-7">
          <Link href="/forgot-password" className="absolute right-0 top-0 z-10 inline-flex min-h-11 items-center text-sm font-semibold text-fd-accent underline-offset-2 hover:underline">
            Esqueceu-se da palavra-passe?
          </Link>
          <PasswordInput
            id="login-password"
            label="Palavra-passe"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
              setError('');
            }}
            autoComplete="current-password"
            minLength={6}
            disabled={loading}
            error={fieldErrors.password}
          />
        </div>

        <button disabled={loading} aria-busy={loading} className="fd-button-primary w-full">
          {loading ? 'A iniciar sessão…' : 'Iniciar sessão'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--fd-text-muted)]">
        Ainda não tem conta?{' '}
        <Link className="font-semibold text-fd-accent underline-offset-2 hover:underline" href="/register">
          Criar conta
        </Link>
      </p>
    </AuthFrame>
  );
}
