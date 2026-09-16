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
  ChevronRight,
  CircleDollarSign,
  FileText,
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

import {
  approvePayroll,
  calculatePayroll,
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

function getErrorMessage(error: any): string {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Não foi possível concluir a operação.'
  );
}

export default function PayrollPage() {
  const currentDate = new Date();

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
      <div className="space-y-6">
        {/* CABEÇALHO */}
        <section>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                <span>Gestão</span>

                <ChevronRight size={15} />

                <span className="font-medium text-slate-600">
                  Folha Salarial
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Wallet size={23} />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950">
                    Folha Salarial
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Gestão, cálculo e controlo das
                    remunerações dos funcionários.
                  </p>
                </div>
              </div>
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
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  text-sm
                  font-bold
                  text-slate-700
                  shadow-sm
                  transition
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

              <button
                type="button"
                onClick={() => {
                  setCreateMonth(month);
                  setCreateYear(year);
                  setShowCreate(true);
                }}
                className="
                  inline-flex
                  h-11
                  items-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-5
                  text-sm
                  font-bold
                  text-white
                  shadow-lg
                  shadow-blue-600/20
                  transition
                  hover:bg-blue-700
                "
              >
                <Plus size={18} />

                Nova folha
              </button>
            </div>
          </div>
        </section>

        {/* ERRO */}
        {error && (
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
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
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Período de processamento
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-900">
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
                    rounded-xl
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
                    rounded-xl
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
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2
                size={32}
                className="mx-auto animate-spin text-blue-600"
              />

              <p className="mt-3 text-sm font-semibold text-slate-500">
                A carregar folha salarial...
              </p>
            </div>
          </div>
        ) : !selectedPayroll ? (
          /* EMPTY STATE */
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <Wallet size={34} />
            </div>

            <h2 className="mt-6 text-2xl font-black text-slate-950">
              Nenhuma folha neste período
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Crie a folha salarial para{' '}
              <strong>
                {MONTHS[month - 1]} {year}
              </strong>
              . Os funcionários activos e os
              salários activos serão adicionados
              automaticamente.
            </p>

            <button
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
                rounded-xl
                bg-blue-600
                px-5
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-blue-600/20
                transition
                hover:bg-blue-700
              "
            >
              <Plus size={18} />

              Criar folha
            </button>
          </section>
        ) : (
          <>
            {/* RESUMO */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                description={`SS ${shortMoney(
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

            {/* ESTADO */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Folha actual
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black text-slate-950">
                      {MONTHS[
                        selectedPayroll.month -
                          1
                      ]}{' '}
                      {selectedPayroll.year}
                    </h2>

                    <span
                      className={`
                        rounded-full
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
                  <ActionButton
                    label="Calcular"
                    icon={
                      <Calculator
                        size={17}
                      />
                    }
                    onClick={
                      handleCalculate
                    }
                    disabled={
                      working ||
                      selectedPayroll.status ===
                        'PAID' ||
                      selectedPayroll.status ===
                        'CLOSED'
                    }
                    primary
                  />

                  <ActionButton
                    label="Aprovar"
                    icon={
                      <CheckCircle2
                        size={17}
                      />
                    }
                    onClick={
                      handleApprove
                    }
                    disabled={
                      working ||
                      selectedPayroll.status !==
                        'CALCULATED'
                    }
                  />

                  <ActionButton
                    label="Marcar como paga"
                    icon={
                      <Wallet size={17} />
                    }
                    onClick={handlePay}
                    disabled={
                      working ||
                      selectedPayroll.status !==
                        'APPROVED'
                    }
                  />
                </div>
              </div>
            </section>

            {/* INDICADORES */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            </section>

            {/* FUNCIONÁRIOS */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
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
                      rounded-xl
                      border
                      border-slate-200
                      bg-slate-50
                      pl-10
                      pr-4
                      text-sm
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                    "
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
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
                        Segurança Social
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
                          colSpan={7}
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
                                      rounded-xl
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
                <h2 className="text-lg font-black text-slate-950">
                  Fluxo da folha
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Acompanhe as etapas do processamento.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              </div>
            </section>
          </>
        )}
      </div>

      {/* MODAL CRIAR */}
      {showCreate && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
            backdrop-blur-sm
          "
        >
          <div
            className="
              w-full
              max-w-[500px]
              overflow-hidden
              rounded-3xl
              bg-white
              shadow-2xl
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
                  rounded-xl
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
                    rounded-xl
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
                    rounded-xl
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
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                    <Users size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-black text-blue-900">
                      Funcionários activos
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      A folha será criada automaticamente
                      com os funcionários activos e os
                      salários activos registados.
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
                    rounded-xl
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
                    rounded-xl
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
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
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-black text-slate-900">
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
        rounded-xl
        px-4
        text-sm
        font-bold
        transition
        disabled:cursor-not-allowed
        disabled:opacity-40
        ${
          primary
            ? `
              bg-blue-600
              text-white
              shadow-md
              shadow-blue-600/20
              hover:bg-blue-700
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
        font-black
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
            ? 'font-black text-emerald-700'
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            text-sm
            font-black
            ${
              done
                ? 'bg-emerald-100 text-emerald-700'
                : active
                  ? 'bg-blue-600 text-white'
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
          <h3 className="font-black text-slate-900">
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