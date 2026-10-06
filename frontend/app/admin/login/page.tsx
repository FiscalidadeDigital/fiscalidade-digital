'use client';

import axios from 'axios';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import {
  changePlatformAdminPassword,
  getPlatformAdmin,
  hasAdminToken,
  loginPlatformAdmin,
  saveAdminToken,
} from '@/services/admin-api';

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
  const [showPassword, setShowPassword] = useState(false);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
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

    if (newPassword !== confirmPassword) {
      setError('A confirmação não corresponde à nova palavra-passe.');
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10">
              <ShieldCheck className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <p className="text-sm font-semibold">Fiscalidade Digital</p>
              <p className="text-xs text-slate-400">Administração da plataforma</p>
            </div>
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
            className="mt-8 space-y-5"
            onSubmit={requiresPasswordChange ? handlePasswordChange : handleLogin}
          >
            {!requiresPasswordChange && (
              <label className="block text-sm font-medium">
                Email administrativo
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-surface)] px-3.5 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </label>
            )}

            <label className="block text-sm font-medium">
              {requiresPasswordChange ? 'Palavra-passe temporária' : 'Palavra-passe'}
              <span className="relative mt-2 block">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={requiresPasswordChange ? 'current-password' : 'current-password'}
                  required
                  minLength={12}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-surface)] px-3.5 py-3 pr-11 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--fd-muted)] hover:text-[var(--fd-text)]"
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {requiresPasswordChange && (
              <>
                <label className="block text-sm font-medium">
                  Nova palavra-passe
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-surface)] px-3.5 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Confirmar nova palavra-passe
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-[var(--fd-border)] bg-[var(--fd-surface)] px-3.5 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </label>
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
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
