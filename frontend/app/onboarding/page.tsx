'use client';

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import AuthFrame from '@/components/auth/AuthFrame';
import api from '@/services/api';

type Enrollment = {
  enabled: boolean;
  taxType: 'IVA' | 'INDUSTRIAL';
  regime: 'GERAL' | 'SIMPLIFICADO';
  validFrom: string;
};

type OnboardingErrors = {
  companyName?: string;
  nif?: string;
  enrollments?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [nif, setNif] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([
    {
      enabled: false,
      taxType: 'IVA',
      regime: 'GERAL',
      validFrom: new Date().toISOString().slice(0, 10),
    },
    {
      enabled: false,
      taxType: 'INDUSTRIAL',
      regime: 'GERAL',
      validFrom: new Date().toISOString().slice(0, 10),
    },
  ]);
  const [fieldErrors, setFieldErrors] = useState<OnboardingErrors>({});
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

  function changeEnrollment(index: number, patch: Partial<Enrollment>) {
    setEnrollments((all) =>
      all.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
    setFieldErrors((current) => ({ ...current, enrollments: undefined }));
    setError('');
  }

  function validateForm(): OnboardingErrors {
    const errors: OnboardingErrors = {};

    if (!companyName.trim()) {
      errors.companyName = 'Indique o nome da empresa.';
    }

    if (!nif.trim()) {
      errors.nif = 'Indique o NIF da empresa.';
    }

    if (!enrollments.some((item) => item.enabled)) {
      errors.enrollments = 'Seleccione pelo menos uma situação fiscal declarada.';
    }

    return errors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const onboardingToken = sessionStorage.getItem('fd-onboarding-token');

    if (!onboardingToken) {
      setError('A sessão de configuração expirou. Confirme o email novamente.');
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
      await api.post('/auth/complete-onboarding', {
        onboardingToken,
        companyName,
        nif,
        enrollments: enrollments
          .filter((item) => item.enabled)
          .map(({ enabled, ...item }) => item),
      });
      sessionStorage.removeItem('fd-onboarding-token');
      router.replace('/login');
    } catch {
      setError('Não foi possível concluir a configuração. Confirme os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="CONFIGURAÇÃO DA EMPRESA"
      title="Configure a empresa"
      description="Indique a empresa e a situação fiscal declarada. Poderá rever estes dados mais tarde na área Situação Fiscal."
      backHref="/verify-email"
      backLabel="Voltar à confirmação"
      wide
    >
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label htmlFor="onboarding-company-name" className="fd-label">
            Nome da empresa
            <input
              id="onboarding-company-name"
              required
              autoComplete="organization"
              value={companyName}
              disabled={loading}
              onChange={(event) => {
                setCompanyName(event.target.value);
                setFieldErrors((current) => ({ ...current, companyName: undefined }));
                setError('');
              }}
              aria-invalid={Boolean(fieldErrors.companyName)}
              aria-describedby={fieldErrors.companyName ? 'onboarding-company-name-error' : undefined}
              className="fd-field mt-1.5"
            />
            {fieldErrors.companyName ? (
              <span id="onboarding-company-name-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">
                {fieldErrors.companyName}
              </span>
            ) : null}
          </label>

          <label htmlFor="onboarding-nif" className="fd-label">
            NIF
            <input
              id="onboarding-nif"
              required
              inputMode="numeric"
              autoComplete="off"
              value={nif}
              disabled={loading}
              onChange={(event) => {
                setNif(event.target.value);
                setFieldErrors((current) => ({ ...current, nif: undefined }));
                setError('');
              }}
              aria-invalid={Boolean(fieldErrors.nif)}
              aria-describedby={fieldErrors.nif ? 'onboarding-nif-error' : undefined}
              className="fd-field mt-1.5"
            />
            {fieldErrors.nif ? (
              <span id="onboarding-nif-error" role="alert" className="mt-1.5 block text-sm font-normal text-red-700">
                {fieldErrors.nif}
              </span>
            ) : null}
          </label>
        </div>

        <fieldset
          aria-describedby={fieldErrors.enrollments ? 'onboarding-enrollments-error' : undefined}
          className="space-y-3"
        >
          <legend className="text-sm font-semibold text-slate-900">
            Situação fiscal declarada{' '}
            <span className="font-normal text-slate-500">(obrigatório)</span>
          </legend>
          <p className="text-xs leading-5 text-slate-600">
            Seleccione pelo menos um imposto e indique o regime actualmente declarado para a empresa.
          </p>

          {enrollments.map((item, index) => {
            const taxLabel = item.taxType === 'IVA' ? 'IVA' : 'Imposto Industrial';
            const checkboxId = `onboarding-${item.taxType.toLowerCase()}`;

            return (
              <div key={item.taxType} className="rounded-xl border border-slate-200 bg-white p-4">
                <label htmlFor={checkboxId} className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={item.enabled}
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.enrollments)}
                    onChange={(event) => changeEnrollment(index, { enabled: event.target.checked })}
                    className="h-5 w-5 shrink-0 accent-fd-primary"
                  />
                  Confirmar dados de {taxLabel}
                </label>

                {item.enabled ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="fd-label">
                      Regime
                      <select
                        value={item.regime}
                        disabled={loading}
                        onChange={(event) => changeEnrollment(index, {
                          regime: event.target.value as Enrollment['regime'],
                        })}
                        className="fd-field mt-1.5"
                      >
                        <option value="GERAL">Regime Geral</option>
                        <option value="SIMPLIFICADO">Regime Simplificado</option>
                      </select>
                    </label>
                    <label className="fd-label">
                      Início da vigência
                      <input
                        required
                        type="date"
                        value={item.validFrom}
                        disabled={loading}
                        onChange={(event) => changeEnrollment(index, {
                          validFrom: event.target.value,
                        })}
                        className="fd-field mt-1.5"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}

          {fieldErrors.enrollments ? (
            <p id="onboarding-enrollments-error" role="alert" className="text-sm text-red-700">
              {fieldErrors.enrollments}
            </p>
          ) : null}
        </fieldset>

        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          Registe somente enquadramentos conhecidos. A aplicação não presume um regime fiscal universal para a empresa.
        </p>

        {error ? (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button disabled={loading} aria-busy={loading} className="fd-button-primary w-full">
          {loading ? 'A concluir…' : 'Concluir configuração'}
        </button>
      </form>
    </AuthFrame>
  );
}
