'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import api from '@/services/api';

// =====================================================
// TIPOS
// =====================================================

type FiscalRegime =
  | 'GERAL'
  | 'SIMPLIFICADO'
  | 'PRESTADOR_SERVICO';

type TaxType =
  | 'IVA'
  | 'IRT'
  | 'INDUSTRIAL'
  | 'SELO'
  | 'SS';

type ObligationType =
  | 'IVA'
  | 'IRT'
  | 'II'
  | 'SS'
  | 'DECLARACAO';

type FiscalCalendarRegime = {
  id?: string;
  calendarId?: string;
  regime: FiscalRegime | string;
};

type FiscalCalendarItem = {
  id: string;
  code?: string | null;
  title: string;
  description?: string | null;
  taxType?: TaxType | string | null;
  obligationType?: ObligationType | string | null;
  period?: string | null;
  referenceYear: number;
  dueDate: string;
  officialReference?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  active: boolean;
  regimes?: FiscalCalendarRegime[];
  obligations?: FiscalObligation[];
};

type FiscalObligation = {
  id: string;
  tenantId: string;
  fiscalCalendarId?: string | null;
  type: string;
  title: string;
  description?: string | null;
  amount?: number | null;
  dueDate: string;
  period?: string | null;
  status?: 'PENDING' | 'PAID' | 'LATE' | string;
};

type Company = {
  id?: string;
  name?: string;
  nif?: string;
  regime?: string;
};

type MonthData = {
  date: Date;
  day: number;
  currentMonth: boolean;
  items: FiscalCalendarItem[];
};

// =====================================================
// CONSTANTES
// =====================================================

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAYS = [
  'SEG',
  'TER',
  'QUA',
  'QUI',
  'SEX',
  'SÁB',
  'DOM',
];

// =====================================================
// HELPERS
// =====================================================

function parseDate(value: string): Date {
  const datePart = value?.slice(0, 10);

  if (!datePart) {
    return new Date('');
  }

  const [year, month, day] = datePart
    .split('-')
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatDate(
  value: string,
): string {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(
    'pt-PT',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  );
}

function shortDate(
  value: string,
): string {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(
    'pt-PT',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );
}

function getDaysUntil(
  value: string,
): number {
  const target = parseDate(value);

  if (Number.isNaN(target.getTime())) {
    return 0;
  }

  const today = new Date();

  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const diff =
    target.getTime() -
    todayOnly.getTime();

  return Math.ceil(
    diff / 86400000,
  );
}

function getTaxLabel(
  value?: string | null,
): string {
  switch (value) {
    case 'IVA':
      return 'IVA';

    case 'IRT':
      return 'IRT';

    case 'INDUSTRIAL':
      return 'Imposto Industrial';

    case 'SELO':
      return 'Imposto do Selo';

    case 'SS':
      return 'Segurança Social';

    default:
      return value || 'Fiscal';
  }
}

function getObligationLabel(
  value?: string | null,
): string {
  switch (value) {
    case 'IVA':
      return 'IVA';

    case 'IRT':
      return 'IRT';

    case 'II':
      return 'Imposto Industrial';

    case 'SS':
      return 'Segurança Social';

    case 'DECLARACAO':
      return 'Declaração';

    default:
      return value || 'Obrigação fiscal';
  }
}

function getRegimeLabel(
  value?: string,
): string {
  switch (value) {
    case 'GERAL':
      return 'Regime Geral';

    case 'SIMPLIFICADO':
      return 'Regime Simplificado';

    case 'PRESTADOR_SERVICO':
      return 'Prestador de Serviços';

    default:
      return value || '—';
  }
}

function getErrorMessage(
  error: any,
): string {
  if (
    error?.response?.status === 401
  ) {
    return 'A sua sessão expirou. Faça login novamente.';
  }

  if (
    error?.response?.status === 403
  ) {
    return 'Não tem autorização para consultar o calendário fiscal.';
  }

  const message =
    error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (message) {
    return String(message);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível carregar o calendário fiscal.';
}

// =====================================================
// COMPONENTE
// =====================================================

export default function CalendarPage() {
  const today = new Date();

  const [selectedYear, setSelectedYear] =
    useState(
      today.getFullYear(),
    );

  const [selectedMonth, setSelectedMonth] =
    useState(
      today.getMonth(),
    );

  const [calendar, setCalendar] =
    useState<FiscalCalendarItem[]>([]);

  const [company, setCompany] =
    useState<Company | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [taxFilter, setTaxFilter] =
    useState('ALL');

  const [typeFilter, setTypeFilter] =
    useState('ALL');

  const [selectedItem, setSelectedItem] =
    useState<FiscalCalendarItem | null>(
      null,
    );

  // ===================================================
  // CARREGAR CALENDÁRIO
  // ===================================================

  const loadCalendar = useCallback(
    async (
      showRefresh = false,
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const response =
          await api.get(
            '/fiscal-calendar/my',
            {
              params: {
                referenceYear:
                  selectedYear,
              },
            },
          );

        const data =
          Array.isArray(response.data)
            ? response.data
            : Array.isArray(
                response.data?.data,
              )
              ? response.data.data
              : [];

        setCalendar(data);
      } catch (err) {
        console.error(
          'Erro ao carregar calendário fiscal:',
          err,
        );

        setError(
          getErrorMessage(err),
        );

        setCalendar([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedYear],
  );

  // ===================================================
  // CARREGAR EMPRESA
  // ===================================================

  const loadCompany = useCallback(
    async () => {
      try {
        const response =
          await api.get('/company');

        const data =
          response.data?.data ??
          response.data;

        if (data) {
          setCompany(data);
        }
      } catch {
        // A página continua funcional
        // mesmo que o endpoint da empresa
        // não esteja disponível.
      }
    },
    [],
  );

  // ===================================================
  // EFFECTS
  // ===================================================

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  // ===================================================
  // FILTROS
  // ===================================================

  const filteredCalendar =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return calendar.filter(
        (item) => {
          const matchesSearch =
            !query ||
            item.title
              ?.toLowerCase()
              .includes(query) ||
            item.description
              ?.toLowerCase()
              .includes(query) ||
            item.code
              ?.toLowerCase()
              .includes(query);

          const matchesTax =
            taxFilter === 'ALL' ||
            item.taxType ===
              taxFilter;

          const matchesType =
            typeFilter === 'ALL' ||
            item.obligationType ===
              typeFilter;

          return (
            matchesSearch &&
            matchesTax &&
            matchesType
          );
        },
      );
    }, [
      calendar,
      search,
      taxFilter,
      typeFilter,
    ]);

  // ===================================================
  // ITENS DO MÊS
  // ===================================================

  const monthItems =
    useMemo(() => {
      return filteredCalendar
        .filter((item) => {
          const date =
            parseDate(item.dueDate);

          return (
            date.getFullYear() ===
              selectedYear &&
            date.getMonth() ===
              selectedMonth
          );
        })
        .sort(
          (a, b) =>
            parseDate(
              a.dueDate,
            ).getTime() -
            parseDate(
              b.dueDate,
            ).getTime(),
        );
    }, [
      filteredCalendar,
      selectedYear,
      selectedMonth,
    ]);

  // ===================================================
  // PRÓXIMOS PRAZOS
  // ===================================================

  const upcomingItems =
    useMemo(() => {
      return filteredCalendar
        .filter((item) => {
          const days =
            getDaysUntil(
              item.dueDate,
            );

          return days >= 0;
        })
        .sort(
          (a, b) =>
            parseDate(
              a.dueDate,
            ).getTime() -
            parseDate(
              b.dueDate,
            ).getTime(),
        )
        .slice(0, 8);
    }, [filteredCalendar]);

  // ===================================================
  // ESTATÍSTICAS
  // ===================================================

  const stats =
    useMemo(() => {
      const total =
        filteredCalendar.length;

      const thisMonth =
        monthItems.length;

      const next30 =
        filteredCalendar.filter(
          (item) => {
            const days =
              getDaysUntil(
                item.dueDate,
              );

            return (
              days >= 0 &&
              days <= 30
            );
          },
        ).length;

      const withSource =
        filteredCalendar.filter(
          (item) =>
            Boolean(
              item.sourceUrl ||
                item.officialReference,
            ),
        ).length;

      return {
        total,
        thisMonth,
        next30,
        withSource,
      };
    }, [
      filteredCalendar,
      monthItems,
    ]);

  // ===================================================
  // CALENDÁRIO VISUAL
  // ===================================================

  const calendarDays =
    useMemo<MonthData[]>(() => {
      const firstDay =
        new Date(
          selectedYear,
          selectedMonth,
          1,
        );

      const lastDay =
        new Date(
          selectedYear,
          selectedMonth + 1,
          0,
        );

      const daysInMonth =
        lastDay.getDate();

      // JS: domingo = 0
      // Transformar para segunda = 0
      const firstWeekday =
        (firstDay.getDay() + 6) % 7;

      const previousMonthLastDay =
        new Date(
          selectedYear,
          selectedMonth,
          0,
        ).getDate();

      const days: MonthData[] = [];

      for (
        let i = firstWeekday - 1;
        i >= 0;
        i--
      ) {
        const date =
          new Date(
            selectedYear,
            selectedMonth - 1,
            previousMonthLastDay - i,
          );

        days.push({
          date,
          day: date.getDate(),
          currentMonth: false,
          items: [],
        });
      }

      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {
        const date =
          new Date(
            selectedYear,
            selectedMonth,
            day,
          );

        const key =
          dateKey(date);

        const items =
          monthItems.filter(
            (item) =>
              dateKey(
                parseDate(
                  item.dueDate,
                ),
              ) === key,
          );

        days.push({
          date,
          day,
          currentMonth: true,
          items,
        });
      }

      while (
        days.length % 7 !== 0
      ) {
        const nextDay =
          new Date(
            selectedYear,
            selectedMonth,
            days.length -
              daysInMonth -
              firstWeekday +
              1,
          );

        days.push({
          date: nextDay,
          day: nextDay.getDate(),
          currentMonth: false,
          items: [],
        });
      }

      return days;
    }, [
      selectedYear,
      selectedMonth,
      monthItems,
    ]);

  // ===================================================
  // NAVEGAÇÃO DE MÊS
  // ===================================================

  const previousMonth =
    () => {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(
          (year) => year - 1,
        );
      } else {
        setSelectedMonth(
          (month) => month - 1,
        );
      }
    };

  const nextMonth =
    () => {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(
          (year) => year + 1,
        );
      } else {
        setSelectedMonth(
          (month) => month + 1,
        );
      }
    };

  const goToday =
    () => {
      setSelectedYear(
        today.getFullYear(),
      );

      setSelectedMonth(
        today.getMonth(),
      );
    };

  // ===================================================
  // LIMPAR FILTROS
  // ===================================================

  const clearFilters =
    () => {
      setSearch('');
      setTaxFilter('ALL');
      setTypeFilter('ALL');
    };

  const hasFilters =
    Boolean(
      search ||
        taxFilter !== 'ALL' ||
        typeFilter !== 'ALL',
    );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7f9fc] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">

          {/* =========================================
              HEADER
          ========================================= */}

          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#0ea5e9]">
                <CalendarDays
                  size={17}
                />

                <span>
                  Calendário Fiscal
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-[#10244d]">
                Calendário Fiscal AGT
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Consulte os prazos fiscais
                aplicáveis à sua empresa
                de acordo com o regime fiscal.
              </p>

              {company && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {company.name && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                      {company.name}
                    </span>
                  )}

                  {company.nif && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200">
                      NIF: {company.nif}
                    </span>
                  )}

                  {company.regime && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                      {getRegimeLabel(
                        company.regime,
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goToday}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <CalendarDays
                  size={16}
                />

                Hoje
              </button>

              <button
                type="button"
                onClick={() =>
                  loadCalendar(true)
                }
                disabled={refreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0ea5e9] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0284c7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? 'animate-spin'
                      : ''
                  }
                />

                Atualizar
              </button>
            </div>
          </div>

          {/* =========================================
              ERRO
          ========================================= */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">
                <p className="font-semibold">
                  Não foi possível carregar
                  o calendário.
                </p>

                <p className="mt-1">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setError('')
                }
                className="rounded-md p-1 hover:bg-red-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* =========================================
              ESTATÍSTICAS
          ========================================= */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Prazos no ano
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#10244d]">
                    {stats.total}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Calendário fiscal aplicável
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3 text-blue-500">
                  <FileText
                    size={21}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Este mês
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#10244d]">
                    {stats.thisMonth}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Prazos em{' '}
                    {MONTHS[
                      selectedMonth
                    ]}
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 p-3 text-violet-500">
                  <CalendarDays
                    size={21}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Próximos 30 dias
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#10244d]">
                    {stats.next30}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Prazos a acompanhar
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-amber-500">
                  <Clock3
                    size={21}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Fonte oficial
                  </p>

                  <p className="mt-2 text-3xl font-bold text-[#10244d]">
                    {stats.withSource}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Itens com referência
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-500">
                  <CheckCircle2
                    size={21}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* =========================================
              FILTROS
          ========================================= */}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Pesquisar prazo, imposto ou obrigação..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter
                  size={17}
                  className="hidden text-slate-400 sm:block"
                />

                <select
                  value={taxFilter}
                  onChange={(event) =>
                    setTaxFilter(
                      event.target.value,
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="ALL">
                    Todos os impostos
                  </option>

                  <option value="IVA">
                    IVA
                  </option>

                  <option value="IRT">
                    IRT
                  </option>

                  <option value="INDUSTRIAL">
                    Industrial
                  </option>

                  <option value="SELO">
                    Imposto do Selo
                  </option>

                  <option value="SS">
                    Segurança Social
                  </option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value,
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="ALL">
                    Todos os tipos
                  </option>

                  <option value="IVA">
                    IVA
                  </option>

                  <option value="IRT">
                    IRT
                  </option>

                  <option value="II">
                    Imposto Industrial
                  </option>

                  <option value="SS">
                    Segurança Social
                  </option>

                  <option value="DECLARACAO">
                    Declarações
                  </option>
                </select>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <X size={16} />

                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* =========================================
              CONTEÚDO
          ========================================= */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">

            {/* =======================================
                CALENDÁRIO
            ======================================= */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Calendário
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#10244d]">
                    {MONTHS[
                      selectedMonth
                    ]}{' '}
                    de {selectedYear}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      previousMonth
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      goToday
                    }
                    className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Hoje
                  </button>

                  <button
                    type="button"
                    onClick={
                      nextMonth
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight
                      size={18}
                    />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-[500px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <RefreshCw
                      size={28}
                      className="animate-spin text-blue-500"
                    />

                    <span className="text-sm">
                      A carregar calendário...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5">

                  <div className="mb-2 grid grid-cols-7">
                    {WEEKDAYS.map(
                      (day) => (
                        <div
                          key={day}
                          className="py-3 text-center text-[10px] font-bold tracking-wider text-slate-400"
                        >
                          {day}
                        </div>
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-100">
                    {calendarDays.map(
                      (cell, index) => {
                        const isToday =
                          dateKey(
                            cell.date,
                          ) ===
                          dateKey(
                            today,
                          );

                        return (
                          <div
                            key={`${dateKey(
                              cell.date,
                            )}-${index}`}
                            className={[
                              'relative min-h-[105px] border-b border-r border-slate-100 p-2 transition',
                              cell.currentMonth
                                ? 'bg-white'
                                : 'bg-slate-50/70',
                              isToday
                                ? 'bg-blue-50/40'
                                : '',
                            ].join(
                              ' ',
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={[
                                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                                  isToday
                                    ? 'bg-blue-500 text-white'
                                    : cell.currentMonth
                                      ? 'text-slate-700'
                                      : 'text-slate-300',
                                ].join(
                                  ' ',
                                )}
                              >
                                {cell.day}
                              </span>

                              {cell.items
                                .length >
                                0 && (
                                <span className="text-[9px] font-semibold text-blue-500">
                                  {
                                    cell
                                      .items
                                      .length
                                  }
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1">
                              {cell.items
                                .slice(
                                  0,
                                  2,
                                )
                                .map(
                                  (
                                    item,
                                  ) => (
                                    <button
                                      type="button"
                                      key={
                                        item.id
                                      }
                                      onClick={() =>
                                        setSelectedItem(
                                          item,
                                        )
                                      }
                                      className="block w-full truncate rounded-md bg-blue-50 px-2 py-1 text-left text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100"
                                      title={
                                        item.title
                                      }
                                    >
                                      {item.title}
                                    </button>
                                  ),
                                )}

                              {cell.items
                                .length >
                                2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedItem(
                                      cell
                                        .items[2],
                                    )
                                  }
                                  className="text-[9px] font-semibold text-slate-400 hover:text-blue-500"
                                >
                                  +
                                  {cell
                                    .items
                                    .length -
                                    2}{' '}
                                  mais
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      Hoje
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-100" />
                      Prazo fiscal
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                      Outro mês
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =======================================
                PRÓXIMOS PRAZOS
            ======================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Agenda fiscal
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-[#10244d]">
                      Próximos prazos
                    </h2>
                  </div>

                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {upcomingItems.length}
                  </div>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Acompanhe os próximos
                  compromissos fiscais.
                </p>
              </div>

              <div className="max-h-[650px] overflow-y-auto p-4">
                {upcomingItems.length ===
                0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                      <CalendarDays
                        size={26}
                      />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      Nenhum prazo encontrado
                    </p>

                    <p className="mt-1 max-w-[250px] text-xs leading-5 text-slate-400">
                      Não existem prazos
                      correspondentes aos
                      filtros selecionados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingItems.map(
                      (item) => {
                        const days =
                          getDaysUntil(
                            item.dueDate,
                          );

                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() =>
                              setSelectedItem(
                                item,
                              )
                            }
                            className="group w-full rounded-xl border border-slate-100 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/30"
                          >
                            <div className="flex gap-3">

                              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <span className="text-sm font-bold">
                                  {
                                    parseDate(
                                      item.dueDate,
                                    ).getDate()
                                  }
                                </span>

                                <span className="text-[8px] font-bold uppercase">
                                  {
                                    MONTHS[
                                      parseDate(
                                        item.dueDate,
                                      ).getMonth()
                                    ].slice(
                                      0,
                                      3,
                                    )
                                  }
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                                    {item.title}
                                  </p>

                                  <ChevronRight
                                    size={15}
                                    className="mt-1 shrink-0 text-slate-300 transition group-hover:text-blue-500"
                                  />
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {getTaxLabel(
                                    item.taxType,
                                  )}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {shortDate(
                                      item.dueDate,
                                    )}
                                  </span>

                                  {days ===
                                    0 && (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">
                                      Hoje
                                    </span>
                                  )}

                                  {days >
                                    0 &&
                                    days <=
                                      7 && (
                                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600">
                                        Em{' '}
                                        {days}{' '}
                                        dias
                                      </span>
                                    )}

                                  {days >
                                    7 && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                                      Próximo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =========================================
              LISTA DO MÊS
          ========================================= */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#10244d]">
                  Prazos de{' '}
                  {MONTHS[
                    selectedMonth
                  ]}{' '}
                  de {selectedYear}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {monthItems.length}{' '}
                  prazo(s) fiscal(is)
                  encontrado(s).
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                Fonte oficial AGT
              </span>
            </div>

            {monthItems.length ===
            0 ? (
              <div className="p-10 text-center">
                <CalendarDays
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nenhum prazo neste mês
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Experimente outro mês ou
                  remova os filtros.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {monthItems.map(
                  (item) => {
                    const linkedObligations =
                      item.obligations ??
                      [];

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() =>
                          setSelectedItem(
                            item,
                          )
                        }
                        className="group flex w-full flex-col gap-4 p-5 text-left transition hover:bg-slate-50 md:flex-row md:items-center"
                      >
                        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <span className="text-lg font-bold">
                            {
                              parseDate(
                                item.dueDate,
                              ).getDate()
                            }
                          </span>

                          <span className="text-[8px] font-bold uppercase">
                            {
                              MONTHS[
                                selectedMonth
                              ].slice(
                                0,
                                3,
                              )
                            }
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-800">
                              {item.title}
                            </h3>

                            {item.taxType && (
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-600">
                                {getTaxLabel(
                                  item.taxType,
                                )}
                              </span>
                            )}

                            {item.obligationType && (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">
                                {getObligationLabel(
                                  item.obligationType,
                                )}
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {
                                item.description
                              }
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                            <span>
                              Prazo:{' '}
                              {formatDate(
                                item.dueDate,
                              )}
                            </span>

                            {item.period && (
                              <span>
                                Período:{' '}
                                {
                                  item.period
                                }
                              </span>
                            )}

                            {linkedObligations.length >
                              0 && (
                              <span className="font-semibold text-emerald-600">
                                {
                                  linkedObligations.length
                                }{' '}
                                obrigação(ões)
                                gerada(s)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="hidden text-xs text-slate-400 sm:block">
                            Ver detalhes
                          </span>

                          <ChevronRight
                            size={18}
                            className="text-slate-300 transition group-hover:text-blue-500"
                          />
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* =========================================
              NOTA
          ========================================= */}

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex gap-3">
              <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-600">
                <AlertCircle
                  size={18}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-900">
                  Calendário fiscal da empresa
                </h3>

                <p className="mt-1 max-w-4xl text-xs leading-5 text-blue-800/70">
                  Os prazos apresentados são
                  provenientes do calendário fiscal
                  aplicável ao regime da empresa.
                  A existência de um prazo no
                  calendário não significa, por si só,
                  que uma obrigação individual tenha
                  sido gerada para a empresa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===========================================
          MODAL DE DETALHES
      =========================================== */}

      {selectedItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedItem(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div className="flex gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <CalendarDays
                    size={22}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Detalhe fiscal
                  </p>

                  <h2 className="mt-1 pr-5 text-xl font-bold text-[#10244d]">
                    {
                      selectedItem.title
                    }
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedItem(null)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Data limite
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(
                      selectedItem.dueDate,
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Ano de referência
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {
                      selectedItem.referenceYear
                    }
                  </p>
                </div>

                {selectedItem.taxType && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Imposto
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {getTaxLabel(
                        selectedItem.taxType,
                      )}
                    </p>
                  </div>
                )}

                {selectedItem.obligationType && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Tipo
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {getObligationLabel(
                        selectedItem.obligationType,
                      )}
                    </p>
                  </div>
                )}

                {selectedItem.period && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Período
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {
                        selectedItem.period
                      }
                    </p>
                  </div>
                )}

                {selectedItem.code && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Código
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {
                        selectedItem.code
                      }
                    </p>
                  </div>
                )}
              </div>

              {selectedItem.description && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Descrição
                  </p>

                  <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {
                      selectedItem.description
                    }
                  </p>
                </div>
              )}

              {selectedItem.regimes &&
                selectedItem.regimes
                  .length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Regimes aplicáveis
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedItem.regimes.map(
                        (regime) => (
                          <span
                            key={
                              regime.id ??
                              regime.regime
                            }
                            className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600"
                          >
                            {getRegimeLabel(
                              regime.regime,
                            )}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {selectedItem.obligations &&
                selectedItem.obligations
                  .length > 0 && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Obrigações relacionadas
                      </p>

                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                        {
                          selectedItem
                            .obligations
                            .length
                        }
                      </span>
                    </div>

                    <div className="mt-2 space-y-2">
                      {selectedItem.obligations.map(
                        (
                          obligation,
                        ) => (
                          <div
                            key={
                              obligation.id
                            }
                            className="rounded-xl border border-slate-100 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {
                                    obligation.title
                                  }
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                  {shortDate(
                                    obligation.dueDate,
                                  )}
                                </p>
                              </div>

                              {obligation.status && (
                                <span
                                  className={[
                                    'rounded-full px-2 py-1 text-[9px] font-bold',
                                    obligation.status ===
                                      'PAID'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : obligation.status ===
                                          'LATE'
                                        ? 'bg-red-50 text-red-600'
                                        : 'bg-amber-50 text-amber-600',
                                  ].join(
                                    ' ',
                                  )}
                                >
                                  {obligation.status ===
                                  'PAID'
                                    ? 'Paga'
                                    : obligation.status ===
                                        'LATE'
                                      ? 'Atrasada'
                                      : 'Pendente'}
                                </span>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {selectedItem.officialReference && (
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Referência oficial
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {
                      selectedItem.officialReference
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              {selectedItem.sourceUrl && (
                <a
                  href={
                    selectedItem.sourceUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ExternalLink
                    size={15}
                  />

                  Fonte oficial
                </a>
              )}

              <button
                type="button"
                onClick={() =>
                  setSelectedItem(null)
                }
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0ea5e9] px-5 text-sm font-semibold text-white transition hover:bg-[#0284c7]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}