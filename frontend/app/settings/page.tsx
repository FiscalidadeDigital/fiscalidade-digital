'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock3,
  CreditCard,
  Moon,
  Sun,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  useTheme,
  type ThemePreference,
} from '@/context/ThemeContext';
import { getCompany } from '@/services/company';
import type { Tenant } from '@/services/auth';
import {
  getSubscriptionStatus,
  type SubscriptionAccessStatus,
} from '@/services/subscription';

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Superfícies claras para ambientes bem iluminados.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Contraste sóbrio para utilização com pouca luz.',
    icon: Moon,
  },
];

export default function SettingsPage() {
  const [company, setCompany] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] =
    useState<SubscriptionAccessStatus | null>(null);
  const { preference, resolvedTheme, setPreference } = useTheme();

  useEffect(() => {
    let mounted = true;

    void Promise.allSettled([getCompany(), getSubscriptionStatus()]).then(
      ([companyResult, subscriptionResult]) => {
        if (!mounted) return;

        if (companyResult.status === 'fulfilled') {
          setCompany(companyResult.value);
        }
        if (subscriptionResult.status === 'fulfilled') {
          setSubscription(subscriptionResult.value);
        }
        if (
          companyResult.status === 'rejected' ||
          subscriptionResult.status === 'rejected'
        ) {
          setError('Não foi possível carregar todas as definições da empresa.');
        }
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <DashboardLayout company={company ?? undefined}>
      <div className="fd-workspace-page fd-theme-scope mx-auto w-full max-w-[1100px]">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Definições
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ajuste a apresentação do sistema neste navegador.
          </p>
        </header>

        {error && (
          <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="mt-5 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              Tema
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              A preferência fica guardada neste dispositivo. Tema activo: {resolvedTheme === 'dark' ? 'escuro' : 'claro'}.
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-sm text-slate-500">
              A carregar definições...
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const selected = preference === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreference(option.value)}
                    aria-pressed={selected}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b6f93]"
                  >
                    <Icon size={20} className="shrink-0 text-slate-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-950">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-600">
                        {option.description}
                      </span>
                    </span>
                    {selected && (
                      <Check size={19} className="shrink-0 text-[#0b6f93]" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-5 border border-[var(--fd-border)] bg-[var(--fd-surface)]">
          <div className="border-b border-[var(--fd-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--fd-text)]">
              Trial e subscrição
            </h2>
            <p className="mt-1 text-sm text-[var(--fd-muted)]">
              Estado calculado pelo backend. Não existem cobranças activas nesta fase.
            </p>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-sm text-[var(--fd-muted)]">
              A avaliar o estado comercial...
            </div>
          ) : subscription ? (
            <div className="grid gap-px bg-[var(--fd-border)] md:grid-cols-3">
              <div className="bg-[var(--fd-surface)] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--fd-muted)]">
                  <Clock3 className="h-4 w-4" />
                  Estado
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--fd-text)]">
                  {subscription.state === 'TRIAL_ACTIVE'
                    ? 'Período experimental activo'
                    : subscription.state === 'SUBSCRIPTION_ACTIVE'
                      ? 'Subscrição activa'
                      : subscription.state === 'TRIAL_EXPIRED'
                        ? 'Período experimental terminado'
                        : subscription.state === 'SUSPENDED'
                          ? 'Empresa suspensa'
                          : 'Subscrição necessária'}
                </p>
                <p className="mt-1 text-xs text-[var(--fd-muted)]">
                  {subscription.state === 'TRIAL_ACTIVE'
                    ? `${subscription.trial.daysRemaining} dias restantes`
                    : subscription.trial.endsAt
                      ? `Trial terminou em ${new Date(subscription.trial.endsAt).toLocaleDateString('pt-AO')}`
                      : 'Sem período activo'}
                </p>
              </div>

              <div className="bg-[var(--fd-surface)] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--fd-muted)]">
                  <CreditCard className="h-4 w-4" />
                  Plano registado
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--fd-text)]">
                  {subscription.plan.current}
                </p>
                <p className="mt-1 text-xs text-[var(--fd-muted)]">
                  Pagamento mais recente: {subscription.latestPayment?.status ?? 'sem registo'}
                </p>
              </div>

              <div className="bg-[var(--fd-surface)] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  Aplicação das regras
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--fd-text)]">
                  Preparada, ainda não aplicada
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--fd-muted)]">
                  O bloqueio aguarda a definição de planos e das funcionalidades essenciais.
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-[var(--fd-muted)]">
              Estado comercial indisponível.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
