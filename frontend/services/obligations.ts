import api from './api';

// ============================================================
// ENUMS
// ============================================================

export type ObligationType =
  | 'IVA'
  | 'IEC'
  | 'II'
  | 'IAC'
  | 'IRT'
  | 'IP'
  | 'IVM'
  | 'IEJ'
  | 'IS'
  | 'CEOC'
  | 'IRP'
  | 'RCN'
  | 'TS'
  | 'CFQA'
  | 'ITP'
  | 'IPP'
  | 'IVRM'
  | 'INDUSTRIAL'
  | 'SELO'
  | 'SS'
  | 'TAXA_GAS'
  | 'DECLARACAO'
  | 'PAGAMENTO'
  | 'RETENCAO'
  | 'SAFT'
  | 'OUTRA';

export type ObligationStatus =
  | 'PENDING'
  | 'PAID'
  | 'LATE';

export type FiscalRegime =
  | 'GERAL'
  | 'SIMPLIFICADO'
  | 'PRESTADOR_SERVICO';

export type TaxType =
  | 'IVA'
  | 'IEC'
  | 'II'
  | 'IAC'
  | 'IRT'
  | 'IP'
  | 'IVM'
  | 'IEJ'
  | 'IS'
  | 'CEOC'
  | 'IRP'
  | 'RCN'
  | 'TS'
  | 'CFQA'
  | 'ITP'
  | 'IPP'
  | 'IVRM'
  | 'INDUSTRIAL'
  | 'SELO'
  | 'SS'
  | 'TAXA_GAS';

// ============================================================
// REGIME FISCAL
// ============================================================

export type FiscalRegimeInfo = {
  id?: string;
  regime: FiscalRegime;
};

// ============================================================
// CALENDÁRIO FISCAL
// ============================================================

export type FiscalCalendar = {
  id: string;

  code?: string | null;

  title: string;

  taxType: TaxType;

  obligationType: ObligationType;

  description?: string | null;

  period?: string | null;

  referenceYear: number;

  dueDate: string;

  officialReference?: string | null;

  source?: string | null;

  sourceUrl?: string | null;

  active: boolean;

  regimes?: FiscalRegimeInfo[];
};

// ============================================================
// OBRIGAÇÃO
// ============================================================

export type Obligation = {
  id: string;

  tenantId: string;

  fiscalCalendarId?: string | null;

  type: ObligationType;

  title: string;

  description?: string | null;

  amount?: number | null;

  dueDate: string;

  period?: string | null;

  status: ObligationStatus;

  alertEnabled: boolean;

  alertDaysBefore: number;

  reminderSent: boolean;

  lastReminderAt?: string | null;

  createdAt: string;

  updatedAt: string;

  fiscalCalendar?: FiscalCalendar | null;
};

// ============================================================
// RESUMO FINANCEIRO DA OBRIGAÇÃO
// ============================================================

export type ObligationAmounts = {
  totalAmount: number;

  pendingAmount: number;

  paidAmount: number;
};

// ============================================================
// INFORMAÇÃO DA FONTE FISCAL
// ============================================================

export type FiscalDataSource = {
  name: string;

  official: boolean;
};

// ============================================================
// SINCRONIZAÇÃO
// ============================================================

export type SyncObligationsData = {
  referenceYear?: number;
};

export type SyncObligationsResponse = {
  success?: boolean;

  tenant?: {
    id: string;

    name: string;

    nif?: string | null;

    regime?: FiscalRegime;
  };

  year?: number;

  calendarRules?: number;

  ignoredCalendarRules?: number;

  created: number;

  updated: number;

  late: number;

  backfilledPayments?: number;

  synchronizedAt?: string;
};

// ============================================================
// DASHBOARD FISCAL
// ============================================================

export type ObligationDashboard = {
  total: number;

  pending: number;

  paid: number;

  late: number;

  totalAmount: number;

  pendingAmount: number;

  paidAmount: number;

  upcoming: Obligation[];

  overdue: Obligation[];

  source?: FiscalDataSource;

  synchronizedAt?: string;
};

// ============================================================
// FILTROS
// ============================================================

export type ObligationFilters = {
  status?: ObligationStatus;

  type?: ObligationType;

  taxType?: TaxType;

  period?: string;

  referenceYear?: number;

  fromDate?: string;

  toDate?: string;
};

// ============================================================
// RESULTADO DE PAGAMENTO
// ============================================================

export type PayObligationResponse = Obligation;

// ============================================================
// RESULTADO DE REMOÇÃO
// ============================================================

export type RemoveObligationResponse = {
  id: string;
};

// ============================================================
// NORMALIZAR NÚMERO
// ============================================================

const toNumber = (
  value: unknown,
): number => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

// ============================================================
// VERIFICAR SE ESTÁ ATRASADA
// ============================================================
//
// Esta função serve apenas como proteção visual no frontend.
//
// A fonte oficial do estado continua sendo o backend.
// ============================================================

export const isObligationOverdue = (
  obligation: Obligation,
): boolean => {
  if (
    obligation.status === 'LATE'
  ) {
    return true;
  }

  if (
    obligation.status === 'PAID'
  ) {
    return false;
  }

  const dueDate =
    new Date(
      obligation.dueDate,
    );

  if (
    Number.isNaN(
      dueDate.getTime(),
    )
  ) {
    return false;
  }

  return (
    dueDate.getTime() <
    Date.now()
  );
};

// ============================================================
// VERIFICAR SE ESTÁ PENDENTE
// ============================================================

export const isObligationPending = (
  obligation: Obligation,
): boolean => {
  return (
    obligation.status ===
    'PENDING'
  );
};

// ============================================================
// VERIFICAR SE FOI PAGA
// ============================================================

export const isObligationPaid = (
  obligation: Obligation,
): boolean => {
  return (
    obligation.status ===
    'PAID'
  );
};

// ============================================================
// VALOR DA OBRIGAÇÃO
// ============================================================

export const getObligationAmount = (
  obligation: Obligation,
): number => {
  return toNumber(
    obligation.amount,
  );
};

// ============================================================
// FORMATAR VALOR EM KWANZA
// ============================================================

export const formatObligationAmount = (
  value: unknown,
): string => {
  return toNumber(
    value,
  ).toLocaleString(
    'pt-AO',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
};

// ============================================================
// CALCULAR DIAS ATÉ AO VENCIMENTO
// ============================================================

export const getDaysUntilDue = (
  obligation: Obligation,
): number | null => {
  const dueDate =
    new Date(
      obligation.dueDate,
    );

  if (
    Number.isNaN(
      dueDate.getTime(),
    )
  ) {
    return null;
  }

  const now =
    new Date();

  const today =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

  const due =
    new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
    );

  const difference =
    due.getTime() -
    today.getTime();

  return Math.ceil(
    difference /
      (1000 *
        60 *
        60 *
        24),
  );
};

// ============================================================
// TEXTO DO ESTADO
// ============================================================

export const getObligationStatusLabel = (
  status: ObligationStatus,
): string => {
  switch (status) {
    case 'PAID':
      return 'Paga';

    case 'LATE':
      return 'Em atraso';

    case 'PENDING':
      return 'Pendente';

    default:
      return status;
  }
};

// ============================================================
// LISTAR OBRIGAÇÕES
// ============================================================
//
// O backend é responsável por:
// - identificar a empresa pelo JWT
// - aplicar o regime fiscal
// - sincronizar o calendário
// - calcular valores reais
// - marcar obrigações atrasadas
//
// O frontend apenas apresenta os dados devolvidos.
// ============================================================

export const getObligations = async (
  referenceYear?: number,
): Promise<Obligation[]> => {
  const response =
    await api.get(
      '/obligations',
      {
        params:
          referenceYear
            ? {
                referenceYear,
              }
            : undefined,
      },
    );

  return Array.isArray(
    response.data,
  )
    ? response.data
    : [];
};

// ============================================================
// DASHBOARD DE OBRIGAÇÕES
// ============================================================

export const getObligationsDashboard =
  async (): Promise<ObligationDashboard> => {
    const response =
      await api.get(
        '/obligations/dashboard',
      );

    const data =
      response.data ?? {};

    return {
      total:
        toNumber(
          data.total,
        ),

      pending:
        toNumber(
          data.pending,
        ),

      paid:
        toNumber(
          data.paid,
        ),

      late:
        toNumber(
          data.late,
        ),

      totalAmount:
        toNumber(
          data.totalAmount,
        ),

      pendingAmount:
        toNumber(
          data.pendingAmount,
        ),

      paidAmount:
        toNumber(
          data.paidAmount,
        ),

      upcoming:
        Array.isArray(
          data.upcoming,
        )
          ? data.upcoming
          : [],

      overdue:
        Array.isArray(
          data.overdue,
        )
          ? data.overdue
          : [],

      source:
        data.source,

      synchronizedAt:
        data.synchronizedAt,
    };
  };

// ============================================================
// SINCRONIZAR CALENDÁRIO AGT
// ============================================================

export const syncObligations = async (
  data?: SyncObligationsData,
): Promise<SyncObligationsResponse> => {
  const response =
    await api.post(
      '/obligations/sync',
      data ?? {},
    );

  const result =
    response.data ?? {};

  return {
    success:
      result.success,

    tenant:
      result.tenant,

    year:
      result.year,

    calendarRules:
      toNumber(
        result.calendarRules,
      ),

    ignoredCalendarRules:
      toNumber(
        result.ignoredCalendarRules,
      ),

    created:
      toNumber(
        result.created,
      ),

    updated:
      toNumber(
        result.updated,
      ),

    late:
      toNumber(
        result.late,
      ),

    backfilledPayments:
      toNumber(
        result.backfilledPayments,
      ),

    synchronizedAt:
      result.synchronizedAt,
  };
};

// ============================================================
// BUSCAR UMA OBRIGAÇÃO
// ============================================================

export const getObligation = async (
  id: string,
): Promise<Obligation> => {
  if (!id) {
    throw new Error(
      'ID da obrigação não informado.',
    );
  }

  const response =
    await api.get(
      `/obligations/${id}`,
    );

  return response.data;
};

// ============================================================
// MARCAR COMO PAGA
// ============================================================
//
// O pagamento é processado pelo backend.
//
// O backend:
// 1. valida o tenant;
// 2. valida a obrigação;
// 3. verifica o valor;
// 4. muda para PAID;
// 5. cria TaxPayment;
// 6. evita pagamento duplicado.
// ============================================================

export const payObligation = async (
  id: string,
): Promise<PayObligationResponse> => {
  if (!id) {
    throw new Error(
      'ID da obrigação não informado.',
    );
  }

  const response =
    await api.patch(
      `/obligations/${id}/pay`,
    );

  return response.data;
};

// ============================================================
// REMOVER OBRIGAÇÃO
// ============================================================
//
// Esta função fica preparada para o futuro caso a interface
// volte a permitir remoção.
//
// A decisão de remover deve ser controlada pelo backend.
// ============================================================

export const removeObligation = async (
  id: string,
): Promise<RemoveObligationResponse> => {
  if (!id) {
    throw new Error(
      'ID da obrigação não informado.',
    );
  }

  const response =
    await api.delete(
      `/obligations/${id}`,
    );

  return response.data;
};

// ============================================================
// FILTRAR OBRIGAÇÕES NO FRONTEND
// ============================================================
//
// Utilitário para páginas que precisem de filtros locais.
// Não substitui as regras fiscais do backend.
// ============================================================

export const filterObligations = (
  obligations: Obligation[],
  filters: ObligationFilters,
): Obligation[] => {
  if (
    !Array.isArray(
      obligations,
    )
  ) {
    return [];
  }

  return obligations.filter(
    (obligation) => {
      if (
        filters.status &&
        obligation.status !==
          filters.status
      ) {
        return false;
      }

      if (
        filters.type &&
        obligation.type !==
          filters.type
      ) {
        return false;
      }

      if (
        filters.taxType &&
        obligation
          .fiscalCalendar
          ?.taxType !==
          filters.taxType
      ) {
        return false;
      }

      if (
        filters.period &&
        obligation.period !==
          filters.period
      ) {
        return false;
      }

      if (
        filters.referenceYear
      ) {
        const year =
          new Date(
            obligation.dueDate,
          ).getFullYear();

        if (
          year !==
          filters.referenceYear
        ) {
          return false;
        }
      }

      if (
        filters.fromDate
      ) {
        const date =
          new Date(
            obligation.dueDate,
          );

        const from =
          new Date(
            filters.fromDate,
          );

        if (
          date < from
        ) {
          return false;
        }
      }

      if (
        filters.toDate
      ) {
        const date =
          new Date(
            obligation.dueDate,
          );

        const to =
          new Date(
            filters.toDate,
          );

        if (
          date > to
        ) {
          return false;
        }
      }

      return true;
    },
  );
};

// ============================================================
// SEPARAR OBRIGAÇÕES ATRASADAS
// ============================================================

export const getOverdueObligations = (
  obligations: Obligation[],
): Obligation[] => {
  if (
    !Array.isArray(
      obligations,
    )
  ) {
    return [];
  }

  return obligations.filter(
    isObligationOverdue,
  );
};

// ============================================================
// SEPARAR OBRIGAÇÕES PENDENTES
// ============================================================

export const getPendingObligations = (
  obligations: Obligation[],
): Obligation[] => {
  if (
    !Array.isArray(
      obligations,
    )
  ) {
    return [];
  }

  return obligations.filter(
    (obligation) =>
      obligation.status ===
      'PENDING',
  );
};

// ============================================================
// SEPARAR OBRIGAÇÕES PAGAS
// ============================================================

export const getPaidObligations = (
  obligations: Obligation[],
): Obligation[] => {
  if (
    !Array.isArray(
      obligations,
    )
  ) {
    return [];
  }

  return obligations.filter(
    (obligation) =>
      obligation.status ===
      'PAID',
  );
};

// ============================================================
// ORDENAR POR VENCIMENTO
// ============================================================

export const sortObligationsByDueDate = (
  obligations: Obligation[],
): Obligation[] => {
  if (
    !Array.isArray(
      obligations,
    )
  ) {
    return [];
  }

  return [
    ...obligations,
  ].sort(
    (a, b) =>
      new Date(
        a.dueDate,
      ).getTime() -
      new Date(
        b.dueDate,
      ).getTime(),
  );
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

const obligationsService = {
  getObligations,
  getObligationsDashboard,
  syncObligations,
  getObligation,
  payObligation,
  removeObligation,

  isObligationOverdue,
  isObligationPending,
  isObligationPaid,

  getObligationAmount,
  formatObligationAmount,
  getDaysUntilDue,
  getObligationStatusLabel,

  filterObligations,
  getOverdueObligations,
  getPendingObligations,
  getPaidObligations,
  sortObligationsByDueDate,
};

export default obligationsService;