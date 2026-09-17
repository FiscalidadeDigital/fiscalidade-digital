'use client';

import {
  FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';

import Link from 'next/link';

import {
  register,
} from '@/services/auth';

import type {
  FiscalRegime,
} from '@/services/auth';

import {
  saveToken,
} from '@/lib/auth';

type Step = 1 | 2 | 3;

interface FormData {
  companyName: string;
  ownerName: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  sector: string;
  companyType: string;
  employees: string;
  regime: FiscalRegime | '';
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  confirmInformation: boolean;
}

const initialForm: FormData = {
  companyName: '',
  ownerName: '',
  nif: '',
  email: '',
  phone: '',
  address: '',
  sector: '',
  companyType: '',
  employees: '0',
  regime: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptPrivacyPolicy: false,
  confirmInformation: false,
};

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] =
    useState<FormData>(initialForm);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  function updateField<K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  const passwordStrength = useMemo(() => {
    const password = form.password;

    if (!password) {
      return {
        label: '',
        value: 0,
      };
    }

    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) {
      return {
        label: 'Fraca',
        value: score,
      };
    }

    if (score <= 3) {
      return {
        label: 'Média',
        value: score,
      };
    }

    return {
      label: 'Forte',
      value: score,
    };
  }, [form.password]);

  function validateStepOne(): boolean {
    if (!form.ownerName.trim()) {
      setError('Introduza o nome do responsável.');
      return false;
    }

    if (!form.email.trim()) {
      setError('Introduza o email.');
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setError('Introduza um email válido.');
      return false;
    }

    if (!form.password) {
      setError('Introduza uma palavra-passe.');
      return false;
    }

    if (form.password.length < 6) {
      setError(
        'A palavra-passe deve ter pelo menos 6 caracteres.',
      );
      return false;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError('As palavras-passe não coincidem.');
      return false;
    }

    return true;
  }

  function validateStepTwo(): boolean {
    if (!form.companyName.trim()) {
      setError('Introduza o nome da empresa.');
      return false;
    }

    if (!form.nif.trim()) {
      setError('Introduza o NIF da empresa.');
      return false;
    }

    const employees = Number(form.employees);

    if (
      !Number.isInteger(employees) ||
      employees < 0
    ) {
      setError(
        'O número de funcionários é inválido.',
      );
      return false;
    }

    return true;
  }

  function validateStepThree(): boolean {
    if (!form.regime) {
      setError('Selecione o regime fiscal da empresa.');
      return false;
    }

    if (!form.companyType) {
      setError('Seleccione o tipo de empresa.');
      return false;
    }

    if (!form.acceptTerms) {
      setError('Deve aceitar os Termos de Utilização.');
      return false;
    }

    if (!form.acceptPrivacyPolicy) {
      setError('Deve aceitar a Política de Privacidade.');
      return false;
    }

    if (!form.confirmInformation) {
      setError('Deve confirmar que as informações são verdadeiras.');
      return false;
    }

    return true;
  }

  function nextStep() {
    setError('');

    if (step === 1) {
      if (!validateStepOne()) return;

      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validateStepTwo()) return;

      setStep(3);
    }
  }

  function previousStep() {
    setError('');

    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!validateStepThree()) return;

    setLoading(true);

    try {
      const response = await register({
        companyName: form.companyName.trim(),

        ownerName: form.ownerName.trim(),

        nif: form.nif.trim().toUpperCase(),

        email: form.email.trim().toLowerCase(),

        phone: form.phone.trim() || undefined,

        address: form.address.trim() || undefined,

        sector: form.sector.trim() || undefined,

        companyType:
          form.companyType.trim() || undefined,

        employees: Number(form.employees || 0),

        regime: form.regime as FiscalRegime,

        password: form.password,

        acceptTerms: form.acceptTerms,
        acceptPrivacyPolicy: form.acceptPrivacyPolicy,
        confirmInformation: form.confirmInformation,
      });

      if (!response?.access_token) {
        throw new Error(
          'A conta foi criada, mas o servidor não devolveu o token de autenticação.',
        );
      }

      saveToken(response.access_token);

      if (typeof window !== 'undefined') {
        if (response.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(response.user),
          );
        }

        if (response.tenant) {
          localStorage.setItem(
            'tenant',
            JSON.stringify(response.tenant),
          );

          if (response.tenant.id) {
            localStorage.setItem(
              'tenantId',
              String(response.tenant.id),
            );
          }
        }
      }

      setSuccess(
        'Empresa criada com sucesso. A preparar o seu ambiente fiscal...',
      );

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 700);
    } catch (err: unknown) {
      console.error(
        'Erro ao criar conta:',
        err,
      );

      let message =
        'Não foi possível criar a conta.';

      if (
        err &&
        typeof err === 'object' &&
        'response' in err
      ) {
        const apiResponse = (
          err as {
            response?: {
              data?: {
                message?: string | string[];
              };
            };
          }
        ).response;

        const apiMessage =
          apiResponse?.data?.message;

        if (Array.isArray(apiMessage)) {
          message = apiMessage.join(' ');
        } else if (
          typeof apiMessage === 'string'
        ) {
          message = apiMessage;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function getStepTitle() {
    if (step === 1) return 'Criar acesso';
    if (step === 2) return 'Dados da empresa';

    return 'Enquadramento fiscal';
  }

  function getStepDescription() {
    if (step === 1) {
      return 'Crie o acesso principal da sua conta.';
    }

    if (step === 2) {
      return 'Informe os dados básicos da empresa.';
    }

    return 'Defina o enquadramento fiscal inicial.';
  }

  const inputClass =
    'h-12 w-full rounded-xl border border-[#e5e0ef] bg-white px-4 text-sm text-[#292342] outline-none transition placeholder:text-[#aaa3bd] focus:border-[#5940d7] focus:ring-4 focus:ring-[#5940d7]/10';

  const inputWithIconClass =
    'h-12 w-full rounded-xl border border-[#e5e0ef] bg-white pl-11 pr-4 text-sm text-[#292342] outline-none transition placeholder:text-[#aaa3bd] focus:border-[#5940d7] focus:ring-4 focus:ring-[#5940d7]/10';

  return (
    <main className="min-h-screen bg-[#f8f7fc] text-[#292342]">
      <div className="min-h-screen lg:grid lg:grid-cols-[380px_1fr]">

        {/* PAINEL LATERAL */}

        <aside className="relative hidden overflow-hidden bg-[#292342] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#5940d7]/30 blur-3xl" />

          <div className="relative z-10">

            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <img
                src="/logofiscalidade.png"
                alt="Fiscalidade Digital"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <div className="mt-24 max-w-xs">

              <span className="text-sm font-medium text-[#c9bfff]">
                Fiscalidade Digital
              </span>

              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Comece a organizar a sua empresa.
              </h1>

              <p className="mt-5 text-sm leading-7 text-[#c8c3d8]">
                Crie a sua conta e tenha num único
                ambiente as informações fiscais,
                financeiras e administrativas da sua empresa.
              </p>

              <div className="mt-10 space-y-5">

                {[
                  'Dados fiscais organizados',
                  'Gestão empresarial centralizada',
                  'Acesso simples e seguro',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-[#e5e1f0]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5940d7]">
                      <Check size={14} />
                    </span>

                    {item}
                  </div>
                ))}

              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#aaa3bd]">
            © {new Date().getFullYear()} Fiscalidade Digital
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">

          <div className="w-full max-w-2xl">

            {/* LOGO MOBILE */}

            <div className="mb-8 flex items-center justify-between lg:hidden">

              <Link href="/">
                <img
                  src="/logofiscalidade.png"
                  alt="Fiscalidade Digital"
                  className="h-12 w-auto object-contain"
                />
              </Link>

              <Link
                href="/login"
                className="text-sm font-medium text-[#5940d7]"
              >
                Iniciar sessão
              </Link>

            </div>

            {/* CABEÇALHO */}

            <div className="mb-8">

              <div className="mb-3 text-sm font-semibold text-[#5940d7]">
                Passo {step} de 3
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#292342] sm:text-4xl">
                {getStepTitle()}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#817a96]">
                {getStepDescription()}
              </p>

            </div>

            {/* PROGRESSO */}

            <div className="mb-8">

              <div className="mb-3 flex items-center justify-between text-xs text-[#817a96]">
                <span>Configuração da conta</span>

                <span>
                  {Math.round((step / 3) * 100)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#e6e1ef]">
                <div
                  className="h-full rounded-full bg-[#5940d7] transition-all duration-300"
                  style={{
                    width: `${(step / 3) * 100}%`,
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">

                {[
                  'Acesso',
                  'Empresa',
                  'Fiscal',
                ].map((label, index) => {
                  const current = index + 1;
                  const active = current <= step;

                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-2 text-xs ${
                        active
                          ? 'text-[#5940d7]'
                          : 'text-[#aaa3bd]'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? 'border-[#5940d7] bg-[#5940d7]/10'
                            : 'border-[#e5e0ef]'
                        }`}
                      >
                        {current < step ? (
                          <Check size={13} />
                        ) : (
                          current
                        )}
                      </span>

                      {label}
                    </div>
                  );
                })}

              </div>
            </div>

            {/* MENSAGEM DE ERRO */}

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* MENSAGEM DE SUCESSO */}

            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                <Check
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{success}</span>
              </div>
            )}

            {/* FORMULÁRIO */}

            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-[#e8e3f0] bg-white p-5 shadow-[0_15px_50px_rgba(45,32,80,0.06)] sm:p-8"
            >

              {/* ETAPA 1 */}

              {step === 1 && (
                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Nome do responsável
                    </label>

                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa3bd]"
                      />

                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={(event) =>
                          updateField(
                            'ownerName',
                            event.target.value,
                          )
                        }
                        placeholder="Nome completo"
                        className={inputWithIconClass}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Email
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa3bd]"
                      />

                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          updateField(
                            'email',
                            event.target.value,
                          )
                        }
                        placeholder="nome@empresa.com"
                        className={inputWithIconClass}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Telefone
                    </label>

                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa3bd]"
                      />

                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          updateField(
                            'phone',
                            event.target.value,
                          )
                        }
                        placeholder="+244 9XX XXX XXX"
                        className={inputWithIconClass}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Palavra-passe
                    </label>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa3bd]"
                      />

                      <input
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={form.password}
                        onChange={(event) =>
                          updateField(
                            'password',
                            event.target.value,
                          )
                        }
                        placeholder="Mínimo de 6 caracteres"
                        className="h-12 w-full rounded-xl border border-[#e5e0ef] bg-white pl-11 pr-12 text-sm text-[#292342] outline-none transition placeholder:text-[#aaa3bd] focus:border-[#5940d7] focus:ring-4 focus:ring-[#5940d7]/10"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#817a96]"
                        aria-label={
                          showPassword
                            ? 'Ocultar palavra-passe'
                            : 'Mostrar palavra-passe'
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {form.password && (
                      <div className="mt-3">

                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(
                            (number) => (
                              <div
                                key={number}
                                className={`h-1.5 flex-1 rounded-full ${
                                  number <=
                                  passwordStrength.value
                                    ? 'bg-[#5940d7]'
                                    : 'bg-[#e8e3f0]'
                                }`}
                              />
                            ),
                          )}
                        </div>

                        <p className="mt-2 text-xs text-[#817a96]">
                          Força da palavra-passe:{' '}
                          <span className="font-semibold text-[#5940d7]">
                            {passwordStrength.label}
                          </span>
                        </p>

                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Confirmar palavra-passe
                    </label>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa3bd]"
                      />

                      <input
                        type={
                          showConfirmPassword
                            ? 'text'
                            : 'password'
                        }
                        value={form.confirmPassword}
                        onChange={(event) =>
                          updateField(
                            'confirmPassword',
                            event.target.value,
                          )
                        }
                        placeholder="Repita a palavra-passe"
                        className="h-12 w-full rounded-xl border border-[#e5e0ef] bg-white pl-11 pr-12 text-sm text-[#292342] outline-none transition placeholder:text-[#aaa3bd] focus:border-[#5940d7] focus:ring-4 focus:ring-[#5940d7]/10"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) => !current,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#817a96]"
                        aria-label={
                          showConfirmPassword
                            ? 'Ocultar confirmação'
                            : 'Mostrar confirmação'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* ETAPA 2 */}

              {step === 2 && (
                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Nome da empresa
                    </label>

                    <div className="relative">
                      <Building2
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#aaa3bd]"
                      />

                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(event) =>
                          updateField(
                            'companyName',
                            event.target.value,
                          )
                        }
                        placeholder="Nome comercial da empresa"
                        className={inputWithIconClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      NIF da empresa
                    </label>

                    <input
                      type="text"
                      value={form.nif}
                      onChange={(event) =>
                        updateField(
                          'nif',
                          event.target.value,
                        )
                      }
                      placeholder="Número de identificação fiscal"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                        Sector de actividade
                      </label>

                      <input
                        type="text"
                        value={form.sector}
                        onChange={(event) =>
                          updateField(
                            'sector',
                            event.target.value,
                          )
                        }
                        placeholder="Ex.: Comércio"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                        Tipo de empresa
                      </label>

                      <select
                        value={form.companyType}
                        onChange={(event) =>
                          updateField(
                            'companyType',
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">
                          Selecionar tipo
                        </option>

                        <option value="COMERCIANTE_NOME_INDIVIDUAL">
                          Comerciante em Nome Individual
                        </option>

                        <option value="SOCIEDADE_UNIPESSOAL_QUOTAS">
                          Sociedade Unipessoal por Quotas
                        </option>

                        <option value="SOCIEDADE_POR_QUOTAS">
                          Sociedade por Quotas
                        </option>

                        <option value="SOCIEDADE_ANONIMA">
                          Sociedade Anónima
                        </option>

                        <option value="SOCIEDADE_EM_NOME_COLETIVO">
                          Sociedade em Nome Colectivo
                        </option>

                        <option value="SOCIEDADE_EM_COMANDITA">
                          Sociedade em Comandita
                        </option>

                        <option value="COOPERATIVA">
                          Cooperativa
                        </option>

                        <option value="SUCURSAL">
                          Sucursal
                        </option>

                        <option value="ESCRITORIO_REPRESENTACAO">
                          Escritório de Representação
                        </option>

                        <option value="OUTRO">
                          Outro
                        </option>
                      </select>
                    </div>

                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Número de funcionários
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.employees}
                      onChange={(event) =>
                        updateField(
                          'employees',
                          event.target.value,
                        )
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4d4764]">
                      Morada da empresa
                    </label>

                    <div className="relative">
                      <MapPin
                        size={18}
                        className="absolute left-4 top-4 text-[#aaa3bd]"
                      />

                      <textarea
                        value={form.address}
                        onChange={(event) =>
                          updateField(
                            'address',
                            event.target.value,
                          )
                        }
                        placeholder="Endereço da empresa"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-[#e5e0ef] bg-white py-3 pl-11 pr-4 text-sm text-[#292342] outline-none transition placeholder:text-[#aaa3bd] focus:border-[#5940d7] focus:ring-4 focus:ring-[#5940d7]/10"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* ETAPA 3 */}

              {step === 3 && (
                <div className="space-y-6">

                  <div>
                    <h3 className="text-lg font-semibold text-[#292342]">
                      Seleccione o regime fiscal
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#817a96]">
                      Escolha o enquadramento fiscal inicial
                      da sua empresa.
                    </p>
                  </div>

                  <div className="space-y-3">

                    <label
                      className={`block cursor-pointer rounded-2xl border p-5 transition ${
                        form.regime === 'GERAL'
                          ? 'border-[#5940d7] bg-[#5940d7]/5'
                          : 'border-[#e5e0ef] bg-[#faf9fd] hover:border-[#c9c0dd]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="regime"
                        value="GERAL"
                        checked={form.regime === 'GERAL'}
                        onChange={() =>
                          updateField(
                            'regime',
                            'GERAL' as FiscalRegime,
                          )
                        }
                        className="sr-only"
                      />

                      <div className="flex items-start gap-4">

                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            form.regime === 'GERAL'
                              ? 'border-[#5940d7] bg-[#5940d7]'
                              : 'border-[#cfc9dd]'
                          }`}
                        >
                          {form.regime === 'GERAL' && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </span>

                        <div>
                          <h4 className="font-semibold text-[#292342]">
                            Regime Geral
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-[#817a96]">
                            Enquadramento fiscal geral
                            para empresas elegíveis.
                          </p>
                        </div>

                      </div>
                    </label>

                    <label
                      className={`block cursor-pointer rounded-2xl border p-5 transition ${
                        form.regime === 'SIMPLIFICADO'
                          ? 'border-[#5940d7] bg-[#5940d7]/5'
                          : 'border-[#e5e0ef] bg-[#faf9fd] hover:border-[#c9c0dd]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="regime"
                        value="SIMPLIFICADO"
                        checked={
                          form.regime === 'SIMPLIFICADO'
                        }
                        onChange={() =>
                          updateField(
                            'regime',
                            'SIMPLIFICADO' as FiscalRegime,
                          )
                        }
                        className="sr-only"
                      />

                      <div className="flex items-start gap-4">

                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            form.regime === 'SIMPLIFICADO'
                              ? 'border-[#5940d7] bg-[#5940d7]'
                              : 'border-[#cfc9dd]'
                          }`}
                        >
                          {form.regime === 'SIMPLIFICADO' && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </span>

                        <div>
                          <h4 className="font-semibold text-[#292342]">
                            Regime Simplificado
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-[#817a96]">
                            Enquadramento simplificado
                            para actividades elegíveis.
                          </p>
                        </div>

                      </div>
                    </label>

                  </div>

                  {/* CONFIRMAÇÕES OBRIGATÓRIAS */}

                  <div className="space-y-4 rounded-2xl border border-[#e5e0ef] bg-[#faf9fd] p-5">

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.acceptTerms}
                        onChange={(event) =>
                          updateField('acceptTerms', event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-[#5940d7]"
                      />

                      <span className="text-sm leading-6 text-[#4d4764]">
                        Aceito os{' '}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="font-semibold text-[#5940d7] underline"
                        >
                          Termos de Utilização
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.acceptPrivacyPolicy}
                        onChange={(event) =>
                          updateField('acceptPrivacyPolicy', event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-[#5940d7]"
                      />

                      <span className="text-sm leading-6 text-[#4d4764]">
                        Aceito a{' '}
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="font-semibold text-[#5940d7] underline"
                        >
                          Política de Privacidade
                        </Link>
                        .
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.confirmInformation}
                        onChange={(event) =>
                          updateField('confirmInformation', event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-[#5940d7]"
                      />

                      <span className="text-sm leading-6 text-[#4d4764]">
                        Confirmo que as informações fornecidas são verdadeiras e correctas.
                      </span>
                    </label>

                  </div>

                  {/* RESUMO */}

                  <div className="rounded-2xl border border-[#e5e0ef] bg-[#faf9fd] p-5">

                    <h3 className="mb-5 text-sm font-semibold text-[#292342]">
                      Resumo do cadastro
                    </h3>

                    <div className="grid gap-5 text-sm sm:grid-cols-2">

                      <div>
                        <p className="text-xs text-[#aaa3bd]">
                          Responsável
                        </p>

                        <p className="mt-1 break-words text-[#4d4764]">
                          {form.ownerName || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#aaa3bd]">
                          Email
                        </p>

                        <p className="mt-1 break-words text-[#4d4764]">
                          {form.email || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#aaa3bd]">
                          Empresa
                        </p>

                        <p className="mt-1 break-words text-[#4d4764]">
                          {form.companyName || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#aaa3bd]">
                          NIF
                        </p>

                        <p className="mt-1 text-[#4d4764]">
                          {form.nif || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#aaa3bd]">
                          Funcionários
                        </p>

                        <p className="mt-1 text-[#4d4764]">
                          {form.employees || '0'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#aaa3bd]">
                          Regime fiscal
                        </p>

                        <p className="mt-1 text-[#4d4764]">
                          {form.regime || '—'}
                        </p>
                      </div>

                    </div>

                  </div>

                  <div className="flex items-start gap-3 rounded-xl bg-[#f3f0fb] p-4 text-xs leading-5 text-[#716b86]">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[#5940d7]"
                    />

                    <p>
                      Confirme se os dados estão correctos
                      antes de criar a conta da empresa.
                    </p>
                  </div>

                </div>
              )}

              {/* BOTÕES */}

              <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#eeeaf4] pt-6">

                {step > 1 ? (
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={loading}
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#e5e0ef] bg-white px-4 text-sm font-medium text-[#716b86] transition hover:border-[#5940d7] hover:text-[#5940d7] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft size={17} />
                    Voltar
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-medium text-[#817a96] transition hover:text-[#5940d7]"
                  >
                    Já tenho uma conta
                  </Link>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#5940d7] px-6 text-sm font-semibold text-white shadow-lg shadow-[#5940d7]/20 transition hover:bg-[#4932bd] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continuar
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#5940d7] px-6 text-sm font-semibold text-white shadow-lg shadow-[#5940d7]/20 transition hover:bg-[#4932bd] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        A criar conta...
                      </>
                    ) : (
                      <>
                        Criar empresa
                        <Check size={17} />
                      </>
                    )}
                  </button>
                )}

              </div>

            </form>

            {/* RODAPÉ */}

            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-[#aaa3bd] sm:flex-row">

              <span>
                Os seus dados são tratados com segurança.
              </span>

              <div className="flex items-center gap-3">

                <Link
                  href="/login"
                  className="transition hover:text-[#5940d7]"
                >
                  Iniciar sessão
                </Link>

                <span>•</span>

                <span>
                  Fiscalidade Digital
                </span>

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}