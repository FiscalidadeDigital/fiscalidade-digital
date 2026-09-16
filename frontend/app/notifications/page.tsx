'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  AlertTriangle,
  Loader2,
  Mail,
  RefreshCw,
  Inbox,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/services/notifications';

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Data não disponível';
  }

  return date.toLocaleString(
    'pt-AO',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  );
}

export default function NotificationsPage() {
  const [
    company,
    setCompany,
  ] = useState<any>(null);

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    companyLoading,
    setCompanyLoading,
  ] = useState(true);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(true);

  const [
    notificationError,
    setNotificationError,
  ] = useState('');

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const [
    markingId,
    setMarkingId,
  ] = useState<string | null>(null);

  useEffect(() => {
    loadCompany();
    loadNotifications();
  }, []);

  // =====================================================
  // EMPRESA
  // =====================================================

  async function loadCompany() {
    try {
      setCompanyLoading(true);

      const data =
        await getCompany();

      setCompany(data);
    } catch (error) {
      console.error(
        'Erro ao carregar empresa:',
        error,
      );
    } finally {
      setCompanyLoading(false);
    }
  }

  // =====================================================
  // NOTIFICAÇÕES
  // =====================================================

  async function loadNotifications() {
    try {
      setNotificationsLoading(true);
      setNotificationError('');

      const data =
        await getNotifications();

      setNotifications(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (error: any) {
      console.error(
        'Erro ao carregar notificações:',
        error,
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Não foi possível carregar as notificações.';

      setNotificationError(
        Array.isArray(message)
          ? message.join(', ')
          : message,
      );

      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }

  // =====================================================
  // MARCAR COMO LIDA
  // =====================================================

  async function handleRead(
    id: string,
  ) {
    try {
      setMarkingId(id);

      await markAsRead(id);

      setNotifications(
        current =>
          current.map(
            notification =>
              notification.id === id
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification,
          ),
      );
    } catch (error) {
      console.error(
        'Erro ao marcar notificação:',
        error,
      );
    } finally {
      setMarkingId(null);
    }
  }

  // =====================================================
  // MARCAR TODAS
  // =====================================================

  async function handleMarkAll() {
    try {
      setMarkingAll(true);

      await markAllAsRead();

      setNotifications(
        current =>
          current.map(
            notification => ({
              ...notification,
              isRead: true,
            }),
          ),
      );
    } catch (error) {
      console.error(
        'Erro ao marcar notificações:',
        error,
      );
    } finally {
      setMarkingAll(false);
    }
  }

  // =====================================================
  // RECARREGAR
  // =====================================================

  async function reloadNotifications() {
    await loadNotifications();
  }

  // =====================================================
  // LOADING DA EMPRESA
  // =====================================================

  if (
    companyLoading ||
    !company
  ) {
    return (
      <DashboardLayout
        company={company}
      >
        <div className="min-h-[500px] flex items-center justify-center">

          <div className="flex flex-col items-center gap-4">

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">

              <Loader2
                size={23}
                className="animate-spin text-indigo-600"
              />

            </div>

            <div className="text-center">

              <p className="text-sm font-bold text-slate-800">
                A carregar a sua empresa
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Aguarde um momento...
              </p>

            </div>

          </div>

        </div>
      </DashboardLayout>
    );
  }

  // =====================================================
  // ESTATÍSTICAS
  // =====================================================

  const unreadCount =
    notifications.filter(
      notification =>
        !notification.isRead,
    ).length;

  const readCount =
    notifications.length -
    unreadCount;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <DashboardLayout
      company={company}
    >
      <div className="max-w-[1200px] mx-auto pb-12">

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-7">

          <div>

            <div className="flex items-center gap-2 mb-3">

              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">

                <Bell
                  size={20}
                  className="text-indigo-600"
                />

              </div>

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
                Centro de alertas
              </span>

            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
              Notificações
            </h1>

            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Acompanhe os alertas fiscais,
              prazos e avisos importantes
              relacionados à sua empresa.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={reloadNotifications}
              disabled={
                notificationsLoading
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-60"
            >

              <RefreshCw
                size={16}
                className={
                  notificationsLoading
                    ? 'animate-spin'
                    : ''
                }
              />

              Atualizar

            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={
                  handleMarkAll
                }
                disabled={markingAll}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60"
              >

                {markingAll ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCheck
                    size={16}
                  />
                )}

                Marcar todas como lidas

              </button>
            )}

          </div>

        </div>

        {/* =================================================
            RESUMO
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">

          <SummaryCard
            icon={
              <Inbox size={19} />
            }
            label="Total"
            value={
              notifications.length
            }
            className="bg-indigo-50 text-indigo-600"
          />

          <SummaryCard
            icon={
              <AlertTriangle size={19} />
            }
            label="Não lidas"
            value={
              unreadCount
            }
            className="bg-orange-50 text-orange-600"
          />

          <SummaryCard
            icon={
              <Check size={19} />
            }
            label="Lidas"
            value={
              readCount
            }
            className="bg-emerald-50 text-emerald-600"
          />

        </div>

        {/* =================================================
            AVISO DE ERRO
        ================================================= */}

        {notificationError && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">

                <AlertTriangle
                  size={18}
                  className="text-red-500"
                />

              </div>

              <div className="flex-1">

                <p className="text-sm font-bold text-red-800">
                  Não foi possível carregar as notificações
                </p>

                <p className="text-xs text-red-600 mt-1 leading-5">
                  {notificationError}
                </p>

                <button
                  type="button"
                  onClick={
                    reloadNotifications
                  }
                  className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-900"
                >

                  <RefreshCw size={13} />

                  Tentar novamente

                </button>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            LISTA
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">

            <div>

              <h2 className="font-bold text-slate-900">
                Alertas fiscais
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Notificações relacionadas
                às obrigações da empresa.
              </p>

            </div>

            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">

              <Bell
                size={19}
                className="text-slate-400"
              />

            </div>

          </div>

          {/* CARREGANDO */}

          {notificationsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">

              <Loader2
                size={27}
                className="animate-spin text-indigo-600 mb-3"
              />

              <p className="text-sm font-semibold text-slate-600">
                A carregar notificações...
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Estamos a consultar os seus alertas.
              </p>

            </div>
          ) : notifications.length === 0 ? (

            /* SEM NOTIFICAÇÕES */

            <div className="py-20 px-6 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">

                <Bell
                  size={27}
                  className="text-slate-300"
                />

              </div>

              <h3 className="font-bold text-slate-800">
                Nenhuma notificação
              </h3>

              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto leading-6">
                Quando existir um novo alerta
                fiscal, prazo próximo ou aviso
                importante, ele aparecerá aqui.
              </p>

            </div>
          ) : (

            /* NOTIFICAÇÕES */

            <div className="divide-y divide-slate-100">

              {notifications.map(
                notification => (
                  <div
                    key={
                      notification.id
                    }
                    className={`p-5 md:p-6 transition ${
                      notification.isRead
                        ? 'bg-white hover:bg-slate-50/70'
                        : 'bg-indigo-50/40 hover:bg-indigo-50/60'
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      {/* ÍCONE */}

                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          notification.isRead
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-indigo-100 text-indigo-600'
                        }`}
                      >

                        <Bell size={19} />

                      </div>

                      {/* CONTEÚDO */}

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                          <div className="flex items-center gap-2">

                            <h3 className="font-bold text-slate-900">
                              {
                                notification.title
                              }
                            </h3>

                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                            )}

                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-400">

                            <Clock3
                              size={13}
                            />

                            {formatDate(
                              notification.createdAt,
                            )}

                          </div>

                        </div>

                        <p className="text-sm text-slate-600 leading-6 mt-2">
                          {
                            notification.message
                          }
                        </p>

                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRead(
                                notification.id,
                              )
                            }
                            disabled={
                              markingId ===
                              notification.id
                            }
                            className="inline-flex items-center gap-2 mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition disabled:opacity-60"
                          >

                            {markingId ===
                            notification.id ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Check
                                size={14}
                              />
                            )}

                            Marcar como lida

                          </button>
                        )}

                        {notification.isRead && (
                          <div className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">

                            <Check
                              size={13}
                            />

                            Lida

                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                ),
              )}

            </div>
          )}

        </div>

        {/* =================================================
            E-MAIL
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">

              <Mail
                size={18}
                className="text-indigo-600"
              />

            </div>

            <div>

              <p className="text-sm font-bold text-slate-800">
                Alertas por e-mail
              </p>

              <p className="text-sm text-slate-500 leading-6 mt-1">
                Os alertas fiscais importantes
                também serão enviados para o
                endereço de e-mail cadastrado
                na empresa.
              </p>

            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

// =====================================================
// CARD DE RESUMO
// =====================================================

function SummaryCard({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${className}`}
        >
          {icon}
        </div>

        <div>

          <p className="text-xs font-semibold text-slate-400">
            {label}
          </p>

          <p className="text-xl font-extrabold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}