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

    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
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

    if (form.password.length < 12) {
      setError(
        'A palavra-passe deve ter pelo menos 12 caracteres.',
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
    'h-12 w-full rounded-md border border-[#d9e0e7] bg-white px-4 text-sm text-[#172642] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0b6f93] focus:ring-2 focus:ring-[#0b6f93]/10';

  const inputWithIconClass =
    'h-12 w-full rounded-md border border-[#d9e0e7] bg-white pl-11 pr-4 text-sm text-[#172642] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0b6f93] focus:ring-2 focus:ring-[#0b6f93]/10';

  return (
    <main className="fd-auth-page fd-theme-scope min-h-screen bg-[#f3f5f7] text-[#172642]">
      <div className="min-h-screen lg:grid lg:grid-cols-[380px_1fr]">

        {/* PAINEL LATERAL */}

        <aside className="hidden border-r border-[#173e57] bg-[#102f44] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">

          <div>

            <Link
              href="/"
              className="inline-flex w-fit items-center rounded-md bg-white px-3 py-2"
            >
              <img
                src="/logofiscalidade.png"
                alt="Fiscalidade Digital"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <div className="mt-24 max-w-xs">

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9fc4d3]">
                Registo empresarial
              </span>

              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
                Configure a conta da sua empresa.
              </h1>

              <p className="mt-5 text-sm leading-7 text-[#c5d8e0]">
                O registo recolhe os dados necessários para criar a empresa,
                o acesso inicial e o enquadramento fiscal.
              </p>

              <div className="mt-10 space-y-4 border-l border-[#6b9aab] pl-5">

                {[
                  'Dados fiscais organizados',
                  'Gestão empresarial centralizada',
                  'Acesso simples e seguro',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-[#dbe9ee]"
                  >
                    {item}
                  </div>
                ))}

              </div>
            </div>
          </div>

          <div className="text-xs text-[#83a9b8]">
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
                className="text-sm font-medium text-[#0b6f93]"
              >
                Iniciar sessão
              </Link>

            </div>

            {/* CABEÇALHO */}

            <div className="mb-8">

              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#0b6f93]">
                Passo {step} de 3
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#172642] sm:text-4xl">
                {getStepTitle()}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#66758d]">
                {getStepDescription()}
              </p>

            </div>

            {/* PROGRESSO */}

            <div className="mb-8">

              <div className="mb-3 flex items-center justify-between text-xs text-[#66758d]">
                <span>Configuração da conta</span>

                <span>
                  {Math.round((step / 3) * 100)}%
                </span>
              </div>

              <div className="h-1 overflow-hidden bg-[#d9e0e7]">
                <div
                  className="h-full bg-[#0b6f93] transition-all duration-300"
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
                          ? 'text-[#0b6f93]'
                          : 'text-[#94a3b8]'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${
                          active
                            ? 'border-[#0b6f93] bg-[#eaf4f8]'
                            : 'border-[#d9e0e7]'
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
              <div className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <span>{error}</span>
              </div>
            )}

            {/* MENSAGEM DE SUCESSO */}

            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
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
              className="rounded-lg border border-[#d9e0e7] bg-white p-5 sm:p-8"
            >

              {/* ETAPA 1 */}

              {step === 1 && (
                <div className="space-y-5">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
                      Nome do responsável
                    </label>

                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
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
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
                      Email
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
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
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
                      Telefone
                    </label>

                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
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
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
                      Palavra-passe
                    </label>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
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
                        placeholder="Mínimo de 12 caracteres"
                        className="h-12 w-full rounded-md border border-[#d9e0e7] bg-white pl-11 pr-12 text-sm text-[#172642] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0b6f93] focus:ring-4 focus:ring-[#0b6f93]/10"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#66758d]"
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
                                    ? 'bg-[#0b6f93]'
                                    : 'bg-[#d9e0e7]'
                                }`}
                              />
                            ),
                          )}
                        </div>

                        <p className="mt-2 text-xs text-[#66758d]">
                          Força da palavra-passe:{' '}
                          <span className="font-semibold text-[#0b6f93]">
                            {passwordStrength.label}
                          </span>
                        </p>

                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
                      Confirmar palavra-passe
                    </label>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
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
                        className="h-12 w-full rounded-md border border-[#d9e0e7] bg-white pl-11 pr-12 text-sm text-[#172642] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0b6f93] focus:ring-4 focus:ring-[#0b6f93]/10"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) => !current,
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#66758d]"
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
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
                      Nome da empresa
                    </label>

                    <div className="relative">
                      <Building2
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
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
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
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
                      <label className="mb-2 block text-sm font-medium text-[#334155]">
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
                      <label className="mb-2 block text-sm font-medium text-[#334155]">
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
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
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
                    <label className="mb-2 block text-sm font-medium text-[#334155]">
                      Morada da empresa
                    </label>

                    <div className="relative">
                      <MapPin
                        size={18}
                        className="absolute left-4 top-4 text-[#94a3b8]"
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
                        className="w-full resize-none rounded-md border border-[#d9e0e7] bg-white py-3 pl-11 pr-4 text-sm text-[#172642] outline-none transition placeholder:text-[#94a3b8] focus:border-[#0b6f93] focus:ring-4 focus:ring-[#0b6f93]/10"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* ETAPA 3 */}

              {step === 3 && (
                <div className="space-y-6">

                  <div>
                    <h3 className="text-lg font-semibold text-[#172642]">
                      Seleccione o regime fiscal
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#66758d]">
                      Escolha o enquadramento fiscal inicial
                      da sua empresa.
                    </p>
                  </div>

                  <div className="space-y-3">

                    <label
                      className={`block cursor-pointer rounded-lg border p-5 transition ${
                        form.regime === 'GERAL'
                          ? 'border-[#0b6f93] bg-[#0b6f93]/5'
                          : 'border-[#d9e0e7] bg-[#f8fafc] hover:border-[#a7bdc7]'
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
                              ? 'border-[#0b6f93] bg-[#0b6f93]'
                              : 'border-[#cfc9dd]'
                          }`}
                        >
                          {form.regime === 'GERAL' && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </span>

                        <div>
                          <h4 className="font-semibold text-[#172642]">
                            Regime Geral
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-[#66758d]">
                            Enquadramento fiscal geral
                            para empresas elegíveis.
                          </p>
                        </div>

                      </div>
                    </label>

                    <label
                      className={`block cursor-pointer rounded-lg border p-5 transition ${
                        form.regime === 'SIMPLIFICADO'
                          ? 'border-[#0b6f93] bg-[#0b6f93]/5'
                          : 'border-[#d9e0e7] bg-[#f8fafc] hover:border-[#a7bdc7]'
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
                              ? 'border-[#0b6f93] bg-[#0b6f93]'
                              : 'border-[#cfc9dd]'
                          }`}
                        >
                          {form.regime === 'SIMPLIFICADO' && (
                            <span className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </span>

                        <div>
                          <h4 className="font-semibold text-[#172642]">
                            Regime Simplificado
                          </h4>

                          <p className="mt-1 text-sm leading-6 text-[#66758d]">
                            Enquadramento simplificado
                            para actividades elegíveis.
                          </p>
                        </div>

                      </div>
                    </label>

                  </div>

                  {/* CONFIRMAÇÕES OBRIGATÓRIAS */}

                  <div className="space-y-4 rounded-lg border border-[#d9e0e7] bg-[#f8fafc] p-5">

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.acceptTerms}
                        onChange={(event) =>
                          updateField('acceptTerms', event.target.checked)
                        }
                        className="mt-1 h-4 w-4 accent-[#0b6f93]"
                      />

                      <span className="text-sm leading-6 text-[#334155]">
                        Aceito os{' '}
                        <Link
                          href="/terms"
                          target="_blank"
                          className="font-semibold text-[#0b6f93] underline"
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
                        className="mt-1 h-4 w-4 accent-[#0b6f93]"
                      />

                      <span className="text-sm leading-6 text-[#334155]">
                        Aceito a{' '}
                        <Link
                          href="/privacy"
                          target="_blank"
                          className="font-semibold text-[#0b6f93] underline"
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
                        className="mt-1 h-4 w-4 accent-[#0b6f93]"
                      />

                      <span className="text-sm leading-6 text-[#334155]">
                        Confirmo que as informações fornecidas são verdadeiras e correctas.
                      </span>
                    </label>

                  </div>

                  {/* RESUMO */}

                  <div className="rounded-lg border border-[#d9e0e7] bg-[#f8fafc] p-5">

                    <h3 className="mb-5 text-sm font-semibold text-[#172642]">
                      Resumo do cadastro
                    </h3>

                    <div className="grid gap-5 text-sm sm:grid-cols-2">

                      <div>
                        <p className="text-xs text-[#94a3b8]">
                          Responsável
                        </p>

                        <p className="mt-1 break-words text-[#334155]">
                          {form.ownerName || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#94a3b8]">
                          Email
                        </p>

                        <p className="mt-1 break-words text-[#334155]">
                          {form.email || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#94a3b8]">
                          Empresa
                        </p>

                        <p className="mt-1 break-words text-[#334155]">
                          {form.companyName || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#94a3b8]">
                          NIF
                        </p>

                        <p className="mt-1 text-[#334155]">
                          {form.nif || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#94a3b8]">
                          Funcionários
                        </p>

                        <p className="mt-1 text-[#334155]">
                          {form.employees || '0'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#94a3b8]">
                          Regime fiscal
                        </p>

                        <p className="mt-1 text-[#334155]">
                          {form.regime || '—'}
                        </p>
                      </div>

                    </div>

                  </div>

                  <div className="flex items-start gap-3 rounded-md bg-[#eef6f8] p-4 text-xs leading-5 text-[#526174]">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[#0b6f93]"
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
                    className="inline-flex h-12 items-center gap-2 rounded-md border border-[#d9e0e7] bg-white px-4 text-sm font-medium text-[#526174] transition hover:border-[#0b6f93] hover:text-[#0b6f93] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft size={17} />
                    Voltar
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-medium text-[#66758d] transition hover:text-[#0b6f93]"
                  >
                    Já tenho uma conta
                  </Link>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={loading}
                    className="inline-flex h-12 items-center gap-2 rounded-md bg-[#0b6f93] px-6 text-sm font-semibold text-white transition hover:bg-[#085b79] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continuar
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 items-center gap-2 rounded-md bg-[#0b6f93] px-6 text-sm font-semibold text-white transition hover:bg-[#085b79] disabled:cursor-not-allowed disabled:opacity-50"
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

            <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-[#94a3b8] sm:flex-row">

              <span>
                Os seus dados são tratados com segurança.
              </span>

              <div className="flex items-center gap-3">

                <Link
                  href="/login"
                  className="transition hover:text-[#0b6f93]"
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
