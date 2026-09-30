'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Lock,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  X,
  Users,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

import {
  approvePayroll,
  calculatePayroll,
  closePayroll,
  createPayroll,
  getPayrollByPeriod,
  getPayrolls,
  payPayroll,
  type Payroll,
  type PayrollItem,
} from '@/services/payroll';

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

function numberValue(value: unknown): number {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? number
    : 0;
}

function money(value: unknown): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 2,
  }).format(numberValue(value));
}

function shortMoney(value: unknown): string {
  return new Intl.NumberFormat('pt-AO', {
    maximumFractionDigits: 0,
  }).format(numberValue(value));
}

function statusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Rascunho';

    case 'CALCULATED':
      return 'Calculada';

    case 'APPROVED':
      return 'Aprovada';

    case 'PAID':
      return 'Paga';

    case 'CLOSED':
      return 'Fechada';

    default:
      return status;
  }
}

function statusClasses(status: string): string {
  switch (status) {
    case 'PAID':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';

    case 'APPROVED':
      return 'border-blue-200 bg-blue-50 text-blue-700';

    case 'CALCULATED':
      return 'border-violet-200 bg-violet-50 text-violet-700';

    case 'CLOSED':
      return 'border-slate-200 bg-slate-100 text-slate-700';

    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}

function getErrorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return (
    candidate?.response?.data?.message ||
    candidate?.message ||
    'Não foi possível concluir a operação.'
  );
}

