'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';
import api from '@/services/api';

/*
 * ==========================================================
 * TIPOS
 * ==========================================================
 */

interface Company {
  id?: string;
  name: string;
  nif: string;
  regime?: string;
  sector?: string;
}

type PaymentStatus =
  | 'PAID'
  | 'PENDING'
  | 'OVERDUE'
  | 'FAILED';

interface Payment {
  id: string;
  reference: string;
  description: string;
  tax?: string;
  amount: number;
  date: string;
  status: PaymentStatus;
}

interface MonthlyPayment {
  month: string;
  value: number;
}

/*
 * ==========================================================
 * ESTADO VAZIO
 * ==========================================================
 */

const EMPTY_COMPANY: Company = {
  name: '',
  nif: '',
  regime: '',
  sector: '',
};

const EMPTY_PAYMENTS: Payment[] = [];

const MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/*
 * ==========================================================
 * HELPERS
 * ==========================================================
 */

function toNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(
    'pt-AO',
    {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    },
  ).format(toNumber(value));
}

function formatDate(value: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    'pt-AO',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}

function getMessage(error: any): string {
  if (error?.response?.status === 401) {
    return 'Sessão expirada. Faça login novamente.';
  }

  if (error?.response?.status === 403) {
    return 'Não tem autorização para consultar os pagamentos.';
  }

  const serverMessage =
    error?.response?.data?.message;

  if (Array.isArray(serverMessage)) {
    return serverMessage.join(', ');
  }

  if (serverMessage) {
    return String(serverMessage);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível carregar os pagamentos.';
}

function normalizeStatus(
  value: unknown,
): PaymentStatus {
  const status =
    String(value || '')
      .trim()
      .toUpperCase();

  if (
    status === 'PAID' ||
    status === 'PAGO' ||
    status === 'COMPLETED' ||
    status === 'SUCCESS'
  ) {
    return 'PAID';
  }

  if (
    status === 'OVERDUE' ||
    status === 'ATRASADO' ||
    status === 'VENCIDO'
  ) {
    return 'OVERDUE';
  }

  if (
    status === 'FAILED' ||
    status === 'FALHADO' ||
    status === 'CANCELLED' ||
    status === 'CANCELED'
  ) {
    return 'FAILED';
  }

  return 'PENDING';
}

function normalizePayment(
  item: any,
  index: number,
): Payment {
  return {
    id: String(
      item?.id ??
        item?.paymentId ??
        `payment-${index}`,
    ),

    reference:
      item?.reference ??
      item?.code ??
      item?.number ??
      item?.documentNumber ??
      '—',

    description:
      item?.description ??
      item?.taxName ??
      item?.type ??
      'Pagamento fiscal',

    tax:
      item?.tax ??
      item?.taxType ??
      item?.taxName ??
      undefined,

    amount: toNumber(
      item?.amount ??
        item?.value ??
        item?.total ??
        item?.totalAmount,
    ),

    date:
      item?.date ??
      item?.paymentDate ??
      item?.paidAt ??
      item?.createdAt ??
      '',

    status: normalizeStatus(
      item?.status ??
        item?.paymentStatus,
    ),
  };
}

/*
 * ==========================================================
 * DADOS MENSAIS
 * ==========================================================
 *
 * A evolução vem diretamente de GET /payments/evolution.
 * Quando o backend não devolver dados, os meses permanecem
 * em 0. Não criamos valores fictícios.
 * ==========================================================
 */

function normalizeMonthlyPayments(
  data: any,
): MonthlyPayment[] {
  const source =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.evolution)
        ? data.evolution
        : Array.isArray(data?.payments)
          ? data.payments
          : Array.isArray(data?.data)
            ? data.data
            : [];

  const totals =
    MONTHS.map(
      (month) => ({
        month,
        value: 0,
      }),
    );

  for (const item of source) {
    const rawMonth =
      item?.month ??
      item?.mes ??
      item?.monthNumber ??
      item?.monthIndex;

    const rawValue =
      item?.value ??
      item?.amount ??
      item?.total ??
      item?.totalAmount ??
      0;

    let monthIndex = -1;

    if (typeof rawMonth === 'number') {
      monthIndex =
        rawMonth >= 1 && rawMonth <= 12
          ? rawMonth - 1
          : rawMonth >= 0 && rawMonth < 12
            ? rawMonth
            : -1;
    } else {
      const monthText =
        String(rawMonth || '')
          .trim()
          .toLowerCase();

      const aliases: Record<string, number> = {
        jan: 0,
        janeiro: 0,
        feb: 1,
        fev: 1,
        fevereiro: 1,
        mar: 2,
        março: 2,
        marco: 2,
        apr: 3,
        abr: 3,
        abril: 3,
        may: 4,
        mai: 4,
        maio: 4,
        jun: 5,
        junho: 5,
        jul: 6,
        julho: 6,
        aug: 7,
        ago: 7,
        agosto: 7,
        sep: 8,
        set: 8,
        setembro: 8,
        oct: 9,
        out: 9,
        outubro: 9,
        nov: 10,
        novembro: 10,
        dec: 11,
        dez: 11,
        dezembro: 11,
      };

      if (monthText in aliases) {
        monthIndex = aliases[monthText];
      } else {
        const numericMonth =
          Number(monthText);

        if (
          Number.isFinite(numericMonth) &&
          numericMonth >= 1 &&
          numericMonth <= 12
        ) {
          monthIndex =
            numericMonth - 1;
        }
      }
    }

    if (
      monthIndex >= 0 &&
      monthIndex < 12
    ) {
      totals[monthIndex].value +=
        toNumber(rawValue);
    }
  }

  return totals;
}

