'use client';

import {
  FormEvent,
  useState,
} from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();

  const { login } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [sessionNotice] = useState(() =>
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('reason') === 'session-expired'
      ? 'A sua sessão terminou por segurança. Inicie sessão novamente para continuar.'
      : '',
  );

  /* ==========================================================
     LOGIN
  ========================================================== */

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    const normalizedEmail =
      email.trim().toLowerCase();

    /* ========================================================
       VALIDAR EMAIL
    ======================================================== */

    if (!normalizedEmail) {
      setError(
        'Introduza o seu email.',
      );

      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      )
    ) {
      setError(
        'Introduza um email válido.',
      );

      return;
    }

    /* ========================================================
       VALIDAR PASSWORD
    ======================================================== */

    if (!password) {
      setError(
        'Introduza a sua palavra-passe.',
      );

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
      /*
       * IMPORTANTE:
       *
       * Agora o login passa pelo AuthContext.
       *
       * Não usar:
       *
       * login() de services/auth
       *
       * nem:
       *
       * saveToken()
       *
       * nesta página.
       */

      await login(
        normalizedEmail,
        password,
      );

      /*
       * Recuperar redirect da URL.
       *
       * Exemplo:
       *
       * /login?redirect=/dashboard
       */

      let redirect =
        '/dashboard';

      if (
        typeof window !==
        'undefined'
      ) {
        const params =
          new URLSearchParams(
            window.location.search,
          );

        const requestedRedirect =
          params.get(
            'redirect',
          );

        /*
         * Só aceitar redirects internos.
         */

        if (
          requestedRedirect &&
          requestedRedirect.startsWith(
            '/',
          ) &&
          !requestedRedirect.startsWith(
            '//',
          )
        ) {
          redirect =
            requestedRedirect;
        }
      }

      /*
       * O AuthContext já atualizou:
       *
       * token
       * user
       * tenant
       * isAuthenticated
       *
       * Agora podemos navegar.
       */

      router.replace(
        redirect,
      );
    } catch (err: unknown) {
      console.error(
        'Erro ao iniciar sessão:',
        err,
      );

      let message =
        'Não foi possível iniciar sessão.';

      /*
       * Erro vindo do Axios/API.
       */

      if (
        err &&
        typeof err === 'object' &&
        'response' in err
      ) {
        const response =
          (
            err as {
              response?: {
                data?: {
                  message?:
                    | string
                    | string[];
                };
              };
            }
          ).response;

        const apiMessage =
          response?.data?.message;

        if (
          Array.isArray(
            apiMessage,
          )
        ) {
          message =
            apiMessage.join(
              ' ',
            );
        } else if (
          typeof apiMessage ===
          'string'
        ) {
          message =
            apiMessage;
        }
      }

      /*
       * Erro JavaScript normal.
       */

      else if (
        err instanceof Error &&
        err.message
      ) {
        message =
          err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================================
     INTERFACE
  ========================================================== */

  return (
    <main className="fd-auth-page fd-theme-scope min-h-screen bg-[#f3f5f7] text-[#172642]">

      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* ====================================================
            PAINEL INSTITUCIONAL
        ===================================================== */}

        <section className="hidden border-r border-[#173e57] bg-[#102f44] lg:flex lg:w-[42%] xl:w-[44%]">

          <div className="flex w-full flex-col justify-between p-12 xl:p-16">

            {/* LOGO */}

            <Link
              href="/"
              className="inline-flex w-fit rounded-md bg-white px-3 py-2"
            >
              <Image
                src="/logofiscalidade.png"
                alt="Fiscalidade Digital"
                width={230}
                height={70}
                className="h-auto w-auto max-w-[230px] object-contain"
                priority
              />
            </Link>

            {/* TEXTO */}

            <div className="max-w-md">

              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#9fc4d3]">
                Área empresarial
              </p>

              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white xl:text-[44px]">
                Gestão fiscal e operacional
                <br />
                da sua empresa.
              </h1>

              <p className="mt-6 max-w-sm text-base leading-7 text-[#c5d8e0]">
                Aceda às obrigações, facturação,
                salários e documentos associados
                à sua empresa.
              </p>

              <div className="mt-10 h-px w-16 bg-[#6b9aab]" />

              <p className="mt-5 max-w-sm text-sm leading-6 text-[#9fc4d3]">
                Utilize apenas as credenciais da sua conta empresarial.
              </p>

            </div>

            {/* RODAPÉ */}

            <p className="text-xs text-[#83a9b8]">
              ©{' '}
              {new Date().getFullYear()}{' '}
              Fiscalidade Digital.
              Todos os direitos reservados.
            </p>

          </div>

        </section>

        {/* ====================================================
            ÁREA DE LOGIN
        ===================================================== */}

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

              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#0b6f93]">
                Área reservada
              </p>

              <h2 className="text-3xl font-semibold tracking-tight text-[#172642] sm:text-[34px]">
                A sua gestão fiscal continua aqui.
              </h2>

              <p className="mt-3 text-[15px] leading-6 text-[#66758d]">
                Acompanhe obrigações, prazos, facturação e informação fiscal da sua empresa num único espaço.
              </p>

            </div>

            {/* ERRO */}

            {sessionNotice && (
              <div role="status" className="mb-6 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-5 text-sky-900">
                {sessionNotice}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
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
                      setEmail(
                        event.target.value,
                      );

                      if (error) {
                        setError('');
                      }
                    }}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    disabled={loading}
                    className="h-12 w-full rounded-md border border-[#d9e0e7] bg-white pl-11 pr-4 text-sm text-[#172642] outline-none transition placeholder:text-[#9aa6b5] focus:border-[#0b6f93] focus:ring-2 focus:ring-[#0b6f93]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#34384e]"
                  >
                    Palavra-passe
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#0b6f93] transition hover:text-[#085b79]"
                  >
                    Esqueceu a palavra-passe?
                  </Link>

                </div>

                <div className="relative">

                  <Lock
                    size={18}
                    strokeWidth={1.7}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9b9fb2]"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value,
                      );

                      if (error) {
                        setError('');
                      }
                    }}
                    placeholder="Introduza a sua palavra-passe"
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-12 w-full rounded-md border border-[#d9e0e7] bg-white pl-11 pr-12 text-sm text-[#172642] outline-none transition placeholder:text-[#9aa6b5] focus:border-[#0b6f93] focus:ring-2 focus:ring-[#0b6f93]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? 'Ocultar palavra-passe'
                        : 'Mostrar palavra-passe'
                    }
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current,
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8794a5] transition hover:text-[#0b6f93] disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                        strokeWidth={1.7}
                      />
                    ) : (
                      <Eye
                        size={18}
                        strokeWidth={1.7}
                      />
                    )}
                  </button>

                </div>

              </div>

              {/* BOTÃO */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-md bg-[#0b6f93] text-sm font-semibold text-white transition-colors hover:bg-[#085b79] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <span className="flex items-center gap-3">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    A entrar...

                  </span>
                ) : (
                  'Entrar'
                )}

              </button>

            </form>

            {/* REGISTO */}

            <div className="mt-9 text-center">

              <p className="text-sm text-[#66758d]">
                Ainda não tem uma conta?
              </p>

              <Link
                href="/register"
                className="mt-2 inline-block text-sm font-semibold text-[#0b6f93] transition hover:text-[#085b79]"
              >
                Criar conta
              </Link>

            </div>

            {/* RODAPÉ */}

            <div className="mt-12 text-center">

              <Link
                href="/"
                className="text-xs text-[#7c899a] transition hover:text-[#0b6f93]"
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
