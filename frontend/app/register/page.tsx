'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

import { register } from '@/services/auth';
import { saveToken } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [companyName, setCompanyName] =
    useState('');

  const [ownerName, setOwnerName] =
    useState('');

  const [nif, setNif] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [sector, setSector] =
    useState('');

  const [companyType, setCompanyType] =
    useState('SERVICOS');

  const [employees, setEmployees] =
    useState('');

  const [regime, setRegime] =
    useState('GERAL');

  const [password, setPassword] =
    useState('');

  async function handleRegister(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const data =
        await register({
          companyName,
          ownerName,
          nif,
          email,
          phone,
          address,
          sector,
          companyType,
          employees:
            Number(employees),
          regime,
          password,
        });

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
          'Erro ao criar empresa',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* BACKGROUND */}

      <div className="absolute inset-0">

        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[180px]" />

        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[180px]" />

      </div>

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize:
            '50px 50px',
        }}
      />

      <div className="relative min-h-screen flex">

        {/* LEFT */}

        <div className="hidden xl:flex flex-1 items-center justify-center px-20">

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

            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-300 mb-8">

              <Sparkles size={18} />

              Criação Empresarial Digital

            </div>

            <h2 className="text-6xl font-black text-white leading-tight">

              Comece a
              <span className="block text-blue-500">
                Transformação
              </span>

              Fiscal

            </h2>

            <p className="text-slate-300 text-xl mt-8">

              Crie a sua empresa,
              automatize processos
              fiscais e tenha total
              controlo financeiro.

            </p>

            <div className="grid grid-cols-2 gap-6 mt-12">

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">

                <ShieldCheck
                  className="text-green-400 mb-4"
                  size={30}
                />

                <div className="text-3xl font-black text-white">
                  100%
                </div>

                <div className="text-slate-400">
                  Seguro
                </div>

              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">

                <BarChart3
                  className="text-blue-400 mb-4"
                  size={30}
                />

                <div className="text-3xl font-black text-white">
                  SaaS
                </div>

                <div className="text-slate-400">
                  Empresarial
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* FORM */}

        <div className="w-full xl:w-[760px] flex items-center justify-center p-8">

          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8">

            <div className="mb-8">
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
                Registrar Empresa
              </h2>

              <p className="text-slate-300 mt-2">
                Etapa {step} de 3
              </p>

              <div className="w-full h-3 bg-white/10 rounded-full mt-5 overflow-hidden">

                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width:
                      step === 1
                        ? '33%'
                        : step === 2
                        ? '66%'
                        : '100%',
                  }}
                />

              </div>

            </div>

            <form
              onSubmit={
                handleRegister
              }
            >

              {/* STEP 1 */}

              {step === 1 && (
                <div className="space-y-4">

                  <Input
                    icon={
                      Building2
                    }
                    placeholder="Nome da Empresa"
                    value={
                      companyName
                    }
                    setValue={
                      setCompanyName
                    }
                  />

                  <Input
                    icon={User}
                    placeholder="Proprietário"
                    value={
                      ownerName
                    }
                    setValue={
                      setOwnerName
                    }
                  />

                  <Input
                    icon={Mail}
                    placeholder="Email"
                    value={email}
                    setValue={
                      setEmail
                    }
                  />

                  <Input
                    icon={Phone}
                    placeholder="Telefone"
                    value={phone}
                    setValue={
                      setPhone
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setStep(2)
                    }
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold"
                  >
                    Continuar
                  </button>

                </div>
              )}

              {/* STEP 2 */}

              {step === 2 && (
                <div className="space-y-4">

                  <Input
                    icon={
                      MapPin
                    }
                    placeholder="Endereço"
                    value={
                      address
                    }
                    setValue={
                      setAddress
                    }
                  />

                  <Input
                    icon={
                      Briefcase
                    }
                    placeholder="Sector"
                    value={
                      sector
                    }
                    setValue={
                      setSector
                    }
                  />

                  <Input
                    icon={
                      Building2
                    }
                    placeholder="NIF"
                    value={nif}
                    setValue={
                      setNif
                    }
                  />

                  <Input
                    icon={Users}
                    placeholder="Funcionários"
                    value={
                      employees
                    }
                    setValue={
                      setEmployees
                    }
                    type="number"
                  />

                  <div className="grid grid-cols-2 gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        setStep(1)
                      }
                      className="bg-white/10 text-white rounded-2xl py-4 font-bold flex justify-center items-center gap-2"
                    >
                      <ArrowLeft size={18} />
                      Voltar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setStep(3)
                      }
                      className="bg-blue-600 text-white rounded-2xl py-4 font-bold"
                    >
                      Continuar
                    </button>

                  </div>

                </div>
              )}

              {/* STEP 3 */}

              {step === 3 && (
                <div className="space-y-4">

                  <select
                    value={
                      companyType
                    }
                    onChange={(e) =>
                      setCompanyType(
                        e.target
                          .value,
                      )
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white"
                  >
                    <option>
                      SERVICOS
                    </option>
                    <option>
                      COMERCIO
                    </option>
                    <option>
                      INDUSTRIA
                    </option>
                    <option>
                      CONSTRUCAO
                    </option>
                  </select>

                  <select
                    value={regime}
                    onChange={(e) =>
                      setRegime(
                        e.target
                          .value,
                      )
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white"
                  >
                    <option>
                      GERAL
                    </option>
                    <option>
                      SIMPLIFICADO
                    </option>
                  </select>

                  <Input
                    icon={Lock}
                    placeholder="Password"
                    value={
                      password
                    }
                    setValue={
                      setPassword
                    }
                    type="password"
                  />

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">

                    <div className="flex items-center gap-3 text-blue-300">

                      <CheckCircle2
                        size={20}
                      />

                      Empresa pronta para criação

                    </div>

                  </div>

                  {error && (
                    <div className="text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        setStep(2)
                      }
                      className="bg-white/10 text-white rounded-2xl py-4 font-bold"
                    >
                      Voltar
                    </button>

                    <button
                      type="submit"
                      disabled={
                        loading
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 font-bold flex justify-center items-center gap-2"
                    >
                      {loading
                        ? 'Criando...'
                        : 'Criar Empresa'}

                      <ArrowRight
                        size={18}
                      />
                    </button>

                  </div>

                </div>
              )}

            </form>

            <div className="mt-8 text-center">

              <p className="text-slate-400">
                Já possui conta?
              </p>

              <Link
                href="/login"
                className="text-blue-400 font-semibold"
              >
                Iniciar Sessão
              </Link>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

function Input({
  icon: Icon,
  placeholder,
  value,
  setValue,
  type = 'text',
}: any) {
  return (
    <div className="relative">

      <Icon
        size={20}
        className="absolute left-4 top-4 text-slate-400"
      />

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          setValue(
            e.target.value,
          )
        }
        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-blue-500"
      />

    </div>
  );
}