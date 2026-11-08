'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import AuthFrame from '@/components/auth/AuthFrame';
import { getSafeErrorMessage } from '@/lib/safe-error';
import api from '@/services/api';

type KnownRegime = 'GERAL' | 'SIMPLIFICADO' | 'PRESTADOR_SERVICO';
type Enrollment = {
  taxType: 'IVA' | 'INDUSTRIAL';
  regime: KnownRegime | 'UNKNOWN';
};

const today = () => new Date().toISOString().slice(0, 10);

export default function OnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [nif, setNif] = useState('');
  const [activityStartedAt, setActivityStartedAt] = useState(today);
  const [hasPriorUnregularizedObligations, setHasPriorUnregularizedObligations] =
    useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([
    { taxType: 'IVA', regime: 'UNKNOWN' },
    { taxType: 'INDUSTRIAL', regime: 'UNKNOWN' },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activityWasAlreadyUnderway = useMemo(
    () => activityStartedAt < today(),
    [activityStartedAt],
  );

  const changeRegime = (
    taxType: Enrollment['taxType'],
    regime: Enrollment['regime'],
  ) => {
    setEnrollments((items) =>
      items.map((item) => (item.taxType === taxType ? { ...item, regime } : item)),
    );
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    const onboardingToken = sessionStorage.getItem('fd-onboarding-token');

    if (!onboardingToken) {
      setError('A sessão de configuração expirou. Confirme o email novamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/complete-onboarding', {
        onboardingToken,
        companyName,
        nif,
        activityStartedAt,
        hasPriorUnregularizedObligations,
        enrollments: enrollments.map((item) =>
          item.regime === 'UNKNOWN'
            ? { taxType: item.taxType, status: 'UNKNOWN' }
            : {
                taxType: item.taxType,
                regime: item.regime,
                status: 'CONFIRMED',
                validFrom: activityStartedAt,
              },
        ),
      });
      sessionStorage.removeItem('fd-onboarding-token');
      router.replace('/login');
    } catch (requestError) {
      setError(
        getSafeErrorMessage(
          requestError,
          'Não foi possível concluir a configuração. Confirme os dados e tente novamente.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="Passo 2 de 2"
      title="Configure a empresa"
      description="Indique apenas o que já conhece. Pode rever o enquadramento de cada imposto mais tarde, na Situação Fiscal."
      backHref="/verify-email"
      backLabel="Voltar à confirmação"
      wide
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="fd-label">
            Nome da empresa
            <input
              required
              autoComplete="organization"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              className="fd-field mt-1.5"
            />
          </label>
          <label className="fd-label">
            NIF
            <input
              required
              value={nif}
              onChange={(event) => setNif(event.target.value)}
              className="fd-field mt-1.5"
            />
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">
            Início de atividade
          </legend>
          <p className="text-xs leading-5 text-slate-600">
            Esta data ajuda a organizar apenas os períodos que podem ser acompanhados.
          </p>
          <label className="fd-label block max-w-sm">
            Data de início de atividade
            <input
              required
              type="date"
              max={today()}
              value={activityStartedAt}
              onChange={(event) => setActivityStartedAt(event.target.value)}
              className="fd-field mt-1.5"
            />
          </label>
          {activityWasAlreadyUnderway && (
            <label className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={hasPriorUnregularizedObligations}
                onChange={(event) =>
                  setHasPriorUnregularizedObligations(event.target.checked)
                }
                className="mt-0.5"
              />
              <span>
                A empresa tem obrigações de períodos anteriores ainda por regularizar.
                <span className="mt-1 block text-xs leading-5 text-amber-800">
                  Iremos assinalá-las para a sua confirmação; não serão tratadas como valores calculados.
                </span>
              </span>
            </label>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">
            Enquadramento por imposto
          </legend>
          <p className="text-xs leading-5 text-slate-600">
            O IVA e o Imposto Industrial são informados separadamente. Confirme o regime na ficha de contribuinte ou no Portal do Contribuinte da AGT.
          </p>
          {enrollments.map((item) => {
            const taxLabel = item.taxType === 'IVA' ? 'IVA' : 'Imposto Industrial';
            return (
              <div
                key={item.taxType}
                className="rounded-xl border border-slate-200 p-4"
              >
                <label className="fd-label">
                  Regime de {taxLabel}
                  <select
                    value={item.regime}
                    onChange={(event) =>
                      changeRegime(
                        item.taxType,
                        event.target.value as Enrollment['regime'],
                      )
                    }
                    className="fd-field mt-1.5"
                  >
                    <option value="UNKNOWN">Não sei — confirmar na AGT</option>
                    <option value="GERAL">Regime Geral</option>
                    <option value="SIMPLIFICADO">Regime Simplificado</option>
                    {item.taxType === 'IVA' && (
                      <option value="PRESTADOR_SERVICO">Prestador de serviços</option>
                    )}
                  </select>
                </label>
                {item.regime === 'UNKNOWN' && (
                  <p className="mt-2 text-xs leading-5 text-amber-800">
                    Este imposto ficará por confirmar. Não assumiremos um regime nem valores por omissão.
                  </p>
                )}
              </div>
            );
          })}
        </fieldset>

        <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          A aplicação acompanha a informação indicada e não substitui a confirmação profissional ou junto da AGT.
        </p>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        <button disabled={loading} className="fd-button-primary w-full">
          {loading ? 'A concluir…' : 'Concluir configuração'}
        </button>
      </form>
    </AuthFrame>
  );
}
