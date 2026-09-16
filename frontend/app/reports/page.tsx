'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';
import { getInvoices } from '@/services/invoice';
import { getEmployees } from '@/services/employee';

import api from '@/services/api';

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Receipt,
  RefreshCw,
  TrendingUp,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* =========================================================
   TIPOS
========================================================= */

type Invoice = {
  id: string;
  invoiceNumber?: string;
  subtotal?: number | string;
  iva?: number | string;
  total?: number | string;
  status?: string;
  createdAt?: string;
  issueDate?: string;
  client?: {
    name?: string;
    nif?: string;
  };
};

type Employee = {
  id: string;
  name?: string;
  employeeNumber?: string | null;
  status?: string;
  jobTitle?: string | null;
  department?: string | null;
};

type Obligation = {
  id: string;
  title?: string;
  type?: string;
  amount?: number | string | null;
  dueDate?: string;
  status?: string;
};

type Payment = {
  id: string;
  amount?: number | string;
  taxType?: string;
  paidAt?: string;
  reference?: string | null;
};

type Company = {
  id: string;
  tenantId?: string;
  name?: string;
  legalName?: string;
  nif?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function numberValue(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAOA(value: number): string {
  return `${value.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Kz`;
}

function formatCompactAOA(value: number): string {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} mil M Kz`;
  }

  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} M Kz`;
  }

  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(0)} mil Kz`;
  }

  return formatAOA(value);
}

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('pt-AO');
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case 'PAID':
      return 'Paga';

    case 'PENDING':
      return 'Pendente';

    case 'LATE':
      return 'Em atraso';

    case 'CANCELLED':
      return 'Cancelada';

    case 'ACTIVE':
      return 'Activo';

    case 'INACTIVE':
      return 'Inactivo';

    case 'SUSPENDED':
      return 'Suspenso';

    case 'TERMINATED':
      return 'Terminado';

    case 'PARTIAL':
      return 'Parcial';

    default:
      return status || '—';
  }
}

function getStatusClass(status?: string): string {
  switch (status) {
    case 'PAID':
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';

    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-100';

    case 'LATE':
    case 'TERMINATED':
      return 'bg-red-50 text-red-700 border-red-100';

    case 'CANCELLED':
    case 'INACTIVE':
    case 'SUSPENDED':
      return 'bg-slate-100 text-slate-600 border-slate-200';

    case 'PARTIAL':
      return 'bg-blue-50 text-blue-700 border-blue-100';

    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function normalizeArray(responseData: any): any[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData === 'object' &&
    Array.isArray(responseData.data)
  ) {
    return responseData.data;
  }

  if (
    responseData &&
    typeof responseData === 'object' &&
    Array.isArray(responseData.items)
  ) {
    return responseData.items;
  }

  if (
    responseData &&
    typeof responseData === 'object' &&
    Array.isArray(responseData.obligations)
  ) {
    return responseData.obligations;
  }

  if (
    responseData &&
    typeof responseData === 'object' &&
    Array.isArray(responseData.payments)
  ) {
    return responseData.payments;
  }

  return [];
}

function getMonthName(month: number): string {
  const names = [
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

  return names[month - 1] || '';
}

function getTaxLabel(taxType?: string): string {
  const labels: Record<string, string> = {
    IVA: 'IVA',
    IRT: 'IRT',
    INDUSTRIAL: 'Imposto Industrial',
    SELO: 'Imposto do Selo',
    SS: 'Segurança Social',
    IEC: 'IEC',
    II: 'Imposto de Importação',
    IP: 'Imposto Predial',
    IRPC: 'IRPC',
  };

  return labels[taxType || ''] || taxType || 'Outros';
}

/* =========================================================
   TOOLTIP PERSONALIZADO
========================================================= */

function ChartTooltip({
  active,
  payload,
  label,
}: any) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      {label && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      )}

      {payload.map((item: any, index: number) => (
        <div
          key={`${item.name}-${index}`}
          className="flex items-center gap-3"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor:
                item.color || item.fill || '#2563eb',
            }}
          />

          <span className="text-sm text-slate-500">
            {item.name || 'Valor'}
          </span>

          <strong className="text-sm text-slate-900">
            {formatAOA(numberValue(item.value))}
          </strong>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function ReportsPage() {
  const [company, setCompany] =
    useState<Company | null>(null);

  const [invoices, setInvoices] =
    useState<Invoice[]>([]);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [obligations, setObligations] =
    useState<Obligation[]>([]);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [selectedYear, setSelectedYear] =
    useState(new Date().getFullYear());

  /* =======================================================
     CARREGAR DADOS
  ======================================================= */

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      setError('');

      const results =
        await Promise.allSettled([
          getCompany(),
          getInvoices(),
          getEmployees(),
          api.get('/obligations'),
          api.get('/payments'),
        ]);

      /* EMPRESA */

      const companyResult = results[0];

      if (
        companyResult.status === 'fulfilled'
      ) {
        setCompany(companyResult.value);
      }

      /* FACTURAS */

      const invoicesResult = results[1];

      if (
        invoicesResult.status === 'fulfilled'
      ) {
        setInvoices(
          Array.isArray(
            invoicesResult.value,
          )
            ? invoicesResult.value
            : [],
        );
      } else {
        console.error(
          'Erro ao carregar facturas:',
          invoicesResult.reason,
        );

        setInvoices([]);
      }

      /* FUNCIONÁRIOS */

      const employeesResult = results[2];

      if (
        employeesResult.status === 'fulfilled'
      ) {
        setEmployees(
          Array.isArray(
            employeesResult.value,
          )
            ? employeesResult.value
            : [],
        );
      } else {
        console.error(
          'Erro ao carregar funcionários:',
          employeesResult.reason,
        );

        setEmployees([]);
      }

      /* OBRIGAÇÕES */

      const obligationsResult = results[3];

      if (
        obligationsResult.status === 'fulfilled'
      ) {
        setObligations(
          normalizeArray(
            obligationsResult.value?.data,
          ),
        );
      } else {
        console.error(
          'Erro ao carregar obrigações:',
          obligationsResult.reason,
        );

        setObligations([]);
      }

      /* PAGAMENTOS */

      const paymentsResult = results[4];

      if (
        paymentsResult.status === 'fulfilled'
      ) {
        setPayments(
          normalizeArray(
            paymentsResult.value?.data,
          ),
        );
      } else {
        console.error(
          'Erro ao carregar pagamentos:',
          paymentsResult.reason,
        );

        setPayments([]);
      }
    } catch (err) {
      console.error(
        'Erro ao carregar relatórios:',
        err,
      );

      setError(
        'Não foi possível carregar os dados dos relatórios.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);

    await loadData();
  }

  /* =======================================================
     EXPORTAR CSV
  ======================================================= */

  function handleExportCSV() {
    const rows = [
      [
        'Factura',
        'Cliente',
        'Data',
        'Subtotal',
        'IVA',
        'Total',
        'Estado',
      ],
      ...reportData.yearInvoices.map(
        (invoice) => [
          invoice.invoiceNumber || '',
          invoice.client?.name || '',
          formatDate(
            invoice.issueDate ||
              invoice.createdAt,
          ),
          numberValue(
            invoice.subtotal,
          ).toFixed(2),
          numberValue(
            invoice.iva,
          ).toFixed(2),
          numberValue(
            invoice.total,
          ).toFixed(2),
          getStatusLabel(
            invoice.status,
          ),
        ],
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replaceAll(
              '"',
              '""',
            )}"`,
          )
          .join(','),
      )
      .join('\n');

    const blob = new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8;',
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download = `relatorio-fiscal-${selectedYear}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  /* =======================================================
     DADOS DO RELATÓRIO
  ======================================================= */

  const reportData = useMemo(() => {
    const yearInvoices =
      invoices.filter((invoice) => {
        const dateValue =
          invoice.issueDate ||
          invoice.createdAt;

        if (!dateValue) {
          return false;
        }

        return (
          new Date(
            dateValue,
          ).getFullYear() === selectedYear
        );
      });

    const yearPayments =
      payments.filter((payment) => {
        if (!payment.paidAt) {
          return false;
        }

        return (
          new Date(
            payment.paidAt,
          ).getFullYear() === selectedYear
        );
      });

    const yearObligations =
      obligations.filter((item) => {
        if (!item.dueDate) {
          return true;
        }

        return (
          new Date(
            item.dueDate,
          ).getFullYear() === selectedYear
        );
      });

    /* TOTAL FACTURADO */

    const totalInvoiced =
      yearInvoices.reduce(
        (total, invoice) =>
          total +
          numberValue(invoice.total),
        0,
      );

    /* IVA */

    const totalVat =
      yearInvoices.reduce(
        (total, invoice) =>
          total +
          numberValue(invoice.iva),
        0,
      );

    /* SUBTOTAL */

    const totalSubtotal =
      yearInvoices.reduce(
        (total, invoice) =>
          total +
          numberValue(invoice.subtotal),
        0,
      );

    /* FACTURAS */

    const paidInvoices =
      yearInvoices.filter(
        (invoice) =>
          invoice.status === 'PAID',
      );

    const pendingInvoices =
      yearInvoices.filter(
        (invoice) =>
          invoice.status === 'PENDING',
      );

    const cancelledInvoices =
      yearInvoices.filter(
        (invoice) =>
          invoice.status === 'CANCELLED',
      );

    const otherInvoices =
      yearInvoices.filter(
        (invoice) =>
          ![
            'PAID',
            'PENDING',
            'CANCELLED',
          ].includes(
            invoice.status || '',
          ),
      );

    /* PAGAMENTOS */

    const totalPayments =
      yearPayments.reduce(
        (total, payment) =>
          total +
          numberValue(payment.amount),
        0,
      );

    /* OBRIGAÇÕES */

    const pendingObligations =
      yearObligations.filter(
        (item) =>
          item.status === 'PENDING',
      );

    const paidObligations =
      yearObligations.filter(
        (item) =>
          item.status === 'PAID',
      );

    const lateObligations =
      yearObligations.filter(
        (item) =>
          item.status === 'LATE',
      );

    /* VALORES */

    const pendingObligationAmount =
      pendingObligations.reduce(
        (total, item) =>
          total +
          numberValue(item.amount),
        0,
      );

    const lateObligationAmount =
      lateObligations.reduce(
        (total, item) =>
          total +
          numberValue(item.amount),
        0,
      );

    const paidObligationAmount =
      paidObligations.reduce(
        (total, item) =>
          total +
          numberValue(item.amount),
        0,
      );

    /* FUNCIONÁRIOS */

    const activeEmployees =
      employees.filter(
        (employee) =>
          employee.status === 'ACTIVE',
      );

    /* EVOLUÇÃO MENSAL */

    const monthlyInvoices =
      Array.from(
        { length: 12 },
        (_, index) => {
          const month =
            index + 1;

          const value =
            yearInvoices
              .filter((invoice) => {
                const dateValue =
                  invoice.issueDate ||
                  invoice.createdAt;

                if (!dateValue) {
                  return false;
                }

                const date =
                  new Date(dateValue);

                return (
                  date.getMonth() + 1 ===
                  month
                );
              })
              .reduce(
                (total, invoice) =>
                  total +
                  numberValue(
                    invoice.total,
                  ),
                0,
              );

          return {
            month,
            label:
              getMonthName(month),
            value,
          };
        },
      );

    /* PAGAMENTOS POR IMPOSTO */

    const paymentsByTax =
      yearPayments.reduce<
        Record<string, number>
      >(
        (accumulator, payment) => {
          const tax =
            payment.taxType ||
            'OUTROS';

          accumulator[tax] =
            (accumulator[tax] || 0) +
            numberValue(
              payment.amount,
            );

          return accumulator;
        },
        {},
      );

    const taxDistribution =
      Object.entries(
        paymentsByTax,
      )
        .map(
          ([taxType, value]) => ({
            name:
              getTaxLabel(
                taxType,
              ),
            value,
            taxType,
          }),
        )
        .sort(
          (a, b) =>
            b.value - a.value,
        );

    /* ESTADO DAS FACTURAS */

    const invoiceStatusData = [
      {
        name: 'Pagas',
        value:
          paidInvoices.length,
      },
      {
        name: 'Pendentes',
        value:
          pendingInvoices.length,
      },
      {
        name: 'Canceladas',
        value:
          cancelledInvoices.length,
      },
    ];

    if (otherInvoices.length > 0) {
      invoiceStatusData.push({
        name: 'Outras',
        value:
          otherInvoices.length,
      });
    }

    return {
      yearInvoices,
      yearPayments,
      yearObligations,
      totalInvoiced,
      totalVat,
      totalSubtotal,
      totalPayments,
      paidInvoices,
      pendingInvoices,
      cancelledInvoices,
      otherInvoices,
      pendingObligations,
      paidObligations,
      lateObligations,
      pendingObligationAmount,
      lateObligationAmount,
      paidObligationAmount,
      activeEmployees,
      monthlyInvoices,
      taxDistribution,
      invoiceStatusData,
    };
  }, [
    invoices,
    payments,
    obligations,
    employees,
    selectedYear,
  ]);

  /* =======================================================
     CORES DOS GRÁFICOS
  ======================================================= */

  const invoiceColors = [
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#6366f1',
  ];

  const taxColors = [
    '#2563eb',
    '#06b6d4',
    '#8b5cf6',
    '#f59e0b',
    '#10b981',
    '#ef4444',
  ];

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200">
            <RefreshCw
              size={30}
              className="animate-spin text-indigo-600"
            />
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            A preparar o relatório
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            A carregar os dados fiscais da empresa...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     EMPRESA NÃO ENCONTRADA
  ======================================================= */

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle
              size={32}
              className="text-red-500"
            />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Empresa não encontrada
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Não foi possível carregar os dados da empresa autenticada.
          </p>

          <button
            onClick={handleRefresh}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <RefreshCw size={17} />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <DashboardLayout company={company}>
      <div className="min-h-full space-y-6 pb-10 print:space-y-4 print:bg-white">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-white via-white to-indigo-50/70 px-6 py-7 shadow-sm md:px-8">

          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-100/50 blur-3xl" />

          <div className="absolute bottom-[-80px] right-[25%] h-48 w-48 rounded-full bg-cyan-100/40 blur-3xl" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">

            <div className="max-w-3xl">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 shadow-sm">
                <BarChart3 size={15} />
                Relatório fiscal
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Visão geral da sua empresa
              </h1>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-3xl font-black text-indigo-600 md:text-4xl">
                  {selectedYear}
                </span>

                <span className="h-8 w-1 rounded-full bg-indigo-200" />

                <span className="text-sm text-slate-500">
                  Desempenho fiscal e financeiro
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                Acompanhe a facturação, pagamentos,
                impostos, obrigações e actividade
                da sua empresa num único relatório.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
                  <CalendarDays
                    size={16}
                    className="text-indigo-600"
                  />
                  Exercício fiscal
                  <strong className="text-slate-900">
                    {selectedYear}
                  </strong>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 size={16} />
                  Dados em tempo real
                </div>

              </div>

            </div>

            <div className="relative hidden min-w-[260px] xl:block">

              <div className="relative mx-auto h-48 w-60">

                <div className="absolute right-0 top-0 h-32 w-44 rotate-[-8deg] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 h-2 w-20 rounded bg-slate-100" />

                  <div className="flex items-end gap-2">
                    <div className="h-10 w-7 rounded-t bg-indigo-200" />
                    <div className="h-16 w-7 rounded-t bg-indigo-400" />
                    <div className="h-12 w-7 rounded-t bg-cyan-400" />
                    <div className="h-20 w-7 rounded-t bg-indigo-600" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-2 h-32 w-44 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Facturação
                    </span>

                    <TrendingUp
                      size={15}
                      className="text-emerald-500"
                    />
                  </div>

                  <div className="mt-4 h-20">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <AreaChart
                        data={
                          reportData.monthlyInvoices
                        }
                      >
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#4f46e5"
                          fill="#e0e7ff"
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* =================================================
            CONTROLOS
        ================================================= */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {company.name ||
                company.legalName ||
                'Empresa'}
            </p>

            {company.nif && (
              <p className="text-xs text-slate-400">
                NIF: {company.nif}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">

            <select
              value={selectedYear}
              onChange={(event) =>
                setSelectedYear(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            >
              {[
                selectedYear - 2,
                selectedYear - 1,
                selectedYear,
                selectedYear + 1,
              ].map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />
              Actualizar
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FileSpreadsheet
                size={16}
                className="text-emerald-600"
              />
              Exportar
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Printer size={16} />
              Imprimir
            </button>

          </div>
        </div>

        {/* =================================================
            ERRO
        ================================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Atenção
              </p>

              <p className="mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            KPI
        ================================================= */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* FACTURAÇÃO */}

          <div className="group relative overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 transition group-hover:scale-150" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={21} />
                </div>

                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Receita
                </span>

              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Total facturado
              </p>

              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {formatCompactAOA(
                  reportData.totalInvoiced,
                )}
              </p>

              <div className="mt-3 flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  {reportData.yearInvoices.length}{' '}
                  factura(s)
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <ArrowUpRight size={14} />
                  Emitidas
                </span>

              </div>

            </div>
          </div>

          {/* PAGAMENTOS */}

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-50 transition group-hover:scale-150" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CreditCard size={21} />
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Entradas
                </span>

              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Pagamentos
              </p>

              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {formatCompactAOA(
                  reportData.totalPayments,
                )}
              </p>

              <div className="mt-3 flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  {reportData.yearPayments.length}{' '}
                  pagamento(s)
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <ArrowUpRight size={14} />
                  Recebidos
                </span>

              </div>

            </div>
          </div>

          {/* IVA */}

          <div className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-50 transition group-hover:scale-150" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Receipt size={21} />
                </div>

                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                  Fiscal
                </span>

              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                IVA gerado
              </p>

              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {formatCompactAOA(
                  reportData.totalVat,
                )}
              </p>

              <div className="mt-3 flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Sobre as facturas
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                  <WalletCards size={14} />
                  IVA
                </span>

              </div>

            </div>
          </div>

          {/* FUNCIONÁRIOS */}

          <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-50 transition group-hover:scale-150" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={21} />
                </div>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Equipa
                </span>

              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Funcionários
              </p>

              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {
                  reportData.activeEmployees
                    .length
                }
              </p>

              <div className="mt-3 flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Colaboradores activos
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                  <Users size={14} />
                  Activos
                </span>

              </div>

            </div>
          </div>

        </section>

        {/* =================================================
            GRÁFICOS PRINCIPAIS
        ================================================= */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">

          {/* EVOLUÇÃO */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <TrendingUp size={18} />
                  </div>

                  <h2 className="text-lg font-black text-slate-950">
                    Evolução da facturação
                  </h2>

                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Desempenho mensal durante{' '}
                  {selectedYear}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2 text-right">

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total anual
                </p>

                <p className="text-sm font-black text-slate-900">
                  {formatAOA(
                    reportData.totalInvoiced,
                  )}
                </p>

              </div>

            </div>

            <div className="px-4 pb-5 pt-4 sm:px-6">

              {reportData.totalInvoiced ===
              0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">

                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <BarChart3
                      size={26}
                      className="text-slate-300"
                    />
                  </div>

                  <p className="font-semibold text-slate-600">
                    Sem dados de facturação
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-slate-400">
                    Quando forem emitidas facturas em{' '}
                    {selectedYear}, a evolução aparecerá
                    automaticamente neste gráfico.
                  </p>

                </div>
              ) : (
                <div className="h-[330px] w-full">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={
                        reportData.monthlyInvoices
                      }
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                      }}
                    >

                      <defs>

                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#4f46e5"
                            stopOpacity={0.3}
                          />

                          <stop
                            offset="100%"
                            stopColor="#4f46e5"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                      </defs>

                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: '#94a3b8',
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={70}
                        tick={{
                          fill: '#94a3b8',
                          fontSize: 11,
                        }}
                        tickFormatter={(value) =>
                          formatCompactAOA(
                            Number(value),
                          )
                        }
                      />

                      <Tooltip
                        content={
                          <ChartTooltip />
                        }
                      />

                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Facturação"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        dot={{
                          r: 3,
                          fill: '#4f46e5',
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 6,
                        }}
                      />

                    </AreaChart>
                  </ResponsiveContainer>

                </div>
              )}

            </div>
          </div>

          {/* PIZZA FACTURAS */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <BarChart3 size={18} />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Estado das facturas
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Distribuição das facturas de{' '}
                {selectedYear}
              </p>

            </div>

            {reportData.yearInvoices.length ===
            0 ? (
              <div className="flex min-h-[350px] items-center justify-center px-6 text-center">

                <div>

                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
                    <Receipt
                      size={25}
                      className="text-slate-300"
                    />
                  </div>

                  <p className="font-semibold text-slate-600">
                    Nenhuma factura
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Não existem facturas para este exercício.
                  </p>

                </div>

              </div>
            ) : (
              <div className="px-5 pb-6 pt-3">

                <div className="h-[245px]">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>

                      <Pie
                        data={
                          reportData.invoiceStatusData
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={96}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {reportData.invoiceStatusData.map(
                          (_, index) => (
                            <Cell
                              key={index}
                              fill={
                                invoiceColors[
                                  index %
                                    invoiceColors.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          [
                            `${value} factura(s)`,
                            'Quantidade',
                          ]
                        }
                      />

                    </PieChart>
                  </ResponsiveContainer>

                  <div className="-mt-[155px] text-center">

                    <p className="text-3xl font-black text-slate-950">
                      {
                        reportData
                          .yearInvoices
                          .length
                      }
                    </p>

                    <p className="text-xs font-medium text-slate-400">
                      factura(s)
                    </p>

                  </div>

                </div>

                <div className="mt-10 space-y-3">

                  {reportData.invoiceStatusData.map(
                    (item, index) => {

                      const percentage =
                        reportData
                          .yearInvoices
                          .length >
                        0
                          ? (item.value /
                              reportData
                                .yearInvoices
                                .length) *
                            100
                          : 0;

                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between"
                        >

                          <div className="flex items-center gap-2.5">

                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  invoiceColors[
                                    index %
                                      invoiceColors.length
                                  ],
                              }}
                            />

                            <span className="text-sm text-slate-600">
                              {item.name}
                            </span>

                          </div>

                          <div className="flex items-center gap-3">

                            <strong className="text-sm text-slate-900">
                              {item.value}
                            </strong>

                            <span className="w-12 text-right text-xs text-slate-400">
                              {percentage.toFixed(
                                0,
                              )}
                              %
                            </span>

                          </div>

                        </div>
                      );
                    },
                  )}

                </div>

              </div>
            )}

          </div>

        </section>

        {/* =================================================
            OBRIGAÇÕES
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <AlertTriangle size={18} />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Obrigações fiscais
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Acompanhamento das obrigações de{' '}
                {selectedYear}
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-2 text-right">

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total
              </p>

              <p className="text-lg font-black text-slate-900">
                {
                  reportData
                    .yearObligations
                    .length
                }
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">

            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                  <Clock3 size={19} />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Pendentes
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-amber-800">
                {
                  reportData
                    .pendingObligations
                    .length
                }
              </p>

              <p className="mt-1 text-xs text-amber-700/70">
                {formatAOA(
                  reportData
                    .pendingObligationAmount,
                )}
              </p>

            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <CheckCircle2 size={19} />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Pagas
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-emerald-800">
                {
                  reportData
                    .paidObligations
                    .length
                }
              </p>

              <p className="mt-1 text-xs text-emerald-700/70">
                {formatAOA(
                  reportData
                    .paidObligationAmount,
                )}
              </p>

            </div>

            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-5">

              <div className="flex items-center justify-between">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                  <AlertTriangle size={19} />
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Em atraso
                </span>

              </div>

              <p className="mt-5 text-3xl font-black text-red-800">
                {
                  reportData
                    .lateObligations
                    .length
                }
              </p>

              <p className="mt-1 text-xs text-red-700/70">
                {formatAOA(
                  reportData
                    .lateObligationAmount,
                )}
              </p>

            </div>

          </div>

          <div className="border-t border-slate-100 px-5 py-4">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">

                <span className="text-sm text-slate-500">
                  Valor pendente
                </span>

                <strong className="text-sm text-slate-900">
                  {formatAOA(
                    reportData
                      .pendingObligationAmount,
                  )}
                </strong>

              </div>

              <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">

                <span className="text-sm text-red-600">
                  Valor em atraso
                </span>

                <strong className="text-sm text-red-700">
                  {formatAOA(
                    reportData
                      .lateObligationAmount,
                  )}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            PAGAMENTOS POR IMPOSTO + RESUMO
        ================================================= */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* PIZZA PAGAMENTOS */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <CreditCard size={18} />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Distribuição dos pagamentos
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Pagamentos registados por categoria fiscal
              </p>

            </div>

            {reportData.taxDistribution.length ===
            0 ? (
              <div className="flex min-h-[330px] items-center justify-center px-6 text-center">

                <div>

                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                    <CreditCard
                      size={25}
                      className="text-slate-300"
                    />
                  </div>

                  <p className="font-semibold text-slate-600">
                    Sem pagamentos registados
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    A distribuição aparecerá quando existirem pagamentos.
                  </p>

                </div>

              </div>
            ) : (
              <div className="grid grid-cols-1 items-center gap-2 px-5 py-4 md:grid-cols-[1fr_1fr]">

                <div className="h-[300px]">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>

                      <Pie
                        data={
                          reportData.taxDistribution
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={66}
                        outerRadius={102}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {reportData.taxDistribution.map(
                          (_, index) => (
                            <Cell
                              key={index}
                              fill={
                                taxColors[
                                  index %
                                    taxColors.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip
                        formatter={(
                          value,
                        ) =>
                          [
                            formatAOA(
                              numberValue(
                                value,
                              ),
                            ),
                            'Valor',
                          ]
                        }
                      />

                    </PieChart>
                  </ResponsiveContainer>

                </div>

                <div className="space-y-3">

                  {reportData.taxDistribution
                    .slice(0, 6)
                    .map(
                      (
                        item,
                        index,
                      ) => {

                        const total =
                          reportData.taxDistribution.reduce(
                            (
                              sum,
                              current,
                            ) =>
                              sum +
                              current.value,
                            0,
                          );

                        const percentage =
                          total > 0
                            ? (item.value /
                                total) *
                              100
                            : 0;

                        return (
                          <div
                            key={
                              item.taxType
                            }
                            className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"
                          >

                            <div className="flex items-center justify-between gap-3">

                              <div className="flex min-w-0 items-center gap-2">

                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor:
                                      taxColors[
                                        index %
                                          taxColors.length
                                      ],
                                  }}
                                />

                                <span className="truncate text-xs font-semibold text-slate-600">
                                  {
                                    item.name
                                  }
                                </span>

                              </div>

                              <span className="text-xs font-black text-slate-900">
                                {percentage.toFixed(
                                  1,
                                )}
                                %
                              </span>

                            </div>

                            <p className="mt-1 pl-4 text-xs text-slate-400">
                              {formatAOA(
                                item.value,
                              )}
                            </p>

                          </div>
                        );
                      },
                    )}

                </div>

              </div>
            )}

          </div>

          {/* RESUMO FINANCEIRO */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <WalletCards size={18} />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Resumo financeiro
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Indicadores principais do exercício
              </p>

            </div>

            <div className="space-y-3 p-5">

              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                    <FileText size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Facturação bruta
                    </p>

                    <p className="text-xs text-slate-400">
                      Total das facturas
                    </p>
                  </div>

                </div>

                <strong className="text-sm text-slate-950">
                  {formatAOA(
                    reportData.totalInvoiced,
                  )}
                </strong>

              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <CreditCard size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Total recebido
                    </p>

                    <p className="text-xs text-slate-400">
                      Pagamentos registados
                    </p>
                  </div>

                </div>

                <strong className="text-sm text-emerald-600">
                  {formatAOA(
                    reportData.totalPayments,
                  )}
                </strong>

              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                    <Receipt size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      IVA gerado
                    </p>

                    <p className="text-xs text-slate-400">
                      Imposto nas facturas
                    </p>
                  </div>

                </div>

                <strong className="text-sm text-orange-600">
                  {formatAOA(
                    reportData.totalVat,
                  )}
                </strong>

              </div>

              <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/60 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                    <AlertTriangle size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Obrigações em atraso
                    </p>

                    <p className="text-xs text-red-500">
                      Requerem atenção
                    </p>
                  </div>

                </div>

                <strong className="text-sm text-red-600">
                  {formatAOA(
                    reportData
                      .lateObligationAmount,
                  )}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            FACTURAS RECENTES
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={18} />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Facturas recentes
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Últimas facturas registadas em{' '}
                {selectedYear}
              </p>

            </div>

            <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
              {reportData.yearInvoices.length}{' '}
              factura(s)
            </span>

          </div>

          {reportData.yearInvoices.length ===
          0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <FileText
                  size={26}
                  className="text-slate-300"
                />
              </div>

              <p className="font-semibold text-slate-600">
                Nenhuma factura encontrada
              </p>

              <p className="mt-1 text-sm text-slate-400">
                As facturas emitidas aparecerão aqui.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[760px]">

                <thead>
                  <tr className="bg-slate-50/80">

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Factura
                    </th>

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Cliente
                    </th>

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Data
                    </th>

                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total
                    </th>

                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estado
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {reportData.yearInvoices
                    .slice(0, 10)
                    .map(
                      (
                        invoice,
                      ) => (
                        <tr
                          key={
                            invoice.id
                          }
                          className="border-t border-slate-100 transition hover:bg-indigo-50/30"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <FileText
                                  size={16}
                                />
                              </div>

                              <span className="text-sm font-bold text-slate-900">
                                {invoice.invoiceNumber ||
                                  '—'}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {invoice.client?.name ||
                              'Cliente'}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {formatDate(
                              invoice.issueDate ||
                                invoice.createdAt,
                            )}
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                            {formatAOA(
                              numberValue(
                                invoice.total,
                              ),
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">

                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                invoice.status,
                              )}`}
                            >
                              {invoice.status ===
                                'PAID' && (
                                <CheckCircle2
                                  size={13}
                                  className="mr-1.5"
                                />
                              )}

                              {invoice.status ===
                                'PENDING' && (
                                <Clock3
                                  size={13}
                                  className="mr-1.5"
                                />
                              )}

                              {invoice.status ===
                                'CANCELLED' && (
                                <XCircle
                                  size={13}
                                  className="mr-1.5"
                                />
                              )}

                              {getStatusLabel(
                                invoice.status,
                              )}
                            </span>

                          </td>

                        </tr>
                      ),
                    )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* =================================================
            OBRIGAÇÕES RECENTES
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Receipt size={18} />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Obrigações fiscais
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Obrigações que requerem acompanhamento
              </p>

            </div>

            <span className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
              {
                reportData
                  .yearObligations
                  .length
              }{' '}
              obrigação(ões)
            </span>

          </div>

          {reportData.yearObligations.length ===
          0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <CheckCircle2
                  size={27}
                  className="text-emerald-500"
                />
              </div>

              <p className="font-semibold text-slate-600">
                Nenhuma obrigação encontrada
              </p>

              <p className="mt-1 text-sm text-slate-400">
                As obrigações fiscais aparecerão aqui quando forem registadas.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>
                  <tr className="bg-slate-50/80">

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Obrigação
                    </th>

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tipo
                    </th>

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Vencimento
                    </th>

                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Valor
                    </th>

                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estado
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {reportData.yearObligations
                    .slice(0, 10)
                    .map(
                      (
                        obligation,
                      ) => (
                        <tr
                          key={
                            obligation.id
                          }
                          className="border-t border-slate-100 transition hover:bg-orange-50/30"
                        >

                          <td className="max-w-[480px] px-6 py-4">

                            <div className="flex items-start gap-3">

                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                <Receipt
                                  size={16}
                                />
                              </div>

                              <span className="text-sm font-bold leading-5 text-slate-900">
                                {obligation.title ||
                                  'Obrigação fiscal'}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-4 text-sm font-medium uppercase text-slate-500">
                            {obligation.type ||
                              '—'}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {formatDate(
                              obligation.dueDate,
                            )}
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                            {formatAOA(
                              numberValue(
                                obligation.amount,
                              ),
                            )}
                          </td>

                          <td className="px-6 py-4 text-center">

                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                obligation.status,
                              )}`}
                            >
                              {getStatusLabel(
                                obligation.status,
                              )}
                            </span>

                          </td>

                        </tr>
                      ),
                    )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* =================================================
            FUNCIONÁRIOS
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={18} />
                </div>

                <h2 className="text-lg font-black text-slate-950">
                  Equipa da empresa
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Funcionários registados no sistema
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600">
              {
                reportData.activeEmployees
                  .length
              }{' '}
              activos
            </div>

          </div>

          {employees.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                <Users
                  size={27}
                  className="text-slate-300"
                />
              </div>

              <p className="font-semibold text-slate-600">
                Nenhum funcionário encontrado
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead>
                  <tr className="bg-slate-50/80">

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Funcionário
                    </th>

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Nº Funcionário
                    </th>

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Cargo
                    </th>

                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Departamento
                    </th>

                    <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Estado
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {employees
                    .slice(0, 10)
                    .map(
                      (
                        employee,
                      ) => (
                        <tr
                          key={
                            employee.id
                          }
                          className="border-t border-slate-100 transition hover:bg-blue-50/30"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-black text-white">
                                {(
                                  employee.name ||
                                  'F'
                                )
                                  .split(
                                    ' ',
                                  )
                                  .slice(
                                    0,
                                    2,
                                  )
                                  .map(
                                    (
                                      part,
                                    ) =>
                                      part[0],
                                  )
                                  .join(
                                    '',
                                  )
                                  .toUpperCase()}
                              </div>

                              <span className="text-sm font-bold text-slate-900">
                                {employee.name ||
                                  '—'}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {employee.employeeNumber ||
                              '—'}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {employee.jobTitle ||
                              '—'}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {employee.department ||
                              '—'}
                          </td>

                          <td className="px-6 py-4 text-center">

                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClass(
                                employee.status,
                              )}`}
                            >
                              {getStatusLabel(
                                employee.status,
                              )}
                            </span>

                          </td>

                        </tr>
                      ),
                    )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* =================================================
            RODAPÉ DO RELATÓRIO
        ================================================= */}

        <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-6 py-5 print:border-slate-200">

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <FileSpreadsheet size={21} />
              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  Relatório fiscal integrado
                </h3>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                  Os dados apresentados neste relatório são
                  carregados directamente dos registos da empresa
                  autenticada.
                </p>

                <p className="mt-2 text-[11px] text-slate-400">
                  Exercício fiscal: {selectedYear}
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2 print:hidden">

              <button
                onClick={
                  handleExportCSV
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Download
                  size={15}
                />
                Exportar CSV
              </button>

              <button
                onClick={
                  handlePrint
                }
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Printer
                  size={15}
                />
                Imprimir relatório
              </button>

            </div>

          </div>

        </section>

      </div>

      {/* ===================================================
          PRINT
      =================================================== */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          nav,
          aside,
          header {
            print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}