'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { login } from '@/services/auth';
import { saveToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

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

  async function handleLogin(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const data = await login(
        email,
        password,
      );

      saveToken(
        data.access_token,
      );

      router.push(
        '/dashboard',
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data
          ?.message ||
          'Credenciais inválidas',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* BACKGROUND */}

      <div className="absolute inset-0">

        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] rounded-full bg-blue-600/20 blur-[180px]" />

        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] rounded-full bg-cyan-500/10 blur-[180px]" />

      </div>

      {/* GRID */}

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize:
            '50px 50px',
        }}
      />

      {/* PARTICULAS */}

      <div className="absolute top-20 left-20 w-3 h-3 rounded-full bg-blue-500 animate-pulse" />

      <div className="absolute top-40 right-40 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />

      <div className="absolute bottom-40 left-1/3 w-2 h-2 rounded-full bg-white animate-pulse" />

      <div className="relative min-h-screen flex">

        {/* LADO ESQUERDO */}

        <div className="hidden lg:flex flex-1 flex-col justify-center px-20">

          <div className="max-w-xl">

            <div className="flex items-center gap-4 mb-10">

              <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center">

                <Building2
                  className="text-white"
                  size={34}
                />

              </div>

              <div>

                <h1 className="text-white text-3xl font-black">
                  Fiscalidade Digital
                </h1>

                <p className="text-slate-400">
                  Plataforma Fiscal Inteligente
                </p>

              </div>

            </div>

            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 text-blue-300 mb-8">

              <Sparkles size={18} />

              Gestão Fiscal Moderna

            </div>

            <h2 className="text-6xl font-black text-white leading-tight">

              Bem-vindo
              <span className="block text-blue-500">
                de Volta
              </span>

            </h2>

            <p className="text-slate-300 text-xl mt-8 leading-relaxed">

              Acompanhe impostos,
              facturação, obrigações
              fiscais e indicadores
              financeiros em tempo real.

            </p>

            <div className="grid grid-cols-2 gap-6 mt-12">

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">

                <ShieldCheck
                  className="text-green-400 mb-4"
                  size={30}
                />

                <div className="text-3xl font-black text-white">
                  98%
                </div>

                <div className="text-slate-400">
                  Conformidade Fiscal
                </div>

              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">

                <TrendingUp
                  className="text-blue-400 mb-4"
                  size={30}
                />

                <div className="text-3xl font-black text-white">
                  500+
                </div>

                <div className="text-slate-400">
                  Empresas
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* LOGIN */}

        <div className="flex items-center justify-center w-full lg:w-[600px] p-8">

          <div className="w-full max-w-md">

            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_40px_120px_rgba(0,0,0,.35)]">

              <div className="text-center mb-8">
<Link
  href="/"
  className="
    inline-flex
    items-center
    gap-2
    text-slate-300
    hover:text-white
    mb-6
  "
>
  ← Voltar ao Início
</Link>
                <h2 className="text-4xl font-black text-white">
                  Iniciar Sessão
                </h2>

                <p className="text-slate-300 mt-3">
                  Entre na sua conta empresarial
                </p>

              </div>

              <form
                onSubmit={
                  handleLogin
                }
                className="space-y-5"
              >

                <div>

                  <label className="block text-slate-300 mb-2">
                    Email
                  </label>

                  <div className="relative">

                    <Mail
                      size={20}
                      className="absolute left-4 top-4 text-slate-400"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value,
                        )
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-blue-500"
                      placeholder="empresa@email.com"
                      required
                    />

                  </div>

                </div>

                <div>

                  <label className="block text-slate-300 mb-2">
                    Palavra-passe
                  </label>

                  <div className="relative">

                    <Lock
                      size={20}
                      className="absolute left-4 top-4 text-slate-400"
                    />

                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={
                        password
                      }
                      onChange={(e) =>
                        setPassword(
                          e.target.value,
                        )
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-14 py-4 text-white outline-none focus:border-blue-500"
                      placeholder="********"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword,
                        )
                      }
                      className="absolute right-4 top-4 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff
                          size={20}
                        />
                      ) : (
                        <Eye
                          size={20}
                        />
                      )}
                    </button>

                  </div>

                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-2xl py-4 font-bold text-white transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/30"
                >
                  {loading
                    ? 'A entrar...'
                    : 'Entrar'}
                </button>

              </form>

              <div className="mt-8 text-center">

                <p className="text-slate-400">

                  Ainda não possui conta?

                </p>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-blue-400 font-semibold mt-3 hover:text-blue-300"
                >
                  Registrar Empresa
                  <ArrowRight
                    size={18}
                  />
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}