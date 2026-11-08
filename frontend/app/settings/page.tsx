'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Clock3, CreditCard, UsersRound } from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/enterprise';
import { useAuth } from '@/context/AuthContext';
import { getCompany } from '@/services/company';
import type { Tenant } from '@/services/auth';
import {
  getSubscriptionStatus,
  type SubscriptionAccessStatus,
} from '@/services/subscription';

export default function SettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] =
    useState<SubscriptionAccessStatus | null>(null);
  const canManageUsers = ['OWNER', 'ADMIN'].includes(user?.role ?? '');

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
        <PageHeader
          eyebrow="Administração"
          title="Definições"
          description="Consulte o estado do plano e aceda às definições que o seu perfil permite gerir."
        />

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <section className="fd-panel mt-5">
          <div className="border-b border-[var(--fd-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--fd-text)]">
              Plano e acesso
            </h2>
            <p className="mt-1 text-sm text-[var(--fd-muted)]">
              Estado actual do plano, período experimental e pagamentos registados.
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
                  Pagamento mais recente:{' '}
                  {subscription.latestPayment?.status ?? 'sem registo'}
                </p>
              </div>

              <div className="bg-[var(--fd-surface)] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--fd-muted)]">
                  <Building2 className="h-4 w-4" />
                  Estado comercial calculado
                </div>
                <p className="mt-3 text-sm font-semibold text-[var(--fd-text)]">
                  {subscription.commercialAccess
                    ? 'Elegível no cálculo actual'
                    : 'Sem elegibilidade no cálculo actual'}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--fd-muted)]">
                  {subscription.enforcement.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-[var(--fd-muted)]">
              Estado comercial indisponível.
            </div>
          )}
        </section>

        <section className="fd-panel mt-5">
          <div className="border-b border-[var(--fd-border)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--fd-text)]">
              Gerir a empresa
            </h2>
            <p className="mt-1 text-sm text-[var(--fd-muted)]">
              Aceda aos dados da empresa e à gestão de utilizadores conforme as permissões do seu perfil.
            </p>
          </div>
          <div
            className={`grid gap-3 p-5 ${canManageUsers ? 'sm:grid-cols-2' : ''}`}
          >
            <Link href="/company" className="fd-button-secondary justify-start">
              <Building2 className="h-4 w-4" />
              Dados da empresa
            </Link>
            {canManageUsers ? (
              <Link href="/users" className="fd-button-secondary justify-start">
                <UsersRound className="h-4 w-4" />
                Utilizadores e perfis
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