export default function PayrollPage() {
  const { user } = useAuth();
  const currentDate = new Date();
  const canCalculate = ['OWNER', 'ADMIN', 'ACCOUNTANT'].includes(
    user?.role ?? '',
  );
  const canApprove = ['OWNER', 'ADMIN'].includes(
    user?.role ?? '',
  );

  const [month, setMonth] = useState(
    currentDate.getMonth() + 1,
  );

  const [year, setYear] = useState(
    currentDate.getFullYear(),
  );

  const [payrolls, setPayrolls] =
    useState<Payroll[]>([]);

  const [selectedPayroll, setSelectedPayroll] =
    useState<Payroll | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [showCreate, setShowCreate] =
    useState(false);

  const [pendingAction, setPendingAction] =
    useState<'APPROVE' | 'PAY' | 'CLOSE' | null>(null);

  const [createMonth, setCreateMonth] =
    useState(
      currentDate.getMonth() + 1,
    );

  const [createYear, setCreateYear] =
    useState(
      currentDate.getFullYear(),
    );

  const [error, setError] =
    useState('');

  const filteredItems = useMemo(() => {
    const items =
      selectedPayroll?.items ?? [];

    const term =
      search.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter(
      (item: PayrollItem) =>
        [
          item.employeeName,
          item.employeeNif,
          item.socialSecurityNumber,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(term),
    );
  }, [selectedPayroll, search]);

  const loadPeriod = useCallback(
    async (
      selectedYear: number,
      selectedMonth: number,
    ) => {
      try {
        setLoading(true);
        setError('');

        const payroll =
          await getPayrollByPeriod(
            selectedYear,
            selectedMonth,
          );

        setSelectedPayroll(payroll);
      } catch (err) {
        console.error(err);

        setSelectedPayroll(null);
        setError(
          getErrorMessage(err),
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadPayrolls =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const data =
          await getPayrolls();

        setPayrolls(data);

        const current =
          data.find(
            (item) =>
              item.year === year &&
              item.month === month,
          );

        if (current) {
          const detail =
            await getPayrollByPeriod(
              current.year,
              current.month,
            );

          setSelectedPayroll(detail);
        } else {
          setSelectedPayroll(null);
        }
      } catch (err) {
        console.error(err);

        setSelectedPayroll(null);

        setError(
          getErrorMessage(err),
        );
      } finally {
        setLoading(false);
      }
    }, [month, year]);

  useEffect(() => {
    void loadPayrolls();
  }, [loadPayrolls]);

  async function handleCreatePayroll() {
    try {
      setWorking(true);
      setError('');

      const created =
        await createPayroll({
          month: createMonth,
          year: createYear,
        });

      setShowCreate(false);

      setMonth(createMonth);
      setYear(createYear);

      const detail =
        await getPayrollByPeriod(
          createYear,
          createMonth,
        );

      setSelectedPayroll(
        detail ?? created,
      );

      const data =
        await getPayrolls();

      setPayrolls(data);
    } catch (err) {
      console.error(err);

      setError(
        getErrorMessage(err),
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleCalculate() {
    if (!selectedPayroll) {
      return;
    }

    try {
      setWorking(true);
      setError('');

      const updated =
        await calculatePayroll(
          selectedPayroll.id,
        );

      setSelectedPayroll(updated);

      const data =
        await getPayrolls();

      setPayrolls(data);
    } catch (err) {
      console.error(err);

      setError(
        getErrorMessage(err),
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleApprove() {
    if (!selectedPayroll) {
      return;
    }

    try {
      setWorking(true);
      setError('');

      const updated =
        await approvePayroll(
          selectedPayroll.id,
        );

      setSelectedPayroll(updated);

      const data =
        await getPayrolls();

      setPayrolls(data);
    } catch (err) {
      console.error(err);

      setError(
        getErrorMessage(err),
      );
    } finally {
      setWorking(false);
    }
  }

  async function handlePay() {
    if (!selectedPayroll) {
      return;
    }

    try {
      setWorking(true);
      setError('');

      const updated =
        await payPayroll(
          selectedPayroll.id,
        );

      setSelectedPayroll(updated);

      const data =
        await getPayrolls();

      setPayrolls(data);
    } catch (err) {
      console.error(err);

      setError(
        getErrorMessage(err),
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleClose() {
    if (!selectedPayroll) {
      return;
    }

    try {
      setWorking(true);
      setError('');

      const updated = await closePayroll(
        selectedPayroll.id,
      );

      setSelectedPayroll(updated);
      setPayrolls(await getPayrolls());
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  }

  async function confirmPendingAction() {
    const action = pendingAction;
    setPendingAction(null);

    if (action === 'APPROVE') {
      await handleApprove();
    } else if (action === 'PAY') {
      await handlePay();
    } else if (action === 'CLOSE') {
      await handleClose();
    }
  }

  const gross = numberValue(
    selectedPayroll?.grossAmount,
  );

  const net = numberValue(
    selectedPayroll?.netAmount,
  );

  const socialSecurity =
    numberValue(
      selectedPayroll?.socialSecurityAmount,
    );

  const employerSocialSecurity =
    numberValue(
      selectedPayroll?.employerSocialSecurityAmount,
    );

  const irt =
    numberValue(
      selectedPayroll?.irtAmount,
    );

  const otherDeductions =
    numberValue(
      selectedPayroll?.otherDeductionsAmount,
    );

  const totalDeductions =
    socialSecurity +
    irt +
    otherDeductions;

  const totalBase = filteredItems.reduce(
    (sum, item) =>
      sum +
      numberValue(
        item.baseSalary,
      ),
    0,
  );

  const totalAllowances =
    filteredItems.reduce(
      (sum, item) =>
        sum +
        numberValue(
          item.foodAllowance,
        ) +
        numberValue(
          item.transportAllowance,
        ) +
        numberValue(
          item.otherAllowances,
        ) +
        numberValue(
          item.bonuses,
        ) +
        numberValue(
          item.commissions,
        ) +
        numberValue(
          item.otherIncome,
        ),
      0,
    );

  return (
    <DashboardLayout>
      <div className="fd-workspace-page fd-theme-scope mx-auto w-full max-w-[1440px] space-y-5">
        {/* CABEÇALHO */}
        <section className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Folha salarial
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Processe remunerações, IRT, Segurança Social e valor líquido por período.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadPayrolls()
                }
                disabled={loading}
                className="
                  inline-flex
                  h-11
                  items-center
                  gap-2
                  rounded-md
                  border
                  border-slate-200
                  bg-white
                  px-4
                  text-sm
                  font-semibold
                  text-slate-700
                  transition-colors
                  hover:bg-slate-50
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? 'animate-spin'
                      : ''
                  }
                />

                Actualizar
              </button>

              {canCalculate && (
                <button
                  type="button"
                  onClick={() => {
                    setCreateMonth(month);
                    setCreateYear(year);
                    setShowCreate(true);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0b6f93] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#085b79]"
                >
                  <Plus size={18} />
                  Processar folha
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ERRO */}
        {error && (
          <div role="alert" className="flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <div>
              <p className="font-bold">
                Não foi possível concluir a operação
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
              className="rounded-lg p-1 hover:bg-red-100"
              aria-label="Fechar erro"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* SELEÇÃO DO PERÍODO */}
        <section className="border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Período de processamento
              </p>

              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Seleccione o mês e o ano
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <div>
                <label
                  htmlFor="payroll-month"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Mês
                </label>

                <select
                  id="payroll-month"
                  value={month}
                  onChange={(event) => {
                    const value =
                      Number(
                        event.target.value,
                      );

                    setMonth(value);

                    void loadPeriod(
                      year,
                      value,
                    );
                  }}
                  className="
                    h-11
                    min-w-[170px]
                    rounded-md
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-medium
                    outline-none
                    focus:border-[#0b6f93]
                    focus:ring-2
                    focus:ring-[#0b6f93]/10
                  "
                >
                  {MONTHS.map(
                    (name, index) => (
                      <option
                        key={name}
                        value={index + 1}
                      >
                        {name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="payroll-year"
                  className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  Ano
                </label>

                <select
                  id="payroll-year"
                  value={year}
                  onChange={(event) => {
                    const value =
                      Number(
                        event.target.value,
                      );

                    setYear(value);

                    void loadPeriod(
                      value,
                      month,
                    );
                  }}
                  className="
                    h-11
                    min-w-[120px]
                    rounded-md
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-medium
                    outline-none
                    focus:border-[#0b6f93]
                    focus:ring-2
                    focus:ring-[#0b6f93]/10
                  "
                >
                  {Array.from(
                    {
                      length: 7,
                    },
                    (_, index) =>
                      currentDate.getFullYear() -
                      2 +
                      index,
                  ).map((value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* LOADING */}
        {loading &&
        !selectedPayroll ? (
          <div className="flex min-h-[320px] items-center justify-center border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2
                size={32}
                className="mx-auto animate-spin text-[#0b6f93]"
              />

              <p className="mt-3 text-sm font-semibold text-slate-500">
                A carregar folha salarial...
              </p>
            </div>
          </div>
        ) : !selectedPayroll ? (
          /* EMPTY STATE */
          <section className="border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
              <Wallet size={22} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              Nenhuma folha neste período
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Crie a folha salarial para{' '}
              <strong>
                {MONTHS[month - 1]} {year}
              </strong>
              . Serão incluídos os colaboradores elegíveis
              com salário vigente no início do mês.
            </p>

            {canCalculate && <button
              type="button"
              onClick={() => {
                setCreateMonth(month);
                setCreateYear(year);
                setShowCreate(true);
              }}
              className="
                mt-7
                inline-flex
                h-11
                items-center
                gap-2
                rounded-md
                bg-[#0b6f93]
                px-5
                text-sm
                font-semibold
                text-white
                transition-colors
                hover:bg-[#085b79]
              "
            >
              <Plus size={18} />

              Criar folha
            </button>}
          </section>
        ) : (
          <>
            {/* RESUMO */}
            <section className="grid overflow-hidden border border-slate-200 bg-white md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                title="Total bruto"
                value={money(gross)}
                description={`${selectedPayroll.employeeCount} funcionários`}
                icon={
                  <CircleDollarSign
                    size={21}
                  />
                }
              />

              <SummaryCard
                title="Descontos"
                value={money(
                  totalDeductions,
                )}
                description={`INSS trabalhador ${shortMoney(
                  socialSecurity,
                )} · IRT ${shortMoney(irt)}`}
                icon={
                  <ShieldCheck size={21} />
                }
              />

              <SummaryCard
                title="Total líquido"
                value={money(net)}
                description="Valor líquido da folha"
                icon={
                  <Wallet size={21} />
                }
              />

              <SummaryCard
                title="Funcionários"
                value={String(
                  selectedPayroll.employeeCount,
                )}
                description={`Estado: ${statusLabel(
                  selectedPayroll.status,
                )}`}
                icon={
                  <Users size={21} />
                }
              />
            </section>

            <p className="border-x border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
              Regra aplicada:{' '}
              <strong>{selectedPayroll.taxRuleVersion || 'Legado sem versão registada'}</strong>
              {' · '}Cálculo suportado para Grupo A e mês completo; casos sem regra validada são bloqueados.
            </p>

            {/* ESTADO */}
            <section className="border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Folha actual
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-950">
                      {MONTHS[
                        selectedPayroll.month -
                          1
                      ]}{' '}
                      {selectedPayroll.year}
                    </h2>

                    <span
                      className={`
                        rounded-md
                        border
                        px-3
                        py-1.5
                        text-xs
                        font-bold
                        ${statusClasses(
                          selectedPayroll.status,
                        )}
                      `}
                    >
                      {statusLabel(
                        selectedPayroll.status,
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Período: {selectedPayroll.period}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {canCalculate && (
                    <ActionButton
                      label="Calcular"
                      icon={<Calculator size={17} />}
                      onClick={handleCalculate}
                      disabled={
                        working ||
                        ['APPROVED', 'PAID', 'CLOSED'].includes(
                          selectedPayroll.status,
                        )
                      }
                      primary
                    />
                  )}

                  {canApprove && (
                    <>
                      <ActionButton
                        label="Aprovar"
                        icon={<CheckCircle2 size={17} />}
                        onClick={() => setPendingAction('APPROVE')}
                        disabled={
                          working ||
                          selectedPayroll.status !== 'CALCULATED'
                        }
                      />

                      <ActionButton
                        label="Marcar como paga"
                        icon={<Wallet size={17} />}
                        onClick={() => setPendingAction('PAY')}
                        disabled={
                          working ||
                          selectedPayroll.status !== 'APPROVED'
                        }
                      />

                      <ActionButton
                        label="Fechar folha"
                        icon={<Lock size={17} />}
                        onClick={() => setPendingAction('CLOSE')}
                        disabled={
                          working ||
                          selectedPayroll.status !== 'PAID'
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* INDICADORES */}
            <section className="grid overflow-hidden border border-slate-200 bg-white md:grid-cols-2 xl:grid-cols-4">
              <MiniMetric
                label="Massa salarial base"
                value={money(
                  totalBase,
                )}
                icon={
                  <CircleDollarSign
                    size={19}
                  />
                }
              />

              <MiniMetric
                label="Subsídios e outros"
                value={money(
                  totalAllowances,
                )}
                icon={
                  <TrendingUp size={19} />
                }
              />

              <MiniMetric
                label="Descontos"
                value={money(
                  totalDeductions,
                )}
                icon={
                  <FileText size={19} />
                }
              />

              <MiniMetric
                label="INSS entidade empregadora"
                value={money(employerSocialSecurity)}
                icon={<ShieldCheck size={19} />}
              />
            </section>

            {/* FUNCIONÁRIOS */}
            <section className="overflow-hidden border border-slate-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-950">
                    Funcionários da folha
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {filteredItems.length}{' '}
                    funcionário(s) apresentado(s)
                  </p>
                </div>

                <div className="relative w-full lg:w-[330px]">
                  <Search
                    size={17}
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Pesquisar funcionário, NIF..."
                    className="
                      h-11
                      w-full
                      rounded-md
                      border
                      border-slate-200
                      bg-slate-50
                      pl-10
                      pr-4
                      text-sm
                      outline-none
                      transition
                      focus:border-[#0b6f93]
                      focus:bg-white
                      focus:ring-2
                      focus:ring-[#0b6f93]/10
                    "
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1240px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left">
                      <TableHeader>
                        Funcionário
                      </TableHeader>

                      <TableHeader align="right">
                        Base
                      </TableHeader>

                      <TableHeader align="right">
                        Subsídios
                      </TableHeader>

                      <TableHeader align="right">
                        Bruto
                      </TableHeader>

                      <TableHeader align="right">
                        INSS trabalhador
                      </TableHeader>

                      <TableHeader align="right">
                        INSS empregador
                      </TableHeader>

                      <TableHeader align="right">
                        IRT
                      </TableHeader>

                      <TableHeader align="right">
                        Líquido
                      </TableHeader>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-16 text-center text-sm text-slate-500"
                        >
                          Nenhum funcionário
                          encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(
                        (item) => {
                          const allowances =
                            numberValue(
                              item.foodAllowance,
                            ) +
                            numberValue(
                              item.transportAllowance,
                            ) +
                            numberValue(
                              item.otherAllowances,
                            ) +
                            numberValue(
                              item.bonuses,
                            ) +
                            numberValue(
                              item.commissions,
                            ) +
                            numberValue(
                              item.otherIncome,
                            );

                          return (
                            <tr
                              key={item.id}
                              className="
                                border-b
                                border-slate-100
                                transition
                                hover:bg-slate-50/70
                              "
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="
                                      flex
                                      h-10
                                      w-10
                                      shrink-0
                                      items-center
                                      justify-center
                                      rounded-md
                                      bg-blue-50
                                      text-sm
                                      font-black
                                      text-blue-700
                                    "
                                  >
                                    {item.employeeName
                                      ?.charAt(
                                        0,
                                      )
                                      ?.toUpperCase() ||
                                      '?'}
                                  </div>

                                  <div>
                                    <p className="text-sm font-bold text-slate-900">
                                      {
                                        item.employeeName
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                      NIF:{' '}
                                      {item.employeeNif ||
                                        '—'}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <TableCell align="right">
                                {money(
                                  item.baseSalary,
                                )}
                              </TableCell>

                              <TableCell align="right">
                                {money(
                                  allowances,
                                )}
                              </TableCell>

                              <TableCell
                                align="right"
                                strong
                              >
                                {money(
                                  item.grossAmount,
                                )}
                              </TableCell>

                              <TableCell align="right">
                                {money(
                                  item.socialSecurityAmount,
                                )}
                              </TableCell>

                              <TableCell align="right">
                                {money(
                                  item.employerSocialSecurityAmount,
                                )}
                              </TableCell>

                              <TableCell align="right">
                                {money(
                                  item.irtAmount,
                                )}
                              </TableCell>

                              <TableCell
                                align="right"
                                green
                              >
                                {money(
                                  item.netAmount,
                                )}
                              </TableCell>
                            </tr>
                          );
                        },
                      )
                    )}
                  </tbody>

                  {filteredItems.length >
                    0 && (
                    <tfoot>
                      <tr className="bg-slate-50">
                        <td className="px-5 py-4 text-sm font-black text-slate-900">
                          TOTAL
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-black">
                          {money(
                            totalBase,
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-black">
                          {money(
                            totalAllowances,
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-black">
                          {money(
                            filteredItems.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                numberValue(
                                  item.grossAmount,
                                ),
                              0,
                            ),
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-black">
                          {money(
                            filteredItems.reduce(
                              (total, item) =>
                                total +
                                numberValue(
                                  item.employerSocialSecurityAmount,
                                ),
                              0,
                            ),
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-black">
                          {money(
                            filteredItems.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                numberValue(
                                  item.socialSecurityAmount,
                                ),
                              0,
                            ),
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-black">
                          {money(
                            filteredItems.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                numberValue(
                                  item.irtAmount,
                                ),
                              0,
                            ),
                          )}
                        </td>

                        <td className="px-5 py-4 text-right text-sm font-black text-emerald-700">
                          {money(
                            filteredItems.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                numberValue(
                                  item.netAmount,
                                ),
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </section>

            {/* FLUXO */}
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Fluxo da folha
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Acompanhe as etapas do processamento.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ProcessStep
                  number="01"
                  title="Calcular"
                  description="Processa os valores e actualiza os totais."
                  active={
                    selectedPayroll.status ===
                    'CALCULATED'
                  }
                  done={[
                    'APPROVED',
                    'PAID',
                    'CLOSED',
                  ].includes(
                    selectedPayroll.status,
                  )}
                />

                <ProcessStep
                  number="02"
                  title="Aprovar"
                  description="Confirma a folha depois do cálculo."
                  active={
                    selectedPayroll.status ===
                    'APPROVED'
                  }
                  done={[
                    'PAID',
                    'CLOSED',
                  ].includes(
                    selectedPayroll.status,
                  )}
                />

                <ProcessStep
                  number="03"
                  title="Pagamento"
                  description="Marca a folha como paga depois da aprovação."
                  active={
                    selectedPayroll.status ===
                    'PAID'
                  }
                  done={
                    selectedPayroll.status ===
                    'CLOSED'
                  }
                />

                <ProcessStep
                  number="04"
                  title="Fecho"
                  description="Bloqueia a folha paga contra novas transições."
                  active={false}
                  done={selectedPayroll.status === 'CLOSED'}
                />
              </div>
            </section>
          </>
        )}
      </div>

      {pendingAction && selectedPayroll && (
        <div
          className="fd-theme-scope fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !working) {
              setPendingAction(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payroll-confirm-title"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="payroll-confirm-title"
              className="text-lg font-semibold text-slate-950"
            >
              {pendingAction === 'APPROVE'
                ? 'Aprovar folha salarial'
                : pendingAction === 'PAY'
                  ? 'Confirmar pagamento da folha'
                  : 'Fechar folha salarial'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {pendingAction === 'APPROVE'
                ? 'Confirme que os valores e os colaboradores foram revistos. Uma folha aprovada deixa de poder ser recalculada.'
                : pendingAction === 'PAY'
                  ? 'Esta acção regista o pagamento no fluxo interno. Confirme apenas depois de validar o pagamento efectivo fora da plataforma.'
                  : 'O fecho bloqueia novas transições nesta folha paga.'}
            </p>

            <p className="mt-3 text-sm font-medium text-slate-800">
              {MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}
              {' · '}{money(selectedPayroll.netAmount)}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={working}
                className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => void confirmPendingAction()}
                disabled={working}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0b6f93] px-4 text-sm font-semibold text-white hover:bg-[#085b79] disabled:opacity-50"
              >
                {working && <Loader2 size={16} className="animate-spin" />}
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}

      {/* MODAL CRIAR */}
      {showCreate && canCalculate && (
        <div
          className="
            fd-theme-scope
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4

          "
        >
          <div
            className="
              w-full
              max-w-[500px]
              overflow-hidden
              rounded-lg
              bg-white
              shadow-lg
            "
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                  Processamento
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Nova folha salarial
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Seleccione o período que pretende processar.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
                className="
                  rounded-md
                  p-2
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                "
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-6">
              <div>
                <label
                  htmlFor="create-month"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Mês
                </label>

                <select
                  id="create-month"
                  value={createMonth}
                  onChange={(event) =>
                    setCreateMonth(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-md
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-semibold
                    outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                >
                  {MONTHS.map(
                    (name, index) => (
                      <option
                        key={name}
                        value={index + 1}
                      >
                        {name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="create-year"
                  className="mb-2 block text-xs font-bold text-slate-600"
                >
                  Ano
                </label>

                <input
                  id="create-year"
                  type="number"
                  min={2000}
                  value={createYear}
                  onChange={(event) =>
                    setCreateYear(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  className="
                    h-12
                    w-full
                    rounded-md
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-semibold
                    outline-none
                    focus:border-blue-500
                    focus:ring-4
                    focus:ring-blue-500/10
                  "
                />
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-blue-600">
                    <Users size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-blue-900">
                      Colaboradores elegíveis
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      A folha usa o salário vigente no início
                      do período. Admissões, cessações ou
                      alterações salariais a meio do mês são
                      bloqueadas até existir regra de
                      proporcionalidade validada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                  className="
                    h-11
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-5
                    text-sm
                    font-bold
                    text-slate-700
                    hover:bg-slate-100
                  "
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleCreatePayroll()
                  }
                  disabled={
                    working ||
                    createMonth < 1 ||
                    createMonth > 12 ||
                    createYear < 2000
                  }
                  className="
                    inline-flex
                    h-11
                    items-center
                    gap-2
                    rounded-md
                    bg-blue-600
                    px-5
                    text-sm
                    font-bold
                    text-white
                    shadow-lg
                    shadow-blue-600/20
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {working ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  Criar folha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 p-5 last:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-2 truncate text-xl font-semibold tabular-nums tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="shrink-0 text-slate-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="shrink-0 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold tabular-nums text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex
        h-10
        items-center
        gap-2
        rounded-md
        px-4
        text-sm
        font-semibold
        transition
        disabled:cursor-not-allowed
        disabled:opacity-40
        ${
          primary
            ? `
              bg-[#0b6f93]
              text-white
              hover:bg-[#085b79]
            `
            : `
              border
              border-slate-200
              bg-white
              text-slate-700
              hover:bg-slate-50
            `
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}

function TableHeader({
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
        text-[11px]
        font-semibold
        uppercase
        tracking-wider
        text-slate-400
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

function TableCell({
  children,
  align = 'left',
  strong = false,
  green = false,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  strong?: boolean;
  green?: boolean;
}) {
  return (
    <td
      className={`
        px-5
        py-4
        text-sm
        ${
          align === 'right'
            ? 'text-right'
            : 'text-left'
        }
        ${
          green
            ? 'font-semibold text-emerald-700'
            : strong
              ? 'font-bold text-slate-900'
              : 'text-slate-600'
        }
      `}
    >
      {children}
    </td>
  );
}

function ProcessStep({
  number,
  title,
  description,
  active,
  done,
}: {
  number: string;
  title: string;
  description: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-md
            text-sm
            font-semibold
            ${
              done
                ? 'bg-emerald-100 text-emerald-700'
                : active
                  ? 'bg-[#0b6f93] text-white'
                  : 'bg-slate-100 text-slate-500'
            }
          `}
        >
          {done ? (
            <CheckCircle2 size={20} />
          ) : (
            number
          )}
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
