'use client';

import axios from 'axios';
import {
  ArrowRight,
  KeyRound,
  Loader2,
  LockKeyhole,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';

import PasswordInput from '@/components/auth/PasswordInput';
import {
  changePlatformAdminPassword,
  getPlatformAdmin,
  hasAdminToken,
  loginPlatformAdmin,
  saveAdminToken,
} from '@/services/admin-api';

type AdminFieldErrors = {
  email?: string;
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
};

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível concluir o pedido. Tente novamente.';
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AdminFieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const focusFirstErrorRef = useRef(false);

  useEffect(() => {
    async function checkSession() {
      if (!hasAdminToken()) {
        setCheckingSession(false);
        return;
      }

      try {
        const admin = await getPlatformAdmin();
        if (admin.mustChangePassword) {
          setRequiresPasswordChange(true);
        } else {
          router.replace('/admin/dashboard');
          return;
        }
      } catch {
        // O interceptor remove apenas a sessão administrativa inválida.
      }

      setCheckingSession(false);
    }

    void checkSession();
  }, [router]);

  useEffect(() => {
    if (!focusFirstErrorRef.current) {
      return;
    }

    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
    focusFirstErrorRef.current = false;
  }, [fieldErrors]);

  function clearFieldError(field: keyof AdminFieldErrors) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const nextFieldErrors: AdminFieldErrors = {};

    if (!email.trim()) {
      nextFieldErrors.email = 'Introduza o email administrativo.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextFieldErrors.email = 'Introduza um email válido.';
    }

    if (!password) {
      nextFieldErrors.password = 'Introduza a palavra-passe.';
    } else if (password.length < 12) {
      nextFieldErrors.password = 'A palavra-passe deve ter pelo menos 12 caracteres.';
    }

    focusFirstErrorRef.current = Object.keys(nextFieldErrors).length > 0;
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    setLoading(true);

    try {
      const session = await loginPlatformAdmin(email, password);
      saveAdminToken(session.access_token);

      if (session.requires_password_change) {
        setRequiresPasswordChange(true);
      } else {
        router.replace('/admin/dashboard');
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const nextFieldErrors: AdminFieldErrors = {};

    if (!password) {
      nextFieldErrors.password = 'Introduza a palavra-passe temporária.';
    } else if (password.length < 12) {
      nextFieldErrors.password = 'A palavra-passe deve ter pelo menos 12 caracteres.';
    }

    if (!newPassword) {
      nextFieldErrors.newPassword = 'Introduza a nova palavra-passe.';
    } else if (newPassword.length < 12) {
      nextFieldErrors.newPassword = 'A palavra-passe deve ter pelo menos 12 caracteres.';
    }

    if (!confirmPassword) {
      nextFieldErrors.confirmPassword = 'Confirme a nova palavra-passe.';
    } else if (newPassword !== confirmPassword) {
      nextFieldErrors.confirmPassword = 'A confirmação não corresponde à nova palavra-passe.';
    }

    focusFirstErrorRef.current = Object.keys(nextFieldErrors).length > 0;
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length) {
      return;
    }

    setLoading(true);
    try {
      const session = await changePlatformAdminPassword(password, newPassword);
      saveAdminToken(session.access_token);
      router.replace('/admin/dashboard');
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="fd-theme-scope flex min-h-screen items-center justify-center bg-[var(--fd-page)] text-[var(--fd-text)]">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" aria-label="A validar sessão" />
      </main>
    );
  }

  return (
    <main className="fd-theme-scope min-h-screen bg-[var(--fd-page)] text-[var(--fd-text)] lg:grid lg:grid-cols-[minmax(320px,0.72fr)_1.28fr]">
      <section className="flex min-h-[290px] flex-col justify-between bg-slate-950 px-7 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
        <div>
          <div>
            <div className="inline-flex rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
              <Image
                src="/logofiscalidade.png"
                alt="Fiscalidade Digital"
                width={184}
                height={62}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">Administração da plataforma</p>
          </div>

          <div className="mt-16 max-w-md lg:mt-28">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
              Acesso restrito
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
              Supervisão segura da operação SaaS.
            </h1>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              Esta área usa autenticação separada das contas empresariais e apresenta apenas indicadores agregados da plataforma.
            </p>
          </div>
        </div>

        <p className="mt-10 text-xs leading-5 text-slate-500">
          As operações administrativas são registadas para auditoria.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--fd-border)] bg-[var(--fd-surface)]">
            {requiresPasswordChange ? (
              <KeyRound className="h-5 w-5 text-amber-600" />
            ) : (
              <LockKeyhole className="h-5 w-5 text-teal-700" />
            )}
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            {requiresPasswordChange ? 'Definir nova palavra-passe' : 'Entrar na administração'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--fd-muted)]">
            {requiresPasswordChange
              ? 'A credencial temporária tem de ser substituída antes do primeiro acesso ao painel.'
              : 'Utilize exclusivamente a conta administrativa da plataforma.'}
          </p>

          <form
            ref={formRef}
            className="mt-8 space-y-5"
            onSubmit={requiresPasswordChange ? handlePasswordChange : handleLogin}
            noValidate
          >
            {!requiresPasswordChange && (
              <label htmlFor="admin-email" className="fd-label">
                Email administrativo
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  disabled={loading}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearFieldError('email');
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'admin-email-error' : undefined}
                  className="fd-field mt-1.5"
                />
                {fieldErrors.email ? (
                  <span id="admin-email-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">
                    {fieldErrors.email}
                  </span>
                ) : null}
              </label>
            )}

            <PasswordInput
              id="admin-current-password"
              label={requiresPasswordChange ? 'Palavra-passe temporária' : 'Palavra-passe'}
              value={password}
              onChange={(value) => {
                setPassword(value);
                clearFieldError('password');
              }}
              autoComplete="current-password"
              error={fieldErrors.password}
              disabled={loading}
            />

            {requiresPasswordChange && (
              <>
                <PasswordInput
                  id="admin-new-password"
                  label="Nova palavra-passe"
                  value={newPassword}
                  onChange={(value) => {
                    setNewPassword(value);
                    clearFieldError('newPassword');
                  }}
                  autoComplete="new-password"
                  error={fieldErrors.newPassword}
                  disabled={loading}
                />
                <PasswordInput
                  id="admin-confirm-password"
                  label="Confirmar nova palavra-passe"
                  value={confirmPassword}
                  onChange={(value) => {
                    setConfirmPassword(value);
                    clearFieldError('confirmPassword');
                  }}
                  autoComplete="new-password"
                  error={fieldErrors.confirmPassword}
                  disabled={loading}
                />
                <p className="text-xs leading-5 text-[var(--fd-muted)]">
                  Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.
                </p>
              </>
            )}

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="fd-button-primary w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {requiresPasswordChange ? 'Guardar e continuar' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
