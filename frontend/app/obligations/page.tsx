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
  ArrowUpRight,
  Search,
  Filter,
  ChevronRight,
  WalletCards,
  Building2,
  ShieldCheck,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

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
    'pt-PT',
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
          'border-[#ddd9ff] bg-[#f5f3ff]',
        icon:
          'bg-[#e9e5ff] text-[#5146e5]',
        text:
          'text-[#5146e5]',
        dot:
          'bg-[#5146e5]',
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

    case 'RETENCAO':
      return 'Retenção';

    default:
      return type;
  }
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

  /* =====================================================
     REGIME REAL DA EMPRESA
  ===================================================== */

  const currentRegime =
    useMemo(
      () =>
        normalizeRegime(
          company.regime,
        ),
      [company.regime],
    );

  const currentRegimeLabel =
    useMemo(
      () =>
        regimeLabel(
          company.regime,
        ),
      [company.regime],
    );

  const currentRegimeStyles =
    useMemo(
      () =>
        regimeStyles(
          company.regime,
        ),
      [company.regime],
    );

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
      const confirmed =
        window.confirm(
          'Tem certeza que deseja marcar esta obrigação como paga?',
        );

      if (!confirmed) {
        return;
      }

      try {
        setPayingId(id);
        setError('');

        await payObligation(
          id,
        );

        await loadObligations();
      } catch (
        err: any
      ) {
        console.error(
          'Erro ao marcar obrigação como paga:',
          err,
        );

        setError(
          err?.response?.data?.message ||
            'Não foi possível atualizar o pagamento.',
        );
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
            matchesSearch
          );
        },
      );
    }, [
      obligations,
      search,
      filter,
      currentRegimeLabel,
    ]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <DashboardLayout>
      <div
        className="
          mx-auto
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
          "
        >
          <div
            className="
              min-w-0
            "
          >

            <div
              className="
                mb-2
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-[#e3defe]
                bg-[#f5f3ff]
                px-3
                py-1.5
                text-[10px]
                font-bold
                uppercase
                tracking-wider
                text-[#5146e5]
              "
            >
              <FileText
                size={13}
              />

              Gestão fiscal
            </div>

            <h1
              className="
                text-[28px]
                font-extrabold
                tracking-tight
                text-[#111b3b]
                sm:text-[32px]
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
                text-[#7180a2]
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
              rounded-xl
              bg-[#5146e5]
              px-5
              text-[11px]
              font-bold
              text-white
              shadow-lg
              shadow-indigo-100
              transition
              hover:bg-[#4338ca]
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
                    rounded-2xl
                    bg-[#f0edff]
                    text-[#5146e5]
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
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-[#8a96b0]
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
                      text-[10px]
                      text-[#7180a2]
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
                      text-[8px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-[#8a96b0]
                    "
                  >
                    Regime fiscal
                  </p>

                  <p
                    className={`
                      mt-0.5
                      text-[11px]
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
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#8a96b0]
                  "
                >
                  Regime utilizado pelo sistema
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
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
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#8a96b0]
                  "
                >
                  Sector
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
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
                  bg-[#f0edff]
                  text-[#5146e5]
                "
              >
                <CalendarDays
                  size={19}
                />
              </div>

              <div>
                <p
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#8a96b0]
                  "
                >
                  Calendário fiscal
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
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
                text-[10px]
                leading-5
                text-[#7180a2]
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
                  text-[9px]
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
                  text-[11px]
                  leading-5
                "
              >
                {error}
              </p>
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
            gap-4
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
            type="purple"
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
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#8a96b0]
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
                    text-[11px]
                    text-[#7180a2]
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
                  bg-[#f0edff]
                  text-[#5146e5]
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
                  bg-[#5146e5]
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
                  text-[10px]
                  font-medium
                  text-[#7180a2]
                "
              >
                Taxa de conclusão
              </span>

              <span
                className="
                  text-[11px]
                  font-bold
                  text-[#5146e5]
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
                  text-[#ea580c]
                "
              >
                <CalendarDays
                  size={19}
                />
              </div>

              <div>
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#8a96b0]
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
                text-[11px]
                leading-5
                text-[#7180a2]
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
                  text-[10px]
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
                text-[10px]
                font-bold
                text-[#5146e5]
                transition
                hover:bg-[#f0edff]
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

              Atualizar calendário
            </button>
          </div>
        </section>

        {/* =================================================
            LISTA
        ================================================= */}

        <section
          className="
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
                    text-[10px]
                    text-[#7180a2]
                    sm:text-[11px]
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
                    className="text-[#8a96b0]"
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
                      text-[11px]
                      text-[#111b3b]
                      outline-none
                      placeholder:text-[#9aa4b8]
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
                    className="text-[#8a96b0]"
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
                      text-[11px]
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
              </div>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div
              className="
                flex
                min-h-[360px]
                flex-col
                items-center
                justify-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#f0edff]
                  text-[#5146e5]
                "
              >
                <Loader2
                  size={22}
                  className="animate-spin"
                />
              </div>

              <p
                className="
                  text-[12px]
                  font-semibold
                  text-[#526080]
                "
              >
                A carregar obrigações...
              </p>

              <p
                className="
                  text-[10px]
                  text-[#8a96b0]
                "
              >
                A obter dados da empresa.
              </p>
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
                  bg-[#f0edff]
                  text-[#5146e5]
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
                  text-[11px]
                  leading-5
                  text-[#7180a2]
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
                    bg-[#5146e5]
                    px-4
                    py-2.5
                    text-[10px]
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
              {filteredObligations.map(
                (
                  obligation,
                ) => {
                  const isPaid =
                    obligation.status ===
                    'PAID';

                  const isLate =
                    obligation.status ===
                    'LATE';

                  const amount =
                    Number(
                      obligation.amount ||
                        0,
                    );

                  const description =
                    cleanCalendarDescription(
                      obligation.description,
                    );

                  return (
                    <div
                      key={
                        obligation.id
                      }
                      className="
                        group
                        p-5
                        transition
                        hover:bg-[#fafbfe]
                        sm:p-6
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
                            gap-4
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
                                    : 'bg-[#f0edff] text-[#5146e5]'
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
                                  truncate
                                  text-[13px]
                                  font-bold
                                  text-[#111b3b]
                                  sm:text-[14px]
                                "
                              >
                                {
                                  obligation.title
                                }
                              </h3>

                              <span
                                className="
                                  rounded-md
                                  bg-[#f4f6f9]
                                  px-2
                                  py-1
                                  text-[9px]
                                  font-bold
                                  text-[#65718a]
                                "
                              >
                                {typeLabel(
                                  obligation.type,
                                )}
                              </span>
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
                                  text-[10px]
                                  text-[#7180a2]
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
                                    text-[10px]
                                    text-[#7180a2]
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

                            {/* REGIME REAL */}

                            <div
                              className="
                                mt-2
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >
                              <span
                                className={`
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-md
                                  border
                                  px-2
                                  py-1
                                  text-[9px]
                                  font-bold
                                  ${currentRegimeStyles.wrapper}
                                  ${currentRegimeStyles.text}
                                `}
                              >
                                <ShieldCheck
                                  size={11}
                                />

                                {currentRegimeLabel}
                              </span>

                              {company.sector && (
                                <span
                                  className="
                                    text-[9px]
                                    text-[#8792a8]
                                  "
                                >
                                  Sector:{' '}

                                  <strong
                                    className="
                                      font-semibold
                                      text-[#65718a]
                                    "
                                  >
                                    {
                                      company.sector
                                    }
                                  </strong>
                                </span>
                              )}
                            </div>

                            {/* DESCRIÇÃO */}

                            {description && (
                              <p
                                className="
                                  mt-2
                                  max-w-[650px]
                                  text-[10px]
                                  leading-5
                                  text-[#8792a8]
                                "
                              >
                                {description}
                              </p>
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
                                text-[9px]
                                font-semibold
                                uppercase
                                tracking-wider
                                text-[#8a96b0]
                              "
                            >
                              Valor da obrigação
                            </p>

                            <p
                              className="
                                mt-1
                                text-[16px]
                                font-extrabold
                                text-[#111b3b]
                              "
                            >
                              {formatCurrency(
                                amount,
                              )}
                            </p>

                            <span
                              className={`
                                mt-2
                                inline-flex
                                rounded-lg
                                px-2.5
                                py-1
                                text-[9px]
                                font-bold
                                ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isLate
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-orange-50 text-orange-700'
                                }
                              `}
                            >
                              {statusLabel(
                                obligation.status,
                              )}
                            </span>
                          </div>

                          {/* PAGAMENTO */}

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() =>
                                handlePay(
                                  obligation.id,
                                )
                              }
                              disabled={
                                payingId ===
                                obligation.id
                              }
                              className="
                                inline-flex
                                h-10
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                border
                                border-[#ddd9ff]
                                bg-white
                                px-4
                                text-[10px]
                                font-bold
                                text-[#5146e5]
                                transition
                                hover:bg-[#f5f3ff]
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
                                text-[10px]
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

                          <ChevronRight
                            size={17}
                            className="
                              hidden
                              text-[#c1c7d4]
                              transition
                              group-hover:text-[#5146e5]
                              xl:block
                            "
                          />
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
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
                    text-[10px]
                    text-[#8a96b0]
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
                    text-[10px]
                    font-semibold
                    text-[#7180a2]
                  "
                >
                  <ShieldCheck
                    size={13}
                  />

                  <span>
                    {currentRegimeLabel}
                  </span>

                  <ArrowUpRight
                    size={13}
                  />
                </div>
              </div>
            )}
        </section>
      </div>
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
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  type:
    | 'purple'
    | 'orange'
    | 'green'
    | 'red';
}) {
  const styles = {
    purple: {
      border:
        'border-[#ddd9ff]',
      icon:
        'bg-[#f0edff] text-[#5146e5]',
    },

    orange: {
      border:
        'border-[#fedfbe]',
      icon:
        'bg-[#fff1df] text-[#ea580c]',
    },

    green: {
      border:
        'border-[#c9f2df]',
      icon:
        'bg-[#ecfdf5] text-[#059669]',
    },

    red: {
      border:
        'border-[#ffd7d7]',
      icon:
        'bg-[#fff1f1] text-[#dc2626]',
    },
  };

  const style =
    styles[type];

  return (
    <div
      className={`
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
              text-[10px]
              font-semibold
              uppercase
              tracking-wider
              text-[#8a96b0]
            "
          >
            {title}
          </p>

          <p
            className="
              mt-2
              text-[26px]
              font-extrabold
              tracking-tight
              text-[#111b3b]
            "
          >
            {value}
          </p>

          <p
            className="
              mt-1
              text-[10px]
              font-medium
              text-[#7180a2]
            "
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
            ${style.icon}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}