'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock3,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getCompany } from '@/services/company';
import type { Tenant } from '@/services/auth';
import {
  getSubscriptionStatus,
  type SubscriptionAccessStatus,
} from '@/services/subscription';

export default function SettingsPage() {
  const [company, setCompany] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] =
    useState<SubscriptionAccessStatus | null>(null);

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
            Consulte a subscrição e as definições administrativas da empresa.
          </p>
        </header>

        {error && (
          <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="mt-5 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              Identidade da aplicação
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              A Fiscalidade Digital utiliza uma interface clara e consistente em todos os dispositivos.
            </p>
          </div>
          <div className="flex items-start gap-3 px-5 py-5 text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0b6f93]" aria-hidden="true" />
            <p>Contraste, foco visível e redução de movimento seguem as preferências de acessibilidade do dispositivo.</p>
          </div>
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