function getSummaryNumber(
  summary: any,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = summary?.[key];

    if (
      value !== undefined &&
      value !== null &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
}

function getSummaryCount(
  summary: any,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = summary?.[key];

    if (
      value !== undefined &&
      value !== null &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return 0;
}
/*
 * ==========================================================
 * PÁGINA
 * ==========================================================
 */

export default function PaymentsPage() {
  const [
    company,
    setCompany,
  ] = useState<Company>(
    EMPTY_COMPANY,
  );

  const [
    payments,
    setPayments,
  ] = useState<Payment[]>(
    EMPTY_PAYMENTS,
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
    summary,
    setSummary,
  ] = useState<any | null>(null);

  const [
    monthlyPayments,
    setMonthlyPayments,
  ] = useState<MonthlyPayment[]>(
    MONTHS.map((month) => ({
      month,
      value: 0,
    })),
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    'ALL' | PaymentStatus
  >('ALL');

  /*
   * ========================================================
   * CARREGAR EMPRESA + PAGAMENTOS
   * ========================================================
   */

  async function fetchPayments(
    showRefresh = false,
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      /*
       * Empresa autenticada.
       *
       * O backend deve resolver o tenant através
       * do JWT. Não enviamos tenantId pelo frontend.
       */

      const companyData =
        await getCompany();

      setCompany({
        id:
          companyData?.id,

        name:
          companyData?.name ||
          'Empresa',

        nif:
          companyData?.nif ||
          '—',

        regime:
          companyData?.regime ||
          'GERAL',

        sector:
          companyData?.sector ||
          '—',
      });

      /*
       * ====================================================
       * PAGAMENTOS REAIS
       * ====================================================
       *
       * GET /payments
       * GET /payments/summary
       * GET /payments/evolution
       *
       * O tenant não é enviado pelo frontend.
       * O backend resolve a empresa através do JWT.
       */

      const [
        paymentsResult,
        summaryResult,
        evolutionResult,
      ] = await Promise.allSettled([
        api.get('/payments'),
        api.get('/payments/summary'),
        api.get(
          `/payments/evolution?year=${new Date().getFullYear()}`,
        ),
      ]);

      if (
        paymentsResult.status ===
        'fulfilled'
      ) {
        const response =
          paymentsResult.value;

        const rawData =
          Array.isArray(
            response?.data,
          )
            ? response.data
            : Array.isArray(
                response?.data?.payments,
              )
              ? response.data.payments
              : Array.isArray(
                  response?.data?.data,
                )
                ? response.data.data
                : [];

        const normalized =
          rawData.map(
            (
              item: any,
              index: number,
            ) =>
              normalizePayment(
                item,
                index,
              ),
          );

        setPayments(
          normalized,
        );
      } else {
        console.warn(
          'Não foi possível carregar a lista de pagamentos:',
          paymentsResult.reason,
        );

        setPayments(
          EMPTY_PAYMENTS,
        );
      }

      if (
        summaryResult.status ===
        'fulfilled'
      ) {
        const data =
          summaryResult.value?.data;

        setSummary(
          data?.summary ??
            data?.data ??
            data ??
            null,
        );
      } else {
        console.warn(
          'Não foi possível carregar o resumo dos pagamentos:',
          summaryResult.reason,
        );

        setSummary(null);
      }

      if (
        evolutionResult.status ===
        'fulfilled'
      ) {
        const data =
          evolutionResult.value?.data;

        setMonthlyPayments(
          normalizeMonthlyPayments(
            data,
          ),
        );
      } else {
        console.warn(
          'Não foi possível carregar a evolução dos pagamentos:',
          evolutionResult.reason,
        );

        setMonthlyPayments(
          MONTHS.map(
            (month) => ({
              month,
              value: 0,
            }),
          ),
        );
      }
    } catch (error: any) {
      console.error(
        'Erro ao carregar pagamentos:',
        error,
      );

      setError(
        getMessage(error),
      );

      setPayments(
        EMPTY_PAYMENTS,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  /*
   * ========================================================
   * FILTROS
   * ========================================================
   */

  const filteredPayments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {
          const matchesSearch =
            !query ||
            payment.reference
              .toLowerCase()
              .includes(query) ||
            payment.description
              .toLowerCase()
              .includes(query) ||
            String(
              payment.tax || '',
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              'ALL' ||
            payment.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      payments,
      search,
      statusFilter,
    ]);

  /*
   * ========================================================
   * ESTATÍSTICAS
   * ========================================================
   */

  const statistics =
    useMemo(() => {
      const paid =
        payments.filter(
          (payment) =>
            payment.status ===
            'PAID',
        );

      const paidValueFromList =
        paid.reduce(
          (sum, payment) =>
            sum +
            payment.amount,
          0,
        );

      const paidValue =
        getSummaryNumber(
          summary,
          'totalPaid',
          'paidTotal',
          'total',
          'totalAmount',
        ) ||
        paidValueFromList;

      const pendingValue =
        getSummaryNumber(
          summary,
          'totalPending',
          'pendingAmount',
          'pendingTotal',
          'outstanding',
        );

      const overdueValue =
        getSummaryNumber(
          summary,
          'totalOverdue',
          'overdueAmount',
          'overdueTotal',
          'lateAmount',
        );

      const pendingCount =
        getSummaryCount(
          summary,
          'pendingCount',
          'outstandingCount',
          'pending',
        );

      const overdueCount =
        getSummaryCount(
          summary,
          'overdueCount',
          'lateCount',
          'overdue',
        );

      const paidCount =
        getSummaryCount(
          summary,
          'paidCount',
          'paymentsCount',
        ) || paid.length;

      const backendPercentage =
        getSummaryNumber(
          summary,
          'onTimePercentage',
          'paymentOnTimePercentage',
          'onTime',
        );

      const totalCount =
        paidCount +
        pendingCount +
        overdueCount;

      const onTimePercentage =
        backendPercentage > 0
          ? Math.round(
              backendPercentage,
            )
          : totalCount > 0
            ? Math.round(
                (paidCount /
                  totalCount) *
                  100,
              )
            : 0;

      return {
        paidCount,
        pendingCount,
        overdueCount,
        paidValue,
        pendingValue,
        overdueValue,
        onTimePercentage,
      };
    }, [
      payments,
      summary,
    ]);

  /*
   * ========================================================
   * EVOLUÇÃO
   * ========================================================
   */

  /*
   * ========================================================
   * LOADING
   * ========================================================
   */

  if (loading) {
    return (
      <DashboardLayout
        company={company}
      >
        <div
          className="
            min-h-[700px]
            bg-[#fafbfe]
            flex
            items-center
            justify-center
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
                h-10
                w-10
                animate-spin
                rounded-full
                border-4
                border-slate-200
                border-t-[#5146e5]
              "
            />

            <p
              className="
                text-sm
                text-slate-500
              "
            >
              A carregar pagamentos...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /*
   * ========================================================
   * RENDER
   * ========================================================
   */

  return (
    <DashboardLayout
      company={company}
    >
      <div
        className="
          min-h-full
          bg-[#fafbfe]
          px-3
          pb-10
          sm:px-4
          lg:px-6
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1600px]
          "
        >
          {/* ==================================================
              CABEÇALHO
          ================================================== */}

          <div
            className="
              mb-6
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  mb-2
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
                    text-[#7b87a1]
                  "
                >
                  Gestão financeira
                </span>
              </div>

              <h1
                className="
                  text-[25px]
                  font-extrabold
                  tracking-tight
                  text-[#111b3b]
                  sm:text-[29px]
                "
              >
                Pagamentos
              </h1>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-[#7b87a1]
                "
              >
                Acompanhe a evolução dos pagamentos fiscais da empresa.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                fetchPayments(
                  true,
                )
              }
              disabled={
                refreshing
              }
              className="
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                self-start
                rounded-xl
                border
                border-[#e4e7ef]
                bg-white
                px-4
                text-[11px]
                font-bold
                text-[#526080]
                shadow-sm
                transition
                hover:bg-[#f7f8fc]
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:self-auto
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

              Atualizar
            </button>
          </div>

          {/* ==================================================
              ERRO
          ================================================== */}

          {error && (
            <div
              className="
                mb-6
                flex
                flex-col
                gap-3
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-5
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-[12px]
                    font-bold
                    text-red-700
                  "
                >
                  Não foi possível carregar os pagamentos.
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-red-600
                  "
                >
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  fetchPayments(
                    true,
                  )
                }
                className="
                  h-9
                  rounded-lg
                  bg-red-600
                  px-4
                  text-[10px]
                  font-bold
                  text-white
                  hover:bg-red-700
                "
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* ==================================================
              CARDS
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
            <PaymentStat
              title="Total pago"
              value={formatCurrency(
                statistics.paidValue,
              )}
              description={`${statistics.paidCount} pagamentos concluídos`}
              icon={
                <CheckCircle2
                  size={20}
                />
              }
              type="green"
            />

            <PaymentStat
              title="Pendentes"
              value={formatCurrency(
                statistics.pendingValue,
              )}
              description={`${statistics.pendingCount} pagamentos pendentes`}
              icon={
                <Clock3
                  size={20}
                />
              }
              type="orange"
            />

            <PaymentStat
              title="Em atraso"
              value={formatCurrency(
                statistics.overdueValue,
              )}
              description={`${statistics.overdueCount} pagamentos em atraso`}
              icon={
                <ArrowDownRight
                  size={20}
                />
              }
              type="red"
            />

            <PaymentStat
              title="Pagamentos em dia"
              value={`${statistics.onTimePercentage}%`}
              description={
                statistics.onTimePercentage >=
                90
                  ? 'Excelente desempenho'
                  : statistics.onTimePercentage > 0
                    ? 'Acompanhe os prazos'
                    : 'Sem pagamentos registados'
              }
              icon={
                <TrendingUp
                  size={20}
                />
              }
              type="purple"
            />
          </div>

          {/* ==================================================
              PAYMENT EVOLUTION
          ================================================== */}

          <section
            className="
              mb-6
              rounded-3xl
              border
              border-[#e8ebf3]
              bg-white
              p-5
              shadow-sm
              sm:p-6
            "
          >
            <div
              className="
                mb-6
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-center
                sm:justify-between
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
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#f0edff]
                    text-[#5146e5]
                  "
                >
                  <TrendingUp
                    size={20}
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
                    Payment Evolution
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-[10px]
                      text-[#8a96b0]
                    "
                  >
                    Evolução real dos pagamentos fiscais em {new Date().getFullYear()}
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  rounded-lg
                  bg-[#f7f8fc]
                  px-3
                  py-2
                "
              >
                <CalendarDays
                  size={13}
                  className="text-[#5146e5]"
                />

                <span
                  className="
                    text-[10px]
                    font-semibold
                    text-[#526080]
                  "
                >
                  Este ano
                </span>
              </div>
            </div>

            <div
              className="h-[320px]"
            >
              {monthlyPayments.every(
                (item) =>
                  item.value === 0,
              ) ? (
                <EmptyState
                  icon={
                    <TrendingUp
                      size={23}
                    />
                  }
                  title="Sem dados de pagamentos"
                  description="A evolução aparecerá aqui quando existirem pagamentos registados."
                />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={
                      monthlyPayments
                    }
                    margin={{
                      top: 10,
                      right: 15,
                      left: 0,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 5"
                      vertical={false}
                      stroke="#edf0f5"
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize: 10,
                        fill: '#8a96b0',
                      }}
                    />

                    <YAxis
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                      tick={{
                        fontSize: 9,
                        fill: '#8a96b0',
                      }}
                      tickFormatter={(
                        value,
                      ) => {
                        const number =
                          Number(
                            value,
                          );

                        if (
                          number >=
                          1000000
                        ) {
                          return `${(
                            number /
                            1000000
                          ).toFixed(
                            1,
                          )}M`;
                        }

                        if (
                          number >=
                          1000
                        ) {
                          return `${(
                            number /
                            1000
                          ).toFixed(
                            0,
                          )}K`;
                        }

                        return String(
                          number,
                        );
                      }}
                    />

                    <Tooltip
                      cursor={{
                        stroke:
                          '#dcd9ff',
                        strokeWidth: 1,
                      }}
                      contentStyle={{
                        borderRadius:
                          '12px',
                        border:
                          '1px solid #e8ebf3',
                        boxShadow:
                          '0 8px 25px rgba(15, 27, 61, 0.08)',
                        fontSize:
                          '11px',
                      }}
                      formatter={(
                        value,
                      ) =>
                        formatCurrency(
                          Number(
                            value ??
                              0,
                          ),
                        )
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Pagamentos"
                      stroke="#5146e5"
                      strokeWidth={
                        3
                      }
                      dot={{
                        r: 4,
                        fill:
                          '#5146e5',
                        strokeWidth:
                          2,
                        stroke:
                          '#ffffff',
                      }}
                      activeDot={{
                        r: 6,
                        fill:
                          '#5146e5',
                        stroke:
                          '#ffffff',
                        strokeWidth:
                          3,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* ==================================================
              PAGAMENTOS RECENTES
          ================================================== */}

          <section
            className="
              rounded-3xl
              border
              border-[#e8ebf3]
              bg-white
              shadow-sm
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                border-b
                border-[#edf0f5]
                p-5
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:p-6
              "
            >
              <div>
                <h2
                  className="
                    text-[15px]
                    font-bold
                    text-[#111b3b]
                  "
                >
                  Pagamentos recentes
                </h2>

                <p
                  className="
                    mt-1
                    text-[10px]
                    text-[#8a96b0]
                  "
                >
                  Histórico dos pagamentos fiscais da empresa
                </p>
              </div>

              <div
                className="
                  flex
                  w-full
                  flex-col
                  gap-2
                  sm:w-auto
                  sm:flex-row
                "
              >
                <div
                  className="
                    relative
                    w-full
                    sm:w-[220px]
                  "
                >
                  <Search
                    size={14}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-[#9aa4b8]
                    "
                  />

                  <input
                    value={search}
                    onChange={(
                      event,
                    ) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Pesquisar pagamento..."
                    className="
                      h-9
                      w-full
                      rounded-lg
                      border
                      border-[#e4e7ef]
                      bg-white
                      pl-9
                      pr-3
                      text-[10px]
                      text-[#344361]
                      outline-none
                      placeholder:text-[#a3acc0]
                      focus:border-[#b9b3ff]
                      focus:ring-2
                      focus:ring-[#5146e5]/10
                    "
                  />
                </div>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setStatusFilter(
                      event.target
                        .value as
                        | 'ALL'
                        | PaymentStatus,
                    )
                  }
                  className="
                    h-9
                    rounded-lg
                    border
                    border-[#e4e7ef]
                    bg-white
                    px-3
                    text-[10px]
                    font-semibold
                    text-[#526080]
                    outline-none
                    focus:border-[#b9b3ff]
                  "
                >
                  <option value="ALL">
                    Todos
                  </option>

                  <option value="PAID">
                    Pagos
                  </option>

                  <option value="PENDING">
                    Pendentes
                  </option>

                  <option value="OVERDUE">
                    Em atraso
                  </option>

                  <option value="FAILED">
                    Falhados
                  </option>
                </select>
              </div>
            </div>

            {filteredPayments.length ===
            0 ? (
              <div
                className="p-6"
              >
                <EmptyState
                  icon={
                    <CreditCard
                      size={23}
                    />
                  }
                  title={
                    payments.length ===
                    0
                      ? 'Ainda não existem pagamentos'
                      : 'Nenhum pagamento encontrado'
                  }
                  description={
                    payments.length ===
                    0
                      ? 'Quando a empresa efetuar pagamentos fiscais, eles aparecerão nesta área.'
                      : 'Tente alterar a pesquisa ou o filtro selecionado.'
                  }
                />
              </div>
            ) : (
              <>
                {/* DESKTOP */}

                <div
                  className="
                    hidden
                    overflow-x-auto
                    md:block
                  "
                >
                  <table
                    className="
                      w-full
                      min-w-[800px]
                    "
                  >
                    <thead>
                      <tr
                        className="
                          border-b
                          border-[#edf0f5]
                          bg-[#fafbfe]
                        "
                      >
                        <TableHead>
                          Referência
                        </TableHead>

                        <TableHead>
                          Descrição
                        </TableHead>

                        <TableHead>
                          Imposto
                        </TableHead>

                        <TableHead>
                          Data
                        </TableHead>

                        <TableHead align="right">
                          Valor
                        </TableHead>

                        <TableHead>
                          Estado
                        </TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPayments.map(
                        (
                          payment,
                        ) => (
                          <tr
                            key={
                              payment.id
                            }
                            className="
                              border-b
                              border-[#f0f2f6]
                              transition
                              last:border-0
                              hover:bg-[#fafbfe]
                            "
                          >
                            <td className="px-5 py-4">
                              <div
                                className="
                                  flex
                                  items-center
                                  gap-2.5
                                "
                              >
                                <div
                                  className="
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-[#f0edff]
                                    text-[#5146e5]
                                  "
                                >
                                  <FileText
                                    size={
                                      14
                                    }
                                  />
                                </div>

                                <span
                                  className="
                                    text-[10px]
                                    font-bold
                                    text-[#344361]
                                  "
                                >
                                  {
                                    payment.reference
                                  }
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className="
                                  text-[10px]
                                  font-semibold
                                  text-[#526080]
                                "
                              >
                                {
                                  payment.description
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className="
                                  text-[10px]
                                  text-[#7b87a1]
                                "
                              >
                                {payment.tax ||
                                  '—'}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className="
                                  text-[10px]
                                  text-[#7b87a1]
                                "
                              >
                                {formatDate(
                                  payment.date,
                                )}
                              </span>
                            </td>

                            <td
                              className="
                                px-5
                                py-4
                                text-right
                              "
                            >
                              <span
                                className="
                                  text-[10px]
                                  font-bold
                                  text-[#25365f]
                                "
                              >
                                {formatCurrency(
                                  payment.amount,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <PaymentStatusBadge
                                status={
                                  payment.status
                                }
                              />
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}

                <div
                  className="
                    divide-y
                    divide-[#edf0f5]
                    md:hidden
                  "
                >
                  {filteredPayments.map(
                    (
                      payment,
                    ) => (
                      <div
                        key={
                          payment.id
                        }
                        className="
                          p-5
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-4
                          "
                        >
                          <div
                            className="
                              flex
                              min-w-0
                              items-center
                              gap-3
                            "
                          >
                            <div
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                bg-[#f0edff]
                                text-[#5146e5]
                              "
                            >
                              <FileText
                                size={
                                  15
                                }
                              />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="
                                  truncate
                                  text-[11px]
                                  font-bold
                                  text-[#344361]
                                "
                              >
                                {
                                  payment.reference
                                }
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-[9px]
                                  text-[#8a96b0]
                                "
                              >
                                {
                                  payment.description
                                }
                              </p>
                            </div>
                          </div>

                          <PaymentStatusBadge
                            status={
                              payment.status
                            }
                          />
                        </div>

                        <div
                          className="
                            mt-4
                            grid
                            grid-cols-2
                            gap-3
                          "
                        >
                          <PaymentDetail
                            label="Imposto"
                            value={
                              payment.tax ||
                              '—'
                            }
                          />

                          <PaymentDetail
                            label="Data"
                            value={formatDate(
                              payment.date,
                            )}
                          />

                          <PaymentDetail
                            label="Valor"
                            value={formatCurrency(
                              payment.amount,
                            )}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

/*
 * ==========================================================
 * CARD DE ESTATÍSTICA
 * ==========================================================
 */

function PaymentStat({
  title,
  value,
  description,
  icon,
  type,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  type:
    | 'green'
    | 'orange'
    | 'red'
    | 'purple';
}) {
  const styles = {
    green: {
      border:
        'border-[#c9f2df]',
      bg:
        'bg-[#ecfdf5]',
      text:
        'text-[#059669]',
    },

    orange: {
      border:
        'border-[#fedfbe]',
      bg:
        'bg-[#fff7ed]',
      text:
        'text-[#ea580c]',
    },

    red: {
      border:
        'border-[#fecaca]',
      bg:
        'bg-[#fef2f2]',
      text:
        'text-[#dc2626]',
    },

    purple: {
      border:
        'border-[#dcd9ff]',
      bg:
        'bg-[#f0edff]',
      text:
        'text-[#5146e5]',
    },
  };

  const style =
    styles[type];

  return (
    <div
      className={`
        flex
        min-h-[128px]
        items-center
        justify-between
        gap-4
        rounded-2xl
        border
        bg-white
        p-5
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
        ${style.border}
      `}
    >
      <div className="min-w-0">
        <p
          className="
            text-[9px]
            font-bold
            uppercase
            tracking-wider
            text-[#8a96b0]
          "
        >
          {title}
        </p>

        <h3
          className="
            mt-2
            truncate
            text-[20px]
            font-extrabold
            tracking-tight
            text-[#111b3b]
          "
        >
          {value}
        </h3>

        <p
          className={`
            mt-2
            truncate
            text-[9px]
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
        {icon}
      </div>
    </div>
  );
}

/*
 * ==========================================================
 * ESTADO VAZIO
 * ==========================================================
 */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        flex
        h-full
        min-h-[180px]
        flex-col
        items-center
        justify-center
        rounded-2xl
        border
        border-dashed
        border-[#dfe4ed]
        bg-[#fbfcfe]
        px-6
        text-center
      "
    >
      <div
        className="
          mb-3
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-xl
          bg-[#f0edff]
          text-[#5146e5]
        "
      >
        {icon}
      </div>

      <p
        className="
          text-[12px]
          font-bold
          text-[#526080]
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          max-w-[400px]
          text-[10px]
          leading-5
          text-[#8a96b0]
        "
      >
        {description}
      </p>
    </div>
  );
}

/*
 * ==========================================================
 * CABEÇALHO DA TABELA
 * ==========================================================
 */

function TableHead({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`
        px-5
        py-3
        text-[9px]
        font-bold
        uppercase
        tracking-wider
        text-[#8a96b0]
        ${
          align === 'right'
            ? 'text-right'
            : 'text-left'
        }
      `}
    >
      {children}
    </th>
  );
}

/*
 * ==========================================================
 * STATUS
 * ==========================================================
 */

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const config = {
    PAID: {
      label: 'Pago',
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: (
        <CheckCircle2
          size={11}
        />
      ),
    },

    PENDING: {
      label: 'Pendente',
      className:
        'bg-amber-50 text-amber-700 border-amber-100',
      icon: (
        <Clock3
          size={11}
        />
      ),
    },

    OVERDUE: {
      label: 'Em atraso',
      className:
        'bg-red-50 text-red-700 border-red-100',
      icon: (
        <ArrowDownRight
          size={11}
        />
      ),
    },

    FAILED: {
      label: 'Falhado',
      className:
        'bg-slate-100 text-slate-600 border-slate-200',
      icon: (
        <XCircle
          size={11}
        />
      ),
    },
  };

  const item =
    config[status];

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1.5
        text-[9px]
        font-bold
        ${item.className}
      `}
    >
      {item.icon}

      {item.label}
    </span>
  );
}

/*
 * ==========================================================
 * DETALHE MOBILE
 * ==========================================================
 */

function PaymentDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span
        className="
          block
          text-[8px]
          font-semibold
          uppercase
          tracking-wider
          text-[#9aa4b8]
        "
      >
        {label}
      </span>

      <span
        className="
          mt-1
          block
          truncate
          text-[10px]
          font-semibold
          text-[#526080]
        "
      >
        {value}
      </span>
    </div>
  );
}