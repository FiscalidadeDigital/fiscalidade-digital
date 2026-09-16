
'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { login } from '@/services/auth';
import { saveToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Introduza o seu email.');
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError('Introduza um email válido.');
      return;
    }

    if (!password) {
      setError('Introduza a sua palavra-passe.');
      return;
    }

    if (password.length < 6) {
      setError(
        'A palavra-passe deve ter pelo menos 6 caracteres.',
      );
      return;
    }

    setLoading(true);

    try {
      const data = await login(
        normalizedEmail,
        password,
      );

      if (!data?.access_token) {
        throw new Error(
          'O servidor não devolveu um token de autenticação.',
        );
      }

      saveToken(data.access_token);

      if (typeof window !== 'undefined') {
        if (data.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(data.user),
          );
        }

        if (data.tenant) {
          localStorage.setItem(
            'tenant',
            JSON.stringify(data.tenant),
          );

          if (data.tenant.id) {
            localStorage.setItem(
              'tenantId',
              data.tenant.id,
            );
          }
        }
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Erro ao iniciar sessão:', err);

      let message =
        'Não foi possível iniciar sessão.';

      if (
        err &&
        typeof err === 'object' &&
        'response' in err
      ) {
        const response = (
          err as {
            response?: {
              data?: {
                message?: string | string[];
              };
            };
          }
        ).response;

        const apiMessage = response?.data?.message;

        if (Array.isArray(apiMessage)) {
          message = apiMessage.join(' ');
        } else if (typeof apiMessage === 'string') {
          message = apiMessage;
        }
      } else if (
        err instanceof Error &&
        err.message
      ) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-[#202338]">

      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* PAINEL INSTITUCIONAL */}

        <section className="relative hidden overflow-hidden bg-[#26194e] lg:flex lg:w-[44%] xl:w-[46%]">

          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#9e4f95]/20 blur-3xl" />

          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#5940d7]/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            <Link href="/" className="inline-block">
              <Image
                src="/logofiscalidade.png"
                alt="Fiscalidade Digital"
                width={230}
                height={70}
                className="h-auto w-auto max-w-[230px] object-contain"
                priority
              />
            </Link>

            <div className="max-w-md">

              <p className="mb-5 text-sm font-medium uppercase tracking-[0.18em] text-white/50">
                Fiscalidade Digital
              </p>

              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
                A sua gestão fiscal,
                <br />
                num só lugar.
              </h1>

              <p className="mt-6 max-w-sm text-base leading-7 text-white/65">
                Organize as obrigações fiscais
                e acompanhe a gestão da sua
                empresa com simplicidade.
              </p>

              <div className="mt-10 h-px w-20 bg-white/30" />

              <p className="mt-5 text-sm text-white/50">
                Uma solução digital para empresas
                e profissionais em Angola.
              </p>

            </div>

            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Fiscalidade Digital.
              Todos os direitos reservados.
            </p>

          </div>

        </section>

        {/* ÁREA DE LOGIN */}

        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">

          <div className="w-full max-w-[420px]">

            {/* LOGO MOBILE */}

            <div className="mb-12 flex justify-center lg:hidden">

              <Link href="/">
                <Image
                  src="/logofiscalidade.png"
                  alt="Fiscalidade Digital"
                  width={230}
                  height={70}
                  className="h-auto w-auto max-w-[230px] object-contain"
                  priority
                />
              </Link>

            </div>

            {/* CABEÇALHO */}

            <div className="mb-9">

              <p className="mb-3 text-sm font-medium text-[#5940d7]">
                Área reservada
              </p>

              <h2 className="text-3xl font-semibold tracking-tight text-[#202338] sm:text-[34px]">
                Bem-vindo de volta
              </h2>

              <p className="mt-3 text-[15px] leading-6 text-[#85899c]">
                Entre na sua conta para continuar.
              </p>

            </div>

            {/* ERRO */}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600"
              >
                {error}
              </div>
            )}

            {/* FORMULÁRIO */}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#34384e]"
                >
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    strokeWidth={1.7}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9b9fb2]"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);

                      if (error) setError('');
                    }}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    disabled={loading}
                    className="h-14 w-full rounded-xl border border-[#e4e5ed] bg-white pl-11 pr-4 text-sm text-[#202338] outline-none transition placeholder:text-[#b5b8c6] focus:border-[#5940d7] focus:ring-4 focus:ring-[#5940d7]/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              {/* PALAVRA-PASSE */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#34384e]"
                  >
                    Palavra-passe
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        'A recuperação de palavra-passe será disponibilizada em breve.',
                      )
                    }
                    className="text-xs font-medium text-[#5940d7] transition hover:text-[#411260]"
                  >
                    Esqueceu-se?
                  </button>

                </div>

                <div className="relative">

                  <Lock
                    size={18}
                    strokeWidth={1.7}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9b9fb2]"
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);

                      if (error) setError('');
                    }}
                    placeholder="Introduza a sua palavra-passe"
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-14 w-full rounded-xl border border-[#e4e5ed] bg-white pl-11 pr-12 text-sm text-[#202338] outline-none transition placeholder:text-[#b5b8c6] focus:border-[#5940d7] focus:ring-4 focus:ring-[#5940d7]/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? 'Ocultar palavra-passe'
                        : 'Mostrar palavra-passe'
                    }
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9b9fb2] transition hover:text-[#5940d7] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff size={18} strokeWidth={1.7} />
                    ) : (
                      <Eye size={18} strokeWidth={1.7} />
                    )}
                  </button>

                </div>

              </div>

              {/* BOTÃO */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center rounded-xl bg-[#5940d7] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(89,64,215,0.16)] transition hover:bg-[#4b34c2] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    A entrar...
                  </span>
                ) : (
                  'Entrar na minha conta'
                )}

              </button>

            </form>

            {/* REGISTO */}

            <div className="mt-9 text-center">

              <p className="text-sm text-[#85899c]">
                Ainda não tem uma conta?
              </p>

              <Link
                href="/register"
                className="mt-2 inline-block text-sm font-semibold text-[#5940d7] transition hover:text-[#411260]"
              >
                Criar conta empresarial
              </Link>

            </div>

            {/* RODAPÉ */}

            <div className="mt-12 text-center">

              <Link
                href="/"
                className="text-xs text-[#a3a6b6] transition hover:text-[#5940d7]"
              >
                Voltar ao início
              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}