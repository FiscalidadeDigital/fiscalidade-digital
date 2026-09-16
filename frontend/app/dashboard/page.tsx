'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  CalendarDays,
  RefreshCw,
  ArrowRight,
  ClipboardList,
  TrendingUp,
  ShieldCheck,
  ReceiptText,
  Building2,
  FileText,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import CalendarFiscal from '@/components/dashboard/CalendarFiscal';
import Alerts from '@/components/dashboard/Alerts';
import FiscalSummary from '@/components/dashboard/FiscalSummary';
import PaymentEvolution from '@/components/dashboard/PaymentEvolution';
import QuickActions from '@/components/dashboard/QuickActions';

import api from '@/services/api';

// ============================================================
// TIPOS
// ============================================================

interface Company {
  id?: string;
  name: string;
  nif: string;
  regime: string;
  sector: string;
  companyType?: string | null;
  status?: string | null;
}

interface Deadline {
  id?: string;
  date: string;
  title: string;
  description?: string | null;
  amount?: number;
  type?: string;
  daysLeft?: number;
  status?:
    | 'today'
    | 'warning'
    | 'normal'
    | 'success';
  obligationStatus?: string;
  regime?: string;
  sector?: string;
}

interface Alert {
  id: string;
  title: string;
  description: string;
  date?: string;
  type:
    | 'danger'
    | 'warning'
    | 'info'
    | 'success';
}

interface Tax {
  name: string;
  value: number;
  percentage?: number;
  paid?: number;
  pending?: number;
  declared?: number;
}

interface Payment {
  month: string;
  monthNumber?: number;
  year?: number;
  value: number;
}

interface DashboardData {
  pendingObligations: number;
  pendingObligationsAmount?: number;
  upcomingDeadlines: number;
  paymentsOnTime: number;
  finesAvoided?: number | null;

  deadlines: Deadline[];

  alerts: Alert[];

  taxes: Tax[];

  payments: Payment[];

  company?: Company;

  metrics?: {
    totalRevenue?: number;
    paidInvoiceRevenue?: number;

    pendingObligations?: number;
    pendingObligationsAmount?: number;

    totalObligations?: number;

    paidObligations?: number;
    paidObligationAmount?: number;

    overdueObligations?: number;

    invoices?: number;
    pendingInvoices?: number;

    clients?: number;
    products?: number;

    iva?: number;
    irt?: number;

    totalTaxes?: number;
    totalPayments?: number;

    fiscalCompletion?: number;
    fiscalScore?: number | null;
    healthScore?: number | null;
  };

  recentPayments?: any[];

  recentInvoices?: any[];

  monthlyRevenue?: any[];

  chartData?: any[];

  paymentHistory?: any[];

  financial?: {
    totalRevenue?: number;
    totalTaxes?: number;
    totalPayments?: number;
    timelyPaidAmount?: number;
  };

  source?: any;
}

// ============================================================
// DADOS VAZIOS
// ============================================================

const EMPTY_COMPANY: Company = {
  name: '',
  nif: '',
  regime: '',
  sector: '',
};

const EMPTY_DATA: DashboardData = {
  pendingObligations: 0,
  pendingObligationsAmount: 0,
  upcomingDeadlines: 0,
  paymentsOnTime: 0,
  finesAvoided: null,
  deadlines: [],
  alerts: [],
  taxes: [],
  payments: [],
};

// ============================================================
// HELPERS
// ============================================================

function toNumber(
  value: unknown,
): number {
  const number =
    Number(value);

  return Number.isFinite(
    number,
  )
    ? number
    : 0;
}

function getMessage(
  error: any,
): string {
  if (
    error?.response?.status ===
    401
  ) {
    return 'Sessão expirada. Faça login novamente.';
  }

  if (
    error?.response?.status ===
    403
  ) {
    return 'Não tem autorização para acessar o dashboard.';
  }

  const serverMessage =
    error?.response?.data?.message;

  if (
    Array.isArray(
      serverMessage,
    )
  ) {
    return serverMessage.join(
      ', ',
    );
  }

  if (
    serverMessage
  ) {
    return String(
      serverMessage,
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return 'Erro ao carregar os dados fiscais.';
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    'pt-AO',
    {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value || 0),
  );
}

function getRegimeLabel(
  regime: string,
): string {
  const value =
    String(
      regime || '',
    )
      .trim()
      .toUpperCase();

  if (
    value.includes(
      'SIMPLIFICADO',
    )
  ) {
    return 'Regime Simplificado';
  }

  if (
    value.includes(
      'GERAL',
    )
  ) {
    return 'Regime Geral';
  }

  return regime || 'Regime não definido';
}

function getCompanyStatus(
  status?: string | null,
): string {
  const value =
    String(
      status || '',
    ).toUpperCase();

  if (
    value === 'ACTIVE'
  ) {
    return 'Activa';
  }

  if (
    value === 'TRIAL'
  ) {
    return 'Período experimental';
  }

  if (
    value === 'SUSPENDED'
  ) {
    return 'Suspensa';
  }

  return status || '—';
}

// ============================================================
// PÁGINA
// ============================================================

export default function DashboardPage() {
  const [
    company,
    setCompany,
  ] = useState<Company>(
    EMPTY_COMPANY,
  );

  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardData>(
    EMPTY_DATA,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  // ==========================================================
  // CARREGAR DADOS
  // ==========================================================

  async function fetchDashboard(
    isRefresh = false,
  ) {
    try {
      if (
        isRefresh
      ) {
        setRefreshing(
          true,
        );
      } else {
        setLoading(
          true,
        );
      }

      setError(null);

      /*
       * O backend identifica a empresa através
       * do JWT.
       *
       * Não enviamos tenantId pelo frontend.
       */

      const response =
        await api.get(
          '/dashboard',
        );

      const data =
        response?.data;

      // ========================================================
      // EMPRESA
      // ========================================================

      const realCompany: Company = {
        id:
          data?.company?.id,

        name:
          data?.company?.name ||
          'Empresa',

        nif:
          data?.company?.nif ||
          'Não disponível',

        regime:
          data?.company?.regime ||
          'Não definido',

        sector:
          data?.company?.sector ||
          'Não definido',

        companyType:
          data?.company?.companyType ||
          null,

        status:
          data?.company?.status ||
          null,
      };

      setCompany(
        realCompany,
      );

      // ========================================================
      // DASHBOARD
      // ========================================================

      const realDashboard: DashboardData = {
        ...EMPTY_DATA,

        ...data,

        pendingObligations:
          toNumber(
            data?.pendingObligations,
          ),

        pendingObligationsAmount:
          toNumber(
            data?.pendingObligationsAmount,
          ),

        upcomingDeadlines:
          toNumber(
            data?.upcomingDeadlines,
          ),

        paymentsOnTime:
          toNumber(
            data?.paymentsOnTime,
          ),

        finesAvoided:
          data?.finesAvoided ===
          null ||
          data?.finesAvoided ===
          undefined
            ? null
            : toNumber(
                data?.finesAvoided,
              ),

        deadlines:
          Array.isArray(
            data?.deadlines,
          )
            ? data.deadlines
            : [],

        alerts:
          Array.isArray(
            data?.alerts,
          )
            ? data.alerts
            : [],

        taxes:
          Array.isArray(
            data?.taxes,
          )
            ? data.taxes
            : [],

        payments:
          Array.isArray(
            data?.payments,
          )
            ? data.payments
            : [],
      };

      setDashboard(
        realDashboard,
      );
    } catch (
      dashboardError: any
    ) {
      console.error(
        'Erro no dashboard:',
        dashboardError,
      );

      setError(
        getMessage(
          dashboardError,
        ),
      );

      setDashboard(
        EMPTY_DATA,
      );
    } finally {
      setLoading(
        false,
      );

      setRefreshing(
        false,
      );
    }
  }

  // ==========================================================
  // PRIMEIRO CARREGAMENTO
  // ==========================================================

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading
  ) {
    return (
      <DashboardLayout
        company={company}
      >
        <div
          className="
            flex
            min-h-[600px]
            items-center
            justify-center
            bg-[#f7f9fc]
          "
        >
          <div
            className="
              flex
              flex-col
              items-center
              gap-4
            "
          >
            <div
              className="
                h-9
                w-9
                animate-spin
                rounded-full
                border-4
                border-slate-200
                border-t-[#0ea5e9]
              "
            />

            <p
              className="
                text-sm
                text-slate-500
              "
            >
              A carregar a situação fiscal...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const regime =
    getRegimeLabel(
      company.regime,
    );

  const companyStatus =
    getCompanyStatus(
      company.status,
    );

  const pendingAmount =
    toNumber(
      dashboard.pendingObligationsAmount,
    );

  const overdueCount =
    toNumber(
      dashboard.metrics
        ?.overdueObligations,
    );

  const totalTaxes =
    toNumber(
      dashboard.metrics
        ?.totalTaxes,
    );

  const totalPayments =
    toNumber(
      dashboard.metrics
        ?.totalPayments,
    );

  const totalRevenue =
    toNumber(
      dashboard.metrics
        ?.totalRevenue,
    );

  return (
    <DashboardLayout
      company={company}
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          px-3
          pb-10
          sm:px-4
          lg:px-6
        "
      >

        {/* ==================================================
            CABEÇALHO DA EMPRESA
        ================================================== */}

        <div
          className="
            mb-6
            rounded-2xl
            border
            border-[#e5e9f0]
            bg-white
            px-5
            py-5
            shadow-sm
            sm:px-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >

            <div
              className="
                flex
                min-w-0
                items-start
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#eff8ff]
                  text-[#0ea5e9]
                "
              >
                <Building2
                  size={22}
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">

                <div
                  className="
                    mb-1
                    flex
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-emerald-500
                    "
                  />

                  <span
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-emerald-600
                    "
                  >
                    {companyStatus}
                  </span>
                </div>

                <h1
                  className="
                    truncate
                    text-[22px]
                    font-extrabold
                    tracking-tight
                    text-[#111b3b]
                    sm:text-[26px]
                  "
                >
                  {company.name}
                </h1>

                <div
                  className="
                    mt-2
                    flex
                    flex-wrap
                    items-center
                    gap-x-3
                    gap-y-2
                  "
                >
                  <span
                    className="
                      text-[11px]
                      text-[#7180a2]
                    "
                  >
                    NIF: {company.nif}
                  </span>

                  <span
                    className="
                      hidden
                      text-[#c9ced8]
                      sm:inline
                    "
                  >
                    •
                  </span>

                  <span
                    className="
                      text-[10px]
                      font-semibold
                      text-[#526080]
                    "
                  >
                    {regime}
                  </span>

                  <span
                    className="
                      hidden
                      text-[#c9ced8]
                      sm:inline
                    "
                  >
                    •
                  </span>

                  <span
                    className="
                      text-[10px]
                      text-[#7180a2]
                    "
                  >
                    {company.sector}
                  </span>
                </div>

              </div>
            </div>

            {/* ACÇÕES */}

            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
              "
            >
              <button
                type="button"
                onClick={() =>
                  fetchDashboard(
                    true,
                  )
                }
                disabled={
                  refreshing
                }
                className="
                  flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-[#e2e7ef]
                  bg-white
                  px-3
                  text-[11px]
                  font-semibold
                  text-[#526080]
                  transition
                  hover:bg-[#f6f8fb]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                Actualizar
              </button>

              <Link
                href="/obligations"
                className="
                  flex
                  h-10
                  items-center
                  gap-2
                  rounded-xl
                  bg-[#0ea5e9]
                  px-4
                  text-[11px]
                  font-bold
                  text-white
                  transition
                  hover:bg-[#0284c7]
                "
              >
                <FileText
                  size={14}
                />

                Obrigações
              </Link>
            </div>
          </div>
        </div>

        {/* ==================================================
            ERRO
        ================================================== */}

        {error && (
          <div
            className="
              mb-6
              rounded-2xl
              border
              border-red-200
              bg-red-50
              px-5
              py-4
            "
          >
            <div
              className="
                flex
                items-start
                gap-3
              "
            >
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p
                  className="
                    text-[12px]
                    font-bold
                    text-red-700
                  "
                >
                  Não foi possível carregar os dados fiscais.
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-red-600
                  "
                >
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            RESUMO FISCAL
        ================================================== */}

        <div
          className="
            mb-6
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          <DashboardStat
            title="Obrigações pendentes"
            value={
              dashboard.pendingObligations
            }
            description={
              pendingAmount > 0
                ? `Valor pendente: ${formatCurrency(
                    pendingAmount,
                  )}`
                : 'Não existem valores pendentes'
            }
            type="blue"
            icon="clipboard"
          />

          <DashboardStat
            title="Próximos prazos"
            value={
              dashboard.upcomingDeadlines
            }
            description={
              dashboard.upcomingDeadlines >
              0
                ? 'Obrigações a vencer'
                : 'Não existem prazos próximos'
            }
            type="orange"
            icon="calendar"
          />

          <DashboardStat
            title="Obrigações vencidas"
            value={
              overdueCount
            }
            description={
              overdueCount >
              0
                ? 'Necessitam de regularização'
                : 'Nenhuma obrigação vencida'
            }
            type={
              overdueCount >
              0
                ? 'red'
                : 'green'
            }
            icon="warning"
          />

          <DashboardStat
            title="Pagamentos fiscais"
            value={
              formatCurrency(
                totalPayments,
              )
            }
            description={
              totalPayments >
              0
                ? 'Pagamentos registados'
                : 'Nenhum pagamento registado'
            }
            type="green"
            icon="payment"
          />

        </div>

        {/* ==================================================
            CALENDÁRIO FISCAL
        ================================================== */}

        <section
          className="mb-6"
        >
          <div
            className="
              mb-3
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <CalendarDays
                  size={18}
                  className="text-[#0ea5e9]"
                />

                <h2
                  className="
                    text-[16px]
                    font-bold
                    text-[#111b3b]
                  "
                >
                  Calendário Fiscal
                </h2>
              </div>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#7b87a1]
                "
              >
                Prazos fiscais aplicáveis ao regime da empresa
              </p>
            </div>

            <div
              className="
                inline-flex
                items-center
                gap-2
                self-start
                rounded-lg
                border
                border-[#e1e8f0]
                bg-white
                px-3
                py-2
                sm:self-auto
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-500
                "
              />

              <span
                className="
                  text-[10px]
                  font-semibold
                  text-[#526080]
                "
              >
                {regime}
              </span>
            </div>
          </div>

          <div
            className="
              overflow-hidden
              rounded-2xl
            "
          >
            <CalendarFiscal
              deadlines={
                dashboard.deadlines
              }
            />
          </div>
        </section>

        {/* ==================================================
            ALERTAS
        ================================================== */}

        {dashboard.alerts.length >
          0 && (
          <section
            className="mb-6"
          >
            <div className="mb-3">
              <h2
                className="
                  text-[16px]
                  font-bold
                  text-[#111b3b]
                "
              >
                Situação fiscal
              </h2>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#7b87a1]
                "
              >
                Obrigações que requerem atenção
              </p>
            </div>

            <Alerts
              alerts={
                dashboard.alerts
              }
            />
          </section>
        )}

        {/* ==================================================
            DADOS FISCAIS
        ================================================== */}

        <div
          className="
            mb-6
            grid
            grid-cols-1
            gap-5
            xl:grid-cols-3
          "
        >

          {/* IMPOSTOS */}

          <FiscalSummary
            taxes={
              dashboard.taxes
            }
          />

          {/* PAGAMENTOS */}

          <PaymentEvolution
            payments={
              dashboard.payments
            }
          />

          {/* ACÇÕES */}

          <QuickActions />

        </div>

        {/* ==================================================
            RESUMO FINANCEIRO
        ================================================== */}

        <section
          className="
            mb-6
            rounded-2xl
            border
            border-[#e5e9f0]
            bg-white
            p-5
            shadow-sm
            sm:p-6
          "
        >
          <div
            className="
              mb-5
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-[#f3f6fa]
                text-[#526080]
              "
            >
              <ReceiptText
                size={19}
              />
            </div>

            <div>
              <h2
                className="
                  text-[15px]
                  font-bold
                  text-[#111b3b]
                "
              >
                Resumo fiscal
              </h2>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-[#7b87a1]
                "
              >
                Dados registados no sistema para esta empresa
              </p>
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              sm:grid-cols-3
            "
          >

            <InfoValue
              label="Facturação registada"
              value={
                formatCurrency(
                  totalRevenue,
                )
              }
            />

            <InfoValue
              label="Impostos registados"
              value={
                formatCurrency(
                  totalTaxes,
                )
              }
            />

            <InfoValue
              label="Pagamentos fiscais"
              value={
                formatCurrency(
                  totalPayments,
                )
              }
            />

          </div>
        </section>

        {/* ==================================================
            INFORMAÇÃO DO SISTEMA
        ================================================== */}

        <div
          className="
            flex
            flex-col
            items-start
            justify-between
            gap-4
            rounded-2xl
            border
            border-[#e5e9f0]
            bg-[#fbfcfe]
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:px-6
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-white
                text-[#526080]
                shadow-sm
              "
            >
              <ShieldCheck
                size={17}
              />
            </div>

            <div>
              <p
                className="
                  text-[11px]
                  font-semibold
                  text-[#344361]
                "
              >
                Fiscalidade Digital
              </p>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  text-[#8a96b0]
                "
              >
                Dados apresentados com base nos registos fiscais da empresa.
              </p>
            </div>
          </div>

          <Link
            href="/obligations"
            className="
              flex
              items-center
              gap-2
              text-[10px]
              font-bold
              text-[#0ea5e9]
              transition
              hover:text-[#0284c7]
            "
          >
            Consultar obrigações

            <ArrowRight
              size={13}
            />
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
}

// ============================================================
// CARD DE INDICADOR
// ============================================================

function DashboardStat({
  title,
  value,
  description,
  type,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;

  type:
    | 'blue'
    | 'orange'
    | 'green'
    | 'red';

  icon:
    | 'clipboard'
    | 'calendar'
    | 'warning'
    | 'payment';
}) {
  const styles = {
    blue: {
      border:
        'border-[#d5e8f7]',
      bg:
        'bg-[#eff8ff]',
      text:
        'text-[#0284c7]',
    },

    orange: {
      border:
        'border-[#f7dfc4]',
      bg:
        'bg-[#fff7ed]',
      text:
        'text-[#ea580c]',
    },

    green: {
      border:
        'border-[#cfeee0]',
      bg:
        'bg-[#ecfdf5]',
      text:
        'text-[#059669]',
    },

    red: {
      border:
        'border-[#f4d3d3]',
      bg:
        'bg-[#fff1f2]',
      text:
        'text-[#dc2626]',
    },
  };

  const style =
    styles[type];

  const Icon =
    icon ===
    'clipboard'
      ? ClipboardList
      : icon ===
          'calendar'
        ? CalendarDays
        : icon ===
            'warning'
          ? ShieldCheck
          : TrendingUp;

  return (
    <div
      className={`
        flex
        min-h-[126px]
        items-center
        justify-between
        rounded-2xl
        border
        bg-white
        p-5
        shadow-sm
        transition
        hover:shadow-md
        ${style.border}
      `}
    >
      <div
        className="
          min-w-0
        "
      >
        <p
          className="
            text-[10px]
            font-semibold
            uppercase
            tracking-wide
            text-[#8a96b0]
          "
        >
          {title}
        </p>

        <h2
          className="
            mt-2
            truncate
            text-[23px]
            font-extrabold
            tracking-tight
            text-[#111b3b]
          "
        >
          {value}
        </h2>

        <p
          className={`
            mt-2
            text-[10px]
            font-semibold
            ${style.text}
          `}
        >
          {description}
        </p>
      </div>

      <div
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${style.bg}
          ${style.text}
        `}
      >
        <Icon
          size={20}
          strokeWidth={1.9}
        />
      </div>
    </div>
  );
}

// ============================================================
// VALOR INFORMATIVO
// ============================================================

function InfoValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-[#edf0f5]
        bg-[#fafbfc]
        px-4
        py-4
      "
    >
      <p
        className="
          text-[10px]
          font-medium
          text-[#8a96b0]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          text-[15px]
          font-bold
          text-[#25365f]
        "
      >
        {value}
      </p>
    </div>
  );
}