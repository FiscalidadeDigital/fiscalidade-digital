'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  CalendarDays,
  FileText,
  Loader2,
  CircleDollarSign,
  Search,
  Filter,
  WalletCards,
  Building2,
  ShieldCheck,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ConfirmDialog, useToast } from '@/components/ui/enterprise';

import {
  Obligation,
  ObligationStatus,
  getObligations,
  syncObligations,
  payObligation,
} from '@/services/obligations';

import { getCompany } from '@/services/company';

/* =====================================================
   TIPOS
===================================================== */

type Company = {
  id?: string;
  name?: string;
  nif?: string;
  regime?: string;
  sector?: string;
};

/* =====================================================
   HELPERS
===================================================== */

const formatCurrency = (
  value: number | null | undefined,
) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (
  date: string,
) => {
  if (!date) {
    return '—';
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return '—';
  }

  return parsed.toLocaleDateString(
    'pt-AO',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
};

/* =====================================================
   NORMALIZAR REGIME
===================================================== */

const normalizeRegime = (
  regime?: string | null,
) => {
  const value =
    String(
      regime || '',
    )
      .trim()
      .toUpperCase();

  if (
    value.includes(
      'SIMPLIFICADO',
    ) ||
    value.includes(
      'SIMPLIFIED',
    )
  ) {
    return 'SIMPLIFICADO';
  }

  if (
    value.includes(
      'PRESTADOR',
    ) ||
    value.includes(
      'SERVICO',
    ) ||
    value.includes(
      'SERVIÇO',
    )
  ) {
    return 'PRESTADOR_SERVICO';
  }

  if (
    value === 'GERAL' ||
    value === 'REGIME_GERAL' ||
    value === 'REGIME GERAL'
  ) {
    return 'GERAL';
  }

  return value || 'GERAL';
};

/* =====================================================
   NOME DO REGIME
===================================================== */

const regimeLabel = (
  regime?: string | null,
) => {
  const normalized =
    normalizeRegime(
      regime,
    );

  switch (
    normalized
  ) {
    case 'SIMPLIFICADO':
      return 'Regime Simplificado';

    case 'PRESTADOR_SERVICO':
      return 'Prestador de Serviços';

    case 'GERAL':
      return 'Regime Geral';

    default:
      return normalized
        .replace(
          /_/g,
          ' ',
        )
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase(),
        );
  }
};

/* =====================================================
   COR DO REGIME
===================================================== */

const regimeStyles = (
  regime?: string | null,
) => {
  const normalized =
    normalizeRegime(
      regime,
    );

  switch (
    normalized
  ) {
    case 'SIMPLIFICADO':
      return {
        wrapper:
          'border-emerald-200 bg-emerald-50',
        icon:
          'bg-emerald-100 text-emerald-700',
        text:
          'text-emerald-700',
        dot:
          'bg-emerald-500',
      };

    case 'PRESTADOR_SERVICO':
      return {
        wrapper:
          'border-amber-200 bg-amber-50',
        icon:
          'bg-amber-100 text-amber-700',
        text:
          'text-amber-700',
        dot:
          'bg-amber-500',
      };

    default:
      return {
        wrapper:
          'border-[var(--fd-border)] bg-[var(--fd-accent-soft)]',
        icon:
          'bg-fd-accent-soft text-fd-accent',
        text:
          'text-fd-accent',
        dot:
          'bg-fd-primary',
      };
  }
};

/* =====================================================
   STATUS
===================================================== */

const statusLabel = (
  status: ObligationStatus,
) => {
  switch (
    status
  ) {
    case 'PAID':
      return 'Paga';

    case 'LATE':
      return 'Atrasada';

    default:
      return 'Pendente';
  }
};

/* =====================================================
   TIPO
===================================================== */

const typeLabel = (
  type: string,
) => {
  switch (
    type
  ) {
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

    case 'PAGAMENTO':
      return 'Pagamento';

    case 'RETENCAO':
      return 'Retenção';

    default:
      return type;
  }
};

const splitObligationTitle = (title?: string | null) => {
  const value = String(title || '').trim();
  const separator = ' — ';
  const separatorIndex = value.indexOf(separator);

  if (separatorIndex < 0) {
    return { shortTitle: value || 'Obrigação fiscal', titleDescription: '' };
  }

  return {
    shortTitle: value.slice(0, separatorIndex).trim() || value,
    titleDescription: value.slice(separatorIndex + separator.length).trim(),
  };
};

const dueGroup = (obligation: Obligation) => {
  if (obligation.status === 'LATE') {
    return 'late';
  }

  const dueDate = new Date(obligation.dueDate);
  const now = new Date();

  if (
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getFullYear() === now.getFullYear() &&
    dueDate.getMonth() === now.getMonth()
  ) {
    return 'this-month';
  }

  return 'upcoming';
};

/* =====================================================
   LIMPAR DESCRIÇÃO DO CALENDÁRIO
===================================================== */

/*
 * Algumas descrições vindas do calendário podem conter
 * informações como:
 *
 * Sector: ...
 * Regime: Regime Geral
 * Mês de referência do prazo: ...
 *
 * O regime apresentado ao utilizador deve vir sempre
 * da empresa autenticada, através de Tenant.regime.
 *
 * Por isso removemos apenas os blocos de metadados
 * do calendário que poderiam contradizer o regime real.
 *
 * Não alteramos o título nem o valor da obrigação.
 */

const cleanCalendarDescription = (
  description?: string | null,
) => {
  if (!description) {
    return '';
  }

  let result =
    String(
      description,
    );

  result =
    result.replace(
      /Sector:\s*[^|]+/gi,
      '',
    );

  result =
    result.replace(
      /Regime:\s*[^|]+/gi,
      '',
    );

  result =
    result.replace(
      /Mês de referência do prazo:\s*[^|]+/gi,
      '',
    );

  result =
    result.replace(
      /Mes de referencia do prazo:\s*[^|]+/gi,
      '',
    );

  result =
    result.replace(
      /Prazo indicado no Calendário Fiscal AGT:\s*[^|]+/gi,
      '',
    );

  result =
    result.replace(
      /Prazo indicado no Calendario Fiscal AGT:\s*[^|]+/gi,
      '',
    );

  result =
    result.replace(
      /Ano:\s*[^|]+/gi,
      '',
    );

  result =
    result.replace(
      /\|\s*\|/g,
      '|',
    );

  result =
    result.replace(
      /^\s*\|\s*/,
      '',
    );

  result =
    result.replace(
      /\s*\|\s*$/,
      '',
    );

  result =
    result.replace(
      /\s{2,}/g,
      ' ',
    );

  return result.trim();
};

/* =====================================================
   EMPRESA VAZIA
===================================================== */

const EMPTY_COMPANY: Company = {
  name: 'Empresa',
  nif: '—',
  regime: 'GERAL',
  sector: '—',
};

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

export default function ObligationsPage() {
  const { show: showToast } = useToast();
  const [
    obligations,
    setObligations,
  ] = useState<Obligation[]>([]);

  const [
    company,
    setCompany,
  ] = useState<Company>(
    EMPTY_COMPANY,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingCompany,
    setLoadingCompany,
  ] = useState(true);

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    payingId,
    setPayingId,
  ] = useState<string | null>(
    null,
  );

  const [
    pendingPaymentId,
    setPendingPaymentId,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    filter,
    setFilter,
  ] = useState<
    'ALL' | ObligationStatus
  >('ALL');

  const [periodFilter, setPeriodFilter] = useState<
    'ALL' | 'THIS_MONTH' | 'UPCOMING'
  >('ALL');

  const [taxFilter, setTaxFilter] = useState('ALL');

  /* Regime fiscal is contextual to each tax and period. Tenant.regime remains legacy company data only. */
  const currentRegimeLabel = 'Situação Fiscal';
  const currentRegimeStyles = { wrapper: 'border-slate-200 bg-slate-50', icon: 'bg-slate-100 text-slate-700', text: 'text-slate-700', dot: 'bg-slate-500' };

  /* =====================================================
     CARREGAR EMPRESA AUTENTICADA
  ===================================================== */

  const loadCompany =
    async () => {
      try {
        setLoadingCompany(
          true,
        );

        const data =
          await getCompany();

        setCompany({
          id:
            data?.id,

          name:
            data?.name ||
            'Empresa',

          nif:
            data?.nif ||
            '—',

          regime:
            data?.regime ||
            'GERAL',

          sector:
            data?.sector ||
            '—',
        });
      } catch (
        companyError
      ) {
        console.error(
          'Erro ao carregar empresa:',
          companyError,
        );

        /*
         * Não inventamos o regime.
         *
         * Caso a empresa não possa ser carregada,
         * mantemos o valor inicial apenas para evitar
         * quebra visual.
         */
      } finally {
        setLoadingCompany(
          false,
        );
      }
    };

  /* =====================================================
     CARREGAR OBRIGAÇÕES
  ===================================================== */

  const loadObligations =
    async () => {
      try {
        setError('');
        setLoading(true);

        /*
         * O tenantId NÃO é enviado pelo frontend.
         *
         * O backend identifica a empresa através
         * do JWT da sessão autenticada.
         */

        const data =
          await getObligations();

        setObligations(
          Array.isArray(data)
            ? data
            : [],
        );
      } catch (
        err: any
      ) {
        console.error(
          'Erro ao carregar obrigações:',
          err,
        );

        setError(
          err?.response?.data?.message ||
            'Não foi possível carregar as obrigações fiscais.',
        );
      } finally {
        setLoading(false);
      }
    };

  /* =====================================================
     PRIMEIRO CARREGAMENTO
  ===================================================== */

  useEffect(() => {
    loadCompany();
    loadObligations();
  }, []);

  /* =====================================================
     SINCRONIZAR CALENDÁRIO
  ===================================================== */

  const handleSync =
    async () => {
      try {
        setSyncing(true);
        setError('');

        await syncObligations({
          referenceYear:
            new Date().getFullYear(),
        });

        /*
         * Recarregar empresa também garante que,
         * se o regime tiver sido alterado no perfil,
         * a página reflita imediatamente o Tenant.regime.
         */

        await Promise.all([
          loadCompany(),
          loadObligations(),
        ]);
      } catch (
        err: any
      ) {
        console.error(
          'Erro ao sincronizar obrigações:',
          err,
        );

        setError(
          err?.response?.data?.message ||
            'Não foi possível sincronizar o calendário fiscal.',
        );
      } finally {
        setSyncing(false);
      }
    };

  /* =====================================================
     MARCAR COMO PAGA
  ===================================================== */

  const handlePay =
    async (
      id: string,
    ) => {
      try {
        setPayingId(id);
        setError('');

        await payObligation(
          id,
        );

        showToast({
          title: 'Obrigação marcada como paga',
          description: 'O pagamento foi registado com sucesso.',
          tone: 'success',
        });

        await loadObligations();
      } catch (
        err: any
      ) {
        console.error(
          'Erro ao marcar obrigação como paga:',
          err,
        );

        const message =
          err?.response?.data?.message ||
          'Não foi possível actualizar o pagamento.';

        setError(message);
        showToast({
          title: 'Não foi possível actualizar o pagamento',
          description: message,
          tone: 'danger',
        });
      } finally {
        setPayingId(null);
      }
    };

  /* =====================================================
     ESTATÍSTICAS
  ===================================================== */

  const pending =
    useMemo(
      () =>
        obligations.filter(
          (item) =>
            item.status ===
            'PENDING',
        ),
      [obligations],
    );

  const paid =
    useMemo(
      () =>
        obligations.filter(
          (item) =>
            item.status ===
            'PAID',
        ),
      [obligations],
    );

  const late =
    useMemo(
      () =>
        obligations.filter(
          (item) =>
            item.status ===
            'LATE',
        ),
      [obligations],
    );

  /* =====================================================
     VALORES
  ===================================================== */

  const totalAmount =
    useMemo(
      () =>
        obligations.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.amount || 0,
            ),
          0,
        ),
      [obligations],
    );

  const pendingAmount =
    useMemo(
      () =>
        obligations
          .filter(
            (item) =>
              item.status ===
                'PENDING' ||
              item.status ===
                'LATE',
          )
          .reduce(
            (
              total,
              item,
            ) =>
              total +
              Number(
                item.amount ||
                  0,
              ),
            0,
          ),
      [obligations],
    );

  const paidAmount =
    useMemo(
      () =>
        obligations
          .filter(
            (item) =>
              item.status ===
              'PAID',
          )
          .reduce(
            (
              total,
              item,
            ) =>
              total +
              Number(
                item.amount ||
                  0,
              ),
            0,
          ),
      [obligations],
    );

  /* =====================================================
     PERCENTAGEM DE CONCLUSÃO
  ===================================================== */

  const completionRate =
    obligations.length > 0
      ? Math.round(
          (paid.length /
            obligations.length) *
            100,
        )
      : 0;

  /* =====================================================
     PESQUISA + FILTRO
  ===================================================== */

  const filteredObligations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return obligations.filter(
        (item) => {
          const matchesFilter =
            filter ===
              'ALL' ||
            item.status ===
              filter;

          const itemDueGroup = dueGroup(item);
          const matchesPeriod =
            periodFilter === 'ALL' ||
            (periodFilter === 'THIS_MONTH' && itemDueGroup === 'this-month') ||
            (periodFilter === 'UPCOMING' && itemDueGroup === 'upcoming');

          const matchesTax =
            taxFilter === 'ALL' ||
            item.type === taxFilter ||
            item.fiscalCalendar?.taxType === taxFilter;

          const matchesSearch =
            !query ||
            item.title
              ?.toLowerCase()
              .includes(query) ||
            item.type
              ?.toLowerCase()
              .includes(query) ||
            item.description
              ?.toLowerCase()
              .includes(query) ||
            typeLabel(
              item.type,
            )
              .toLowerCase()
              .includes(query) ||
            currentRegimeLabel
              .toLowerCase()
              .includes(query);

          return (
            matchesFilter &&
            matchesPeriod &&
            matchesTax &&
            matchesSearch
          );
        },
      );
    }, [
      obligations,
      search,
      filter,
      periodFilter,
      taxFilter,
      currentRegimeLabel,
    ]);

  const taxOptions = useMemo(
    () => Array.from(new Set(
      obligations
        .map((item) => item.fiscalCalendar?.taxType || item.type)
        .filter(Boolean),
    )).sort(),
    [obligations],
  );

  const groupedFilteredObligations = useMemo(() => {
    const definitions = [
      { id: 'late', title: 'Atrasadas' },
      { id: 'this-month', title: 'Este mês' },
      { id: 'upcoming', title: 'Próximas' },
    ] as const;

    return definitions.map((definition) => ({
      ...definition,
      items: filteredObligations
        .filter((item) => dueGroup(item) === definition.id)
        .sort((first, second) => new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime()),
    }));
  }, [filteredObligations]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <DashboardLayout>
      <div
        className="
          mx-auto
          fd-workspace-page
          fd-theme-scope
          w-full
          max-w-[1500px]
          space-y-6
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <section
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-end
            lg:justify-between
            border-b
            border-slate-200
            pb-5
          "
        >
          <div
            className="
              min-w-0
            "
          >

            <h1
              className="
                text-2xl
                font-semibold
                tracking-tight
                text-slate-950
              "
            >
              Obrigações Fiscais
            </h1>

            <p
              className="
                mt-2
                max-w-[680px]
                text-[12px]
                leading-6
                text-slate-600
                sm:text-[13px]
              "
            >
              Acompanhe as obrigações fiscais
              da sua empresa, consulte prazos,
              valores reais e estado dos pagamentos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-md
              bg-fd-primary
              px-5
              text-xs
              font-semibold
              text-white
              transition-colors
              hover:bg-fd-primary-hover
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {syncing ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <RefreshCw
                size={16}
              />
            )}

            {syncing
              ? 'Sincronizando...'
              : 'Sincronizar obrigações'}
          </button>
        </section>

        {/* =================================================
            EMPRESA ATIVA / REGIME
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-3
          "
        >

          {/* EMPRESA */}

          <div
            className="
              rounded-md
              border
              border-[#e8ebf3]
              bg-white
              p-5
              lg:col-span-2
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <div
                className="
                  flex
                  min-w-0
                  items-center
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
                    rounded-md
                    bg-slate-100
                    text-slate-500
                  "
                >
                  <Building2
                    size={22}
                  />
                </div>

                <div
                  className="
                    min-w-0
                  "
                >
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      text-[var(--fd-text-muted)]
                    "
                  >
                    Empresa ativa
                  </p>

                  <h2
                    className="
                      mt-1
                      truncate
                      text-[17px]
                      font-extrabold
                      text-[#111b3b]
                    "
                  >
                    {loadingCompany
                      ? 'A carregar...'
                      : company.name ||
                        'Empresa'}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-[var(--fd-text-muted)]
                    "
                  >
                    NIF:{' '}
                    <span
                      className="
                        font-semibold
                        text-[#526080]
                      "
                    >
                      {company.nif ||
                        '—'}
                    </span>
                  </p>
                </div>
              </div>

              {/* REGIME REAL */}

              <div
                className={`
                  inline-flex
                  shrink-0
                  items-center
                  gap-3
                  rounded-xl
                  border
                  px-4
                  py-3
                  ${currentRegimeStyles.wrapper}
                `}
              >
                <div
                  className={`
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    ${currentRegimeStyles.icon}
                  `}
                >
                  <ShieldCheck
                    size={18}
                  />
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      text-[var(--fd-text-muted)]
                    "
                  >
                    Regime fiscal
                  </p>

                  <p
                    className={`
                      mt-0.5
                      text-xs
                      font-extrabold
                      ${currentRegimeStyles.text}
                    `}
                  >
                    {currentRegimeLabel}
                  </p>
                </div>

                <span
                  className={`
                    h-2
                    w-2
                    rounded-full
                    ${currentRegimeStyles.dot}
                  `}
                />
              </div>
            </div>

            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
              "
            >
              <div
                className="
                  rounded-xl
                  border
                  border-[#eef0f5]
                  bg-[#fafbfe]
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-[var(--fd-text-muted)]
                  "
                >
                  Regime utilizado pelo sistema
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-bold
                    text-[#526080]
                  "
                >
                  {currentRegimeLabel}
                </p>
              </div>

              <div
                className="
                  rounded-xl
                  border
                  border-[#eef0f5]
                  bg-[#fafbfe]
                  px-4
                  py-3
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-[var(--fd-text-muted)]
                  "
                >
                  Sector
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-bold
                    text-[#526080]
                  "
                >
                  {company.sector ||
                    '—'}
                </p>
              </div>
            </div>
          </div>

          {/* FONTE */}

          <div
            className="
              rounded-2xl
              border
              border-[#e8ebf3]
              bg-white
              p-5
              shadow-sm
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
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-fd-accent-soft
                  text-fd-accent
                "
              >
                <CalendarDays
                  size={19}
                />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-[var(--fd-text-muted)]
                  "
                >
                  Calendário fiscal
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-bold
                    text-[#111b3b]
                  "
                >
                  Calendário AGT
                </p>
              </div>
            </div>

            <p
              className="
                mt-4
                text-xs
                leading-5
                text-[var(--fd-text-muted)]
              "
            >
              As regras fiscais são
              selecionadas de acordo com
              o regime fiscal da empresa
              cadastrada.
            </p>

            <div
              className="
                mt-3
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-[#f7f8fc]
                px-3
                py-2
              "
            >
              <span
                className={`
                  h-1.5
                  w-1.5
                  rounded-full
                  ${currentRegimeStyles.dot}
                `}
              />

              <span
                className="
                  text-xs
                  font-bold
                  text-[#526080]
                "
              >
                {currentRegimeLabel}
              </span>
            </div>
          </div>
        </section>

        {/* =================================================
            ERRO
        ================================================= */}

        {error && (
          <div
            className="
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-red-200
              bg-red-50
              px-4
              py-4
              text-red-700
            "
          >
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div
              className="min-w-0"
            >
              <p
                className="
                  text-[12px]
                  font-bold
                "
              >
                Ocorreu um problema
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                "
              >
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadObligations()}
                className="mt-3 inline-flex min-h-11 items-center rounded-fd-field border border-red-200 bg-white px-3 text-xs font-semibold text-fd-danger transition-colors hover:bg-[var(--fd-danger-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-focus"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            CARDS DE RESUMO
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            overflow-hidden
            border
            border-slate-200
            bg-white
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          <SummaryCard
            title="Total"
            value={
              obligations.length
            }
            description="Obrigações da empresa"
            icon={
              <FileText
                size={20}
              />
            }
            type="info"
            onClick={() => setFilter('ALL')}
            active={filter === 'ALL'}
          />

          <SummaryCard
            title="Pendentes"
            value={
              pending.length
            }
            description={formatCurrency(
              pendingAmount,
            )}
            icon={
              <Clock3
                size={20}
              />
            }
            type="orange"
            onClick={() => setFilter('PENDING')}
            active={filter === 'PENDING'}
          />

          <SummaryCard
            title="Pagas"
            value={
              paid.length
            }
            description={formatCurrency(
              paidAmount,
            )}
            icon={
              <CheckCircle2
                size={20}
              />
            }
            type="green"
            onClick={() => setFilter('PAID')}
            active={filter === 'PAID'}
          />

          <SummaryCard
            title="Atrasadas"
            value={
              late.length
            }
            description={
              late.length > 0
                ? 'Requer atenção'
                : 'Tudo em dia'
            }
            icon={
              <AlertTriangle
                size={20}
              />
            }
            type="red"
            onClick={() => setFilter('LATE')}
            active={filter === 'LATE'}
          />
        </section>

        {/* =================================================
            RESUMO FINANCEIRO
        ================================================= */}

        <section
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-3
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-[#e8ebf3]
              bg-white
              p-5
              shadow-sm
              lg:col-span-2
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
              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-[var(--fd-text-muted)]
                  "
                >
                  Valor total fiscal
                </p>

                <h2
                  className="
                    mt-2
                    text-[23px]
                    font-extrabold
                    tracking-tight
                    text-[#111b3b]
                  "
                >
                  {formatCurrency(
                    totalAmount,
                  )}
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-[var(--fd-text-muted)]
                  "
                >
                  Soma dos valores reais
                  das obrigações registadas.
                </p>
              </div>

              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-fd-accent-soft
                  text-fd-accent
                "
              >
                <WalletCards
                  size={21}
                />
              </div>
            </div>

            <div
              className="
                mt-5
                h-2
                overflow-hidden
                rounded-full
                bg-[#f1f3f8]
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-fd-primary
                  transition-all
                  duration-500
                "
                style={{
                  width: `${completionRate}%`,
                }}
              />
            </div>

            <div
              className="
                mt-3
                flex
                items-center
                justify-between
              "
            >
              <span
                className="
                  text-xs
                  font-medium
                  text-[var(--fd-text-muted)]
                "
              >
                Taxa de conclusão
              </span>

              <span
                className="
                  text-xs
                  font-bold
                  text-fd-accent
                "
              >
                {completionRate}%
              </span>
            </div>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-[#e8ebf3]
              bg-white
              p-5
              shadow-sm
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
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#fff1df]
                  text-fd-warning
                "
              >
                <CalendarDays
                  size={19}
                />
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-[var(--fd-text-muted)]
                  "
                >
                  Calendário fiscal
                </p>

                <p
                  className="
                    mt-1
                    text-[12px]
                    font-bold
                    text-[#111b3b]
                  "
                >
                  Dados sincronizados
                </p>
              </div>
            </div>

            <p
              className="
                mt-5
                text-xs
                leading-5
                text-[var(--fd-text-muted)]
              "
            >
              As obrigações apresentadas
              pertencem ao enquadramento
              fiscal da empresa ativa:
            </p>

            <div
              className={`
                mt-3
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                px-3
                py-2
                ${currentRegimeStyles.wrapper}
              `}
            >
              <ShieldCheck
                size={13}
                className={
                  currentRegimeStyles.text
                }
              />

              <span
                className={`
                  text-xs
                  font-bold
                  ${currentRegimeStyles.text}
                `}
              >
                {currentRegimeLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="
                mt-4
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-[#e4e7ef]
                bg-[#fafbfe]
                px-4
                py-2.5
                text-xs
                font-bold
                text-fd-accent
                transition
                hover:bg-fd-accent-soft
                disabled:opacity-50
              "
            >
              {syncing ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw
                  size={14}
                />
              )}

              Actualizar calendário
            </button>
          </div>
        </section>

        {/* =================================================
            LISTA
        ================================================= */}

        <section
          id="lista-obrigacoes"
          className="
            scroll-mt-24
            overflow-hidden
            rounded-2xl
            border
            border-[#e8ebf3]
            bg-white
            shadow-sm
          "
        >

          {/* CABEÇALHO */}

          <div
            className="
              border-b
              border-[#eef0f5]
              p-5
              sm:p-6
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div>
                <h2
                  className="
                    scroll-mt-24
                    text-[16px]
                    font-bold
                    text-[#111b3b]
                  "
                >
                  Lista de Obrigações
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-[var(--fd-text-muted)]
                    sm:text-xs
                  "
                >
                  Valores, prazos e estado
                  das obrigações de acordo
                  com o enquadramento da empresa.
                </p>
              </div>

              {/* PESQUISA */}

              <div
                className="
                  flex
                  w-full
                  flex-col
                  gap-2
                  sm:flex-row
                  lg:w-auto
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-full
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-[#e4e7ef]
                    bg-[#fafbfe]
                    px-3
                    sm:w-[250px]
                  "
                >
                  <Search
                    size={15}
                    className="text-[var(--fd-text-muted)]"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(
                      event,
                    ) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Pesquisar obrigação..."
                    className="
                      w-full
                      bg-transparent
                      text-xs
                      text-[#111b3b]
                      outline-none
                      placeholder:text-[var(--fd-text-muted)]
                    "
                  />
                </div>

                {/* FILTRO */}

                <div
                  className="
                    flex
                    h-10
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-[#e4e7ef]
                    bg-[#fafbfe]
                    px-3
                  "
                >
                  <Filter
                    size={14}
                    className="text-[var(--fd-text-muted)]"
                  />

                  <select
                    value={filter}
                    onChange={(
                      event,
                    ) =>
                      setFilter(
                        event.target
                          .value as
                          | 'ALL'
                          | ObligationStatus,
                      )
                    }
                    className="
                      bg-transparent
                      text-xs
                      font-semibold
                      text-[#526080]
                      outline-none
                    "
                  >
                    <option value="ALL">
                      Todas
                    </option>

                    <option value="PENDING">
                      Pendentes
                    </option>

                    <option value="PAID">
                      Pagas
                    </option>

                    <option value="LATE">
                      Atrasadas
                    </option>
                  </select>
                </div>

                <select
                  aria-label="Filtrar por período"
                  value={periodFilter}
                  onChange={(event) => setPeriodFilter(event.target.value as 'ALL' | 'THIS_MONTH' | 'UPCOMING')}
                  className="h-10 rounded-xl border border-[#e4e7ef] bg-[#fafbfe] px-3 text-xs font-semibold text-[#526080] outline-none focus:border-fd-accent focus:ring-2 focus:ring-fd-focus"
                >
                  <option value="ALL">Qualquer período</option>
                  <option value="THIS_MONTH">Este mês</option>
                  <option value="UPCOMING">Próximas</option>
                </select>

                <select
                  aria-label="Filtrar por imposto"
                  value={taxFilter}
                  onChange={(event) => setTaxFilter(event.target.value)}
                  className="h-10 rounded-xl border border-[#e4e7ef] bg-[#fafbfe] px-3 text-xs font-semibold text-[#526080] outline-none focus:border-fd-accent focus:ring-2 focus:ring-fd-focus"
                >
                  <option value="ALL">Todos os impostos</option>
                  {taxOptions.map((tax) => <option key={tax} value={tax}>{typeLabel(tax)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="space-y-3 p-5 sm:p-6" role="status" aria-label="A carregar obrigações">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse rounded-fd-card border border-[var(--fd-border)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-24 rounded bg-[var(--fd-surface-subtle)]" />
                      <div className="h-3 w-3/4 rounded bg-[var(--fd-surface-subtle)]" />
                      <div className="h-3 w-1/2 rounded bg-[var(--fd-surface-subtle)]" />
                    </div>
                    <div className="h-10 w-24 rounded bg-[var(--fd-surface-subtle)]" />
                  </div>
                </div>
              ))}
              <p className="sr-only">A obter dados da empresa.</p>
            </div>
          ) : filteredObligations.length ===
            0 ? (
            /* EMPTY */

            <div
              className="
                flex
                min-h-[360px]
                flex-col
                items-center
                justify-center
                px-6
                text-center
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-fd-accent-soft
                  text-fd-accent
                "
              >
                <FileText
                  size={25}
                />
              </div>

              <h3
                className="
                  mt-4
                  text-[14px]
                  font-bold
                  text-[#111b3b]
                "
              >
                Nenhuma obrigação encontrada
              </h3>

              <p
                className="
                  mt-2
                  max-w-[420px]
                  text-xs
                  leading-5
                  text-[var(--fd-text-muted)]
                "
              >
                {search
                  ? 'Não encontramos obrigações correspondentes à sua pesquisa.'
                  : `Não existem obrigações fiscais disponíveis para ${currentRegimeLabel}. Sincronize o calendário fiscal para verificar novamente.`}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={
                    handleSync
                  }
                  disabled={
                    syncing
                  }
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-fd-primary
                    px-4
                    py-2.5
                    text-xs
                    font-bold
                    text-white
                    transition
                    hover:bg-[#4338ca]
                    disabled:opacity-50
                  "
                >
                  {syncing ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw
                      size={14}
                    />
                  )}

                  Sincronizar agora
                </button>
              )}
            </div>
          ) : (
            /* =================================================
               ITEMS
            ================================================= */

            <div
              className="
                divide-y
                divide-[#eef0f5]
              "
            >
              {groupedFilteredObligations.map((group) => (
                group.items.length ? (
                  <section key={group.id} aria-labelledby={`obligations-group-${group.id}`}>
                    <div className="flex items-center justify-between border-y border-[var(--fd-border)] bg-[var(--fd-surface-muted)] px-5 py-2.5 sm:px-6">
                      <h3 id={`obligations-group-${group.id}`} className="text-xs font-bold uppercase tracking-[.12em] text-[var(--fd-text-secondary)]">{group.title}</h3>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--fd-text-secondary)]">{group.items.length}</span>
                    </div>
                    {group.items.map((obligation) => {
                  const isPaid =
                    obligation.status ===
                    'PAID';

                  const isLate =
                    obligation.status ===
                    'LATE';

                  const hasDeterminedAmount =
                    obligation.amount !== null &&
                    obligation.amount !== undefined;

                  const amount = hasDeterminedAmount
                    ? Number(obligation.amount)
                    : null;

                  const description =
                    cleanCalendarDescription(
                      obligation.description,
                    );

                  const { shortTitle, titleDescription } = splitObligationTitle(
                    obligation.title,
                  );
                  const fullDescription = [titleDescription, description]
                    .filter(Boolean)
                    .join(' ');
                  const needsReview = obligation.calculation?.quality === 'REVIEW_REQUIRED';

                  return (
                    <div
                      key={
                        obligation.id
                      }
                      className="
                        group
                        px-5
                        py-4
                        transition
                        hover:bg-[#fafbfe]
                        sm:px-6
                      "
                    >
                      <div
                        className="
                          flex
                          flex-col
                          gap-5
                          xl:flex-row
                          xl:items-center
                          xl:justify-between
                        "
                      >

                        {/* ESQUERDA */}

                        <div
                          className="
                            flex
                            min-w-0
                            items-start
                            gap-3
                          "
                        >
                          <div
                            className={`
                              flex
                              h-11
                              w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : isLate
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-fd-accent-soft text-fd-accent'
                              }
                            `}
                          >
                            {isPaid ? (
                              <CheckCircle2
                                size={20}
                              />
                            ) : isLate ? (
                              <AlertTriangle
                                size={20}
                              />
                            ) : (
                              <FileText
                                size={20}
                              />
                            )}
                          </div>

                          <div
                            className="
                              min-w-0
                            "
                          >

                            {/* TÍTULO */}

                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >
                              <h3
                                className="
                                  min-w-0
                                  text-sm
                                  font-bold
                                  text-[#111b3b]
                                "
                              >
                                {shortTitle}
                              </h3>

                              <span
                                className="
                                  rounded-md
                                  bg-[#f4f6f9]
                                  px-2
                                  py-1
                                  text-xs
                                  font-bold
                                  text-[var(--fd-text-muted)]
                                "
                              >
                                {typeLabel(
                                  obligation.type,
                                )}
                              </span>

                              <span
                                className={`ml-auto rounded-md px-2 py-1 text-xs font-bold ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isLate
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-[var(--fd-warning-soft)] text-fd-warning'
                                }`}
                              >
                                {statusLabel(obligation.status)}
                              </span>

                              {needsReview && (
                                <span title="Revisão necessária: confirme o valor antes de efetuar o pagamento." className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fd-warning">
                                  <AlertTriangle aria-hidden="true" size={16} />
                                  <span className="sr-only">Revisão necessária</span>
                                </span>
                              )}
                            </div>

                            {/* DATA / PERÍODO */}

                            <div
                              className="
                                mt-2
                                flex
                                flex-wrap
                                items-center
                                gap-x-4
                                gap-y-2
                              "
                            >
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  text-xs
                                  text-[var(--fd-text-muted)]
                                "
                              >
                                <CalendarDays
                                  size={13}
                                />

                                Vencimento:

                                <strong
                                  className="
                                    font-semibold
                                    text-[#526080]
                                  "
                                >
                                  {formatDate(
                                    obligation.dueDate,
                                  )}
                                </strong>
                              </span>

                              {obligation.period && (
                                <span
                                  className="
                                    text-xs
                                    text-[var(--fd-text-muted)]
                                  "
                                >
                                  Período:{' '}

                                  <strong
                                    className="
                                      font-semibold
                                      text-[#526080]
                                    "
                                  >
                                    {
                                      obligation.period
                                    }
                                  </strong>
                                </span>
                              )}
                            </div>

                            {fullDescription && (
                              <details className="mt-2 max-w-[650px] text-xs leading-5 text-[var(--fd-text-secondary)]">
                                <summary className="cursor-pointer font-semibold text-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-focus">
                                  Ver descrição completa
                                </summary>
                                <p className="mt-1">{fullDescription}</p>
                              </details>
                            )}

                            {obligation.calculation && (
                              <details className="mt-3 max-w-[650px] rounded-lg border border-[#eef0f5] bg-[#fafbfe] px-3 py-2 text-xs text-[var(--fd-text-muted)]">
                                <summary className="cursor-pointer font-semibold text-[#526080]">
                                  Como este valor foi calculado
                                </summary>
                                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                                  <span>Período: {obligation.calculation.period || obligation.period || '—'}</span>
                                  <span>Origem: {obligation.calculation.origin?.calendarTitle || 'Calendário fiscal'}</span>
                                  {obligation.calculation.amounts && (
                                    <>
                                      <span>Base: {formatCurrency(obligation.calculation.amounts.taxableAmount)}</span>
                                      <span>Imposto apurado: {formatCurrency(obligation.calculation.amounts.taxDueAmount)}</span>
                                      <span>Dedução confirmada: {formatCurrency(obligation.calculation.amounts.deductibleAmount)}</span>
                                      <span>Resultado: {formatCurrency(obligation.calculation.amounts.finalAmount)}</span>
                                    </>
                                  )}
                                </div>
                                {obligation.calculation.message && (
                                  <p className="mt-2 leading-5">{obligation.calculation.message}</p>
                                )}
                                {obligation.calculation.rule?.sourceUrl && (
                                  <a
                                    className="mt-2 inline-block font-semibold text-fd-accent hover:underline"
                                    href={obligation.calculation.rule.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Consultar fonte da regra
                                  </a>
                                )}
                              </details>
                            )}
                          </div>
                        </div>

                        {/* DIREITA */}

                        <div
                          className="
                            flex
                            flex-col
                            gap-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                            xl:justify-end
                          "
                        >

                          {/* VALOR */}

                          <div
                            className="
                              min-w-[170px]
                              sm:text-right
                            "
                          >
                            <p
                              className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wider
                                text-[var(--fd-text-muted)]
                              "
                            >
                              Valor da obrigação
                            </p>

                            <p
                              className={`
                                mt-1
                                text-[16px]
                                font-extrabold
                                ${needsReview ? 'text-[var(--fd-text-muted)]' : 'text-[#111b3b]'}
                              `}
                            >
                              {needsReview
                                ? 'Por confirmar'
                                : amount === null
                                  ? 'Montante ainda não determinado'
                                  : formatCurrency(amount)}
                            </p>

                            {needsReview && (
                              <p className="mt-1 text-xs text-[var(--fd-text-muted)]">
                                Valor registado: {formatCurrency(amount)}
                              </p>
                            )}
                          </div>

                          {/* PAGAMENTO */}

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingPaymentId(
                                  obligation.id,
                                )
                              }
                              disabled={
                                payingId ===
                                obligation.id
                              }
                              className="
                                inline-flex
                                h-11
                                items-center
                                justify-center
                                gap-2
                                whitespace-nowrap
                                rounded-fd-field
                                border
                                border-[var(--fd-border)]
                                bg-white
                                px-4
                                text-xs
                                font-bold
                                text-fd-accent
                                transition
                                hover:bg-[var(--fd-accent-soft)]
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                            >
                              {payingId ===
                              obligation.id ? (
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <CircleDollarSign
                                  size={15}
                                />
                              )}

                              {payingId ===
                              obligation.id
                                ? 'Atualizando...'
                                : 'Marcar como paga'}
                            </button>
                          )}

                          {isPaid && (
                            <div
                              className="
                                flex
                                h-10
                                items-center
                                gap-2
                                rounded-xl
                                bg-emerald-50
                                px-4
                                text-xs
                                font-bold
                                text-emerald-700
                              "
                            >
                              <CheckCircle2
                                size={14}
                              />

                              Pagamento concluído
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                    })}
                  </section>
                ) : null
              ))}
            </div>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          {!loading &&
            filteredObligations.length >
              0 && (
              <div
                className="
                  flex
                  flex-col
                  gap-2
                  border-t
                  border-[#eef0f5]
                  bg-[#fafbfe]
                  px-5
                  py-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  sm:px-6
                "
              >
                <p
                  className="
                    text-xs
                    text-[var(--fd-text-muted)]
                  "
                >
                  A mostrar{' '}

                  <span
                    className="
                      font-bold
                      text-[#526080]
                    "
                  >
                    {
                      filteredObligations.length
                    }
                  </span>

                  {' '}de{' '}

                  <span
                    className="
                      font-bold
                      text-[#526080]
                    "
                  >
                    {
                      obligations.length
                    }
                  </span>

                  {' '}obrigações
                </p>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    text-[var(--fd-text-muted)]
                  "
                >
                  <ShieldCheck
                    size={13}
                  />

                  <span>
                    {currentRegimeLabel}
                  </span>

                </div>
              </div>
            )}
        </section>
      </div>
      <ConfirmDialog
        confirmLabel="Marcar como paga"
        description="Tem a certeza de que deseja marcar esta obrigação como paga?"
        loading={Boolean(pendingPaymentId && payingId === pendingPaymentId)}
        onClose={() => setPendingPaymentId(null)}
        onConfirm={async () => {
          if (!pendingPaymentId) {
            return;
          }

          const obligationId = pendingPaymentId;
          await handlePay(obligationId);
          setPendingPaymentId(null);
        }}
        open={Boolean(pendingPaymentId)}
        title="Marcar obrigação como paga"
      />
    </DashboardLayout>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  title,
  value,
  description,
  icon,
  type,
  onClick,
  active = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  type:
    | 'info'
    | 'orange'
    | 'green'
    | 'red';
  onClick?: () => void;
  active?: boolean;
}) {
  const styles = {
    info: {
      border:
        'border-[var(--fd-border)]',
      icon:
        'bg-fd-accent-soft text-fd-accent',
    },

    orange: {
      border:
        'border-[#fedfbe]',
      icon:
        'bg-[#fff1df] text-fd-warning',
    },

    green: {
      border:
        'border-[#c9f2df]',
      icon:
        'bg-[#ecfdf5] text-fd-success',
    },

    red: {
      border:
        'border-[#ffd7d7]',
      icon:
        'bg-[#fff1f1] text-fd-danger',
    },
  };

  const style =
    styles[type];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`
        relative
        w-full
        text-left
        border-b
        border-slate-200
        p-5
        last:border-b-0
        xl:border-b-0
        xl:border-r
        xl:last:border-r-0
        transition-colors
        hover:bg-[var(--fd-surface-muted)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-inset
        focus-visible:ring-fd-focus
        ${active ? 'bg-[var(--fd-accent-soft)]' : ''}
      `}
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-xs
              font-medium
              uppercase
              tracking-wider
              text-slate-500
            "
          >
            {title}
          </p>

          <p
            className="
              mt-2
              text-xl
              font-semibold
              tabular-nums
              tracking-tight
              text-slate-950
            "
          >
            {value}
          </p>

          <p
            className="
              mt-1
              text-xs
              font-medium
              text-slate-600
            "
          >
            {description}
          </p>
        </div>

        <div
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-md
            ${style.icon}
          `}
        >
          {icon}
        </div>
      </div>
    </button>
  );
}
