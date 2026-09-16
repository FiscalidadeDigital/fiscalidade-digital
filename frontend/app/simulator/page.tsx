'use client';

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import DashboardLayout from '@/components/layout/DashboardLayout';

import { getCompany } from '@/services/company';

import {
  calculateIVA,
  calculateRetention,
  calculateIndustrial,
  IvaOperation,
} from '@/services/tax-calculator';

import {
  Calculator,
  Percent,
  WalletCards,
  Factory,
  ShoppingCart,
  Box,
  FileText,
  Truck,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  RotateCcw,
  TrendingUp,
  Receipt,
  Landmark,
  Zap,
  CircleDollarSign,
} from 'lucide-react';

type Company = any;
type ApiResult = any;

// =====================================================
// FORMATAÇÃO
// =====================================================

function money(value: unknown): string {
  const number =
    typeof value === 'number'
      ? value
      : Number(value);

  if (!Number.isFinite(number)) {
    return '0,00';
  }

  return number.toLocaleString('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseAmount(value: string): number {
  if (!value) {
    return NaN;
  }

  return Number(
    value
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.'),
  );
}

function resultValue(
  result: ApiResult,
  field: string,
  oldField?: string,
): number {
  if (!result) {
    return 0;
  }

  const direct = result[field];

  if (
    direct !== undefined &&
    direct !== null
  ) {
    return Number(direct) || 0;
  }

  const calculation =
    result.calculation;

  if (
    calculation &&
    calculation[field] !== undefined &&
    calculation[field] !== null
  ) {
    return (
      Number(
        calculation[field],
      ) || 0
    );
  }

  if (
    oldField &&
    calculation &&
    calculation[oldField] !== undefined &&
    calculation[oldField] !== null
  ) {
    return (
      Number(
        calculation[oldField],
      ) || 0
    );
  }

  return 0;
}

// =====================================================
// PÁGINA
// =====================================================

export default function SimulatorPage() {
  const [
    company,
    setCompany,
  ] = useState<Company>(null);

  const [
    loadingCompany,
    setLoadingCompany,
  ] = useState(true);

  // ===================================================
  // IVA
  // ===================================================

  const [
    ivaOperation,
    setIvaOperation,
  ] = useState<IvaOperation>(
    IvaOperation.SALE,
  );

  const [
    ivaAmount,
    setIvaAmount,
  ] = useState('');

  const [
    productType,
    setProductType,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    ivaLoading,
    setIvaLoading,
  ] = useState(false);

  const [
    ivaError,
    setIvaError,
  ] = useState('');

  const [
    ivaResult,
    setIvaResult,
  ] = useState<ApiResult>(null);

  // ===================================================
  // RETENÇÃO
  // ===================================================

  const [
    retentionAmount,
    setRetentionAmount,
  ] = useState('');

  const [
    retentionLoading,
    setRetentionLoading,
  ] = useState(false);

  const [
    retentionError,
    setRetentionError,
  ] = useState('');

  const [
    retentionResult,
    setRetentionResult,
  ] = useState<ApiResult>(null);

  // ===================================================
  // INDUSTRIAL
  // ===================================================

  const [
    receitas,
    setReceitas,
  ] = useState('');

  const [
    custos,
    setCustos,
  ] = useState('');

  const [
    industrialLoading,
    setIndustrialLoading,
  ] = useState(false);

  const [
    industrialError,
    setIndustrialError,
  ] = useState('');

  const [
    industrialResult,
    setIndustrialResult,
  ] = useState<ApiResult>(null);

  // ===================================================
  // CARREGAR EMPRESA
  // ===================================================

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      setLoadingCompany(true);

      const data = await getCompany();

      setCompany(data);
    } catch (error) {
      console.error(
        'Erro ao carregar empresa:',
        error,
      );
    } finally {
      setLoadingCompany(false);
    }
  }

  // ===================================================
  // IVA
  // ===================================================

  async function handleIVA() {
    setIvaError('');
    setIvaResult(null);

    const amount =
      parseAmount(ivaAmount);

    if (
      !ivaAmount ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setIvaError(
        'Informe um valor de operação válido.',
      );

      return;
    }

    try {
      setIvaLoading(true);

      const result =
        await calculateIVA({
          amount,
          operation: ivaOperation,
          productType:
            productType || undefined,
          description:
            description || undefined,
        });

      setIvaResult(result);
    } catch (error: any) {
      console.error(
        'Erro ao calcular IVA:',
        error,
      );

      setIvaError(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível calcular o IVA.',
      );
    } finally {
      setIvaLoading(false);
    }
  }

  // ===================================================
  // RETENÇÃO
  // ===================================================

  async function handleRetention() {
    setRetentionError('');
    setRetentionResult(null);

    const amount =
      parseAmount(
        retentionAmount,
      );

    if (
      !retentionAmount ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setRetentionError(
        'Informe um valor de serviço válido.',
      );

      return;
    }

    try {
      setRetentionLoading(true);

      const result =
        await calculateRetention(
          amount,
        );

      setRetentionResult(result);
    } catch (error: any) {
      console.error(
        'Erro ao calcular retenção:',
        error,
      );

      setRetentionError(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível calcular a retenção.',
      );
    } finally {
      setRetentionLoading(false);
    }
  }

  // ===================================================
  // INDUSTRIAL
  // ===================================================

  async function handleIndustrial() {
    setIndustrialError('');
    setIndustrialResult(null);

    const revenue =
      parseAmount(receitas);

    const cost =
      parseAmount(custos);

    if (
      !receitas ||
      !Number.isFinite(revenue) ||
      revenue < 0
    ) {
      setIndustrialError(
        'Informe receitas válidas.',
      );

      return;
    }

    if (
      !custos ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      setIndustrialError(
        'Informe custos válidos.',
      );

      return;
    }

    if (cost > revenue) {
      setIndustrialError(
        'Os custos não podem ser superiores às receitas.',
      );

      return;
    }

    try {
      setIndustrialLoading(true);

      const result =
        await calculateIndustrial(
          revenue,
          cost,
        );

      setIndustrialResult(result);
    } catch (error: any) {
      console.error(
        'Erro ao calcular imposto industrial:',
        error,
      );

      setIndustrialError(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível calcular o imposto industrial.',
      );
    } finally {
      setIndustrialLoading(false);
    }
  }

  // ===================================================
  // LIMPAR
  // ===================================================

  function clearIVA() {
    setIvaAmount('');
    setProductType('');
    setDescription('');
    setIvaResult(null);
    setIvaError('');
  }

  function clearRetention() {
    setRetentionAmount('');
    setRetentionResult(null);
    setRetentionError('');
  }

  function clearIndustrial() {
    setReceitas('');
    setCustos('');
    setIndustrialResult(null);
    setIndustrialError('');
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loadingCompany) {
    return (
      <DashboardLayout
        company={company}
      >
        <div className="min-h-[600px] flex items-center justify-center">

          <div className="flex flex-col items-center gap-4">

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Loader2
                size={22}
                className="animate-spin text-indigo-600"
              />
            </div>

            <div className="text-center">

              <p className="font-semibold text-slate-800">
                A carregar o simulador
              </p>

              <p className="text-sm text-slate-500 mt-1">
                Aguarde um momento...
              </p>

            </div>

          </div>

        </div>
      </DashboardLayout>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <DashboardLayout
      company={company}
    >
      <div className="max-w-[1500px] mx-auto pb-14">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden bg-white border border-slate-200 rounded-[28px] shadow-sm mb-7">

          {/* DECORAÇÃO */}

          <div className="absolute top-0 right-0 w-[420px] h-full pointer-events-none overflow-hidden">

            <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-indigo-100/70 blur-3xl" />

            <div className="absolute top-28 right-28 w-48 h-48 rounded-full bg-violet-100/50 blur-3xl" />

          </div>

          <div className="relative p-7 md:p-9">

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

              {/* ESQUERDA */}

              <div className="flex items-start gap-5">

                <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center shrink-0">

                  <Calculator
                    size={30}
                    className="text-indigo-600"
                  />

                </div>

                <div className="max-w-3xl">

                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 mb-3">

                    <span className="w-2 h-2 rounded-full bg-emerald-500" />

                    Motor Fiscal

                  </div>

                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950">
                    Simulador Fiscal
                  </h1>

                  <p className="text-slate-500 mt-3 text-sm md:text-base leading-7 max-w-2xl">
                    Calcule impostos e retenções de forma
                    simples, rápida e organizada. Escolha
                    um módulo, informe os valores e obtenha
                    o resultado da simulação.
                  </p>

                </div>

              </div>

              {/* DIREITA */}

              <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-[190px]">

                <button
                  type="button"
                  onClick={loadCompany}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                >
                  <RefreshCw size={17} />

                  Atualizar dados
                </button>

                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-500">

                  <Zap
                    size={14}
                    className="text-indigo-500"
                  />

                  Cálculo em tempo real

                </div>

              </div>

            </div>

            {/* INDICADORES */}

            <div className="mt-8 pt-6 border-t border-slate-100">

              <div className="flex flex-wrap items-center gap-x-7 gap-y-4">

                <HeroStat
                  icon={
                    <Calculator size={16} />
                  }
                  label="Módulos fiscais"
                  value="3"
                />

                <HeroDivider />

                <HeroStat
                  icon={
                    <CircleDollarSign size={16} />
                  }
                  label="Moeda"
                  value="AOA"
                />

                <HeroDivider />

                <HeroStat
                  icon={
                    <CheckCircle2 size={16} />
                  }
                  label="Estado"
                  value="Disponível"
                />

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            EMPRESA ATIVA
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 mb-7">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">

                <Factory
                  size={26}
                  className="text-indigo-600"
                />

              </div>

              <div className="min-w-0">

                <div className="flex items-center gap-2 mb-1">

                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                    Empresa activa
                  </p>

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

                </div>

                <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate">
                  {company?.name ||
                    company?.razaoSocial ||
                    'Empresa não identificada'}
                </h2>

                <p className="text-sm text-slate-500 mt-0.5">

                  NIF:{' '}

                  <span className="font-medium text-slate-700">
                    {company?.nif ||
                      company?.NIF ||
                      'Não informado'}
                  </span>

                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">

                <Landmark
                  size={16}
                  className="text-slate-500"
                />

                <span className="text-sm font-semibold text-slate-600">
                  Fiscalidade Digital
                </span>

              </div>

              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold">

                <CheckCircle2 size={16} />

                Activo

              </span>

            </div>

          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4">

            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">

              <CheckCircle2
                size={17}
                className="text-indigo-600"
              />

            </div>

            <div>

              <p className="text-sm font-semibold text-slate-800">
                Motor fiscal disponível
              </p>

              <p className="text-sm text-slate-500 leading-6 mt-0.5">
                Os cálculos são processados pelo motor
                fiscal do sistema e os resultados são
                apresentados em tempo real.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            RESUMO DOS MÓDULOS
        ================================================= */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">

          <ModuleSummary
            icon={
              <Percent size={18} />
            }
            title="IVA"
            description="Operações de compra, venda, serviços, importação e exportação."
            rate="14%"
            iconClass="bg-indigo-50 text-indigo-600"
          />

          <ModuleSummary
            icon={
              <WalletCards size={18} />
            }
            title="Retenção na Fonte"
            description="Estimativa do valor retido e do valor líquido."
            rate="6,5%"
            iconClass="bg-orange-50 text-orange-600"
          />

          <ModuleSummary
            icon={
              <TrendingUp size={18} />
            }
            title="Imposto Industrial"
            description="Estimativa com base nas receitas e nos custos."
            rate="25%"
            iconClass="bg-emerald-50 text-emerald-600"
          />

        </div>

        {/* =================================================
            TÍTULO DOS SIMULADORES
        ================================================= */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600 mb-1">
              Ferramentas fiscais
            </p>

            <h2 className="text-2xl font-bold text-slate-950">
              Escolha um simulador
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Preencha os dados abaixo para obter uma
              estimativa.
            </p>

          </div>

          <span className="text-xs font-semibold text-slate-400">
            Valores apresentados em AOA
          </span>

        </div>

        {/* =================================================
            SIMULADORES
        ================================================= */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* =================================================
              IVA
          ================================================= */}

          <SimulatorCard
            title="IVA"
            subtitle="Imposto sobre o Valor Acrescentado"
            icon={
              <Percent size={23} />
            }
            iconClass="bg-indigo-50 text-indigo-600"
            borderClass="border-indigo-100"
            rate="14%"
          >

            <div className="mb-6">

              <label className="block text-sm font-bold text-slate-700 mb-3">
                Tipo de operação
              </label>

              <div className="grid grid-cols-2 gap-2">

                <OperationButton
                  active={
                    ivaOperation ===
                    IvaOperation.PURCHASE
                  }
                  icon={
                    <ShoppingCart size={16} />
                  }
                  label="Compra"
                  onClick={() =>
                    setIvaOperation(
                      IvaOperation.PURCHASE,
                    )
                  }
                />

                <OperationButton
                  active={
                    ivaOperation ===
                    IvaOperation.SALE
                  }
                  icon={
                    <Box size={16} />
                  }
                  label="Venda"
                  onClick={() =>
                    setIvaOperation(
                      IvaOperation.SALE,
                    )
                  }
                />

                <OperationButton
                  active={
                    ivaOperation ===
                    IvaOperation.SERVICE
                  }
                  icon={
                    <FileText size={16} />
                  }
                  label="Prestação"
                  onClick={() =>
                    setIvaOperation(
                      IvaOperation.SERVICE,
                    )
                  }
                />

                <OperationButton
                  active={
                    ivaOperation ===
                    IvaOperation.IMPORT
                  }
                  icon={
                    <Truck size={16} />
                  }
                  label="Importação"
                  onClick={() =>
                    setIvaOperation(
                      IvaOperation.IMPORT,
                    )
                  }
                />

                <OperationButton
                  active={
                    ivaOperation ===
                    IvaOperation.EXPORT
                  }
                  icon={
                    <Globe2 size={16} />
                  }
                  label="Exportação"
                  onClick={() =>
                    setIvaOperation(
                      IvaOperation.EXPORT,
                    )
                  }
                />

              </div>

            </div>

            <Field
              label="Valor da operação"
              placeholder="Ex.: 100000"
              value={ivaAmount}
              onChange={setIvaAmount}
              type="number"
              suffix="AOA"
            />

            <Field
              label="Produto ou serviço"
              placeholder="Ex.: Material de construção"
              value={productType}
              onChange={setProductType}
            />

            <TextareaField
              label="Descrição"
              optional
              placeholder="Descreva brevemente a operação..."
              value={description}
              onChange={setDescription}
            />

            {ivaError && (
              <ErrorBox
                message={ivaError}
              />
            )}

            <CalculateButton
              loading={ivaLoading}
              onClick={handleIVA}
              label="Calcular IVA"
              loadingLabel="A calcular IVA..."
              className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
            />

            {ivaResult && (
              <div className="mt-7 pt-6 border-t border-slate-100">

                <ResultTitle
                  title="Resultado do cálculo"
                  badge={
                    ivaOperation ===
                    IvaOperation.PURCHASE
                      ? 'Compra'
                      : ivaOperation ===
                        IvaOperation.SALE
                      ? 'Venda'
                      : ivaOperation ===
                        IvaOperation.SERVICE
                      ? 'Prestação'
                      : ivaOperation ===
                        IvaOperation.IMPORT
                      ? 'Importação'
                      : 'Exportação'
                  }
                />

                <div className="rounded-2xl border border-slate-100 overflow-hidden">

                  <ResultRow
                    label="Regime"
                    value={
                      ivaResult.regime ||
                      'GERAL'
                    }
                  />

                  <ResultRow
                    label="Base tributável"
                    value={`${money(
                      resultValue(
                        ivaResult,
                        'taxableBase',
                        'taxableAmount',
                      ),
                    )} AOA`}
                  />

                  <ResultRow
                    label="Taxa aplicada"
                    value={`${money(
                      resultValue(
                        ivaResult,
                        'ratePercent',
                      ),
                    )}%`}
                  />

                  <ResultRow
                    label="IVA calculado"
                    value={`${money(
                      resultValue(
                        ivaResult,
                        'iva',
                      ),
                    )} AOA`}
                    emphasized
                  />

                </div>

                <ResultHighlight
                  label="Total da operação"
                  value={`${money(
                    resultValue(
                      ivaResult,
                      'total',
                    ),
                  )} AOA`}
                  className="bg-indigo-50 border-indigo-100 text-indigo-600"
                />

                <ClearButton
                  onClick={clearIVA}
                />

              </div>
            )}

          </SimulatorCard>

          {/* =================================================
              RETENÇÃO
          ================================================= */}

          <SimulatorCard
            title="Retenção na Fonte"
            subtitle="Simulação da retenção aplicável"
            icon={
              <WalletCards size={23} />
            }
            iconClass="bg-orange-50 text-orange-600"
            borderClass="border-orange-100"
            rate="6,5%"
          >

            <div className="mb-6 rounded-2xl bg-orange-50/60 border border-orange-100 p-4">

              <div className="flex items-start gap-3">

                <Receipt
                  size={18}
                  className="text-orange-500 mt-0.5 shrink-0"
                />

                <div>

                  <p className="text-sm font-bold text-slate-800">
                    Cálculo da retenção
                  </p>

                  <p className="text-xs text-slate-500 leading-5 mt-1">
                    Informe o valor do serviço para
                    estimar a retenção e o valor líquido.
                  </p>

                </div>

              </div>

            </div>

            <Field
              label="Valor do serviço"
              placeholder="Ex.: 100000"
              value={retentionAmount}
              onChange={setRetentionAmount}
              type="number"
              suffix="AOA"
            />

            {retentionError && (
              <ErrorBox
                message={retentionError}
              />
            )}

            <CalculateButton
              loading={retentionLoading}
              onClick={handleRetention}
              label="Calcular retenção"
              loadingLabel="A calcular retenção..."
              className="bg-orange-500 hover:bg-orange-600 shadow-orange-100"
            />

            {retentionResult && (
              <div className="mt-7 pt-6 border-t border-slate-100">

                <ResultTitle
                  title="Resultado do cálculo"
                  badge="Retenção"
                />

                <div className="rounded-2xl border border-slate-100 overflow-hidden">

                  <ResultRow
                    label="Regime"
                    value={
                      retentionResult.regime ||
                      'GERAL'
                    }
                  />

                  <ResultRow
                    label="Base tributável"
                    value={`${money(
                      resultValue(
                        retentionResult,
                        'amount',
                      ),
                    )} AOA`}
                  />

                  <ResultRow
                    label="Taxa aplicada"
                    value={`${money(
                      resultValue(
                        retentionResult,
                        'ratePercent',
                      ),
                    )}%`}
                  />

                  <ResultRow
                    label="Retenção"
                    value={`${money(
                      resultValue(
                        retentionResult,
                        'retention',
                      ),
                    )} AOA`}
                    emphasized
                  />

                </div>

                <ResultHighlight
                  label="Valor líquido"
                  value={`${money(
                    resultValue(
                      retentionResult,
                      'netAmount',
                      'net',
                    ),
                  )} AOA`}
                  className="bg-orange-50 border-orange-100 text-orange-600"
                />

                <ClearButton
                  onClick={clearRetention}
                />

              </div>
            )}

          </SimulatorCard>

          {/* =================================================
              INDUSTRIAL
          ================================================= */}

          <SimulatorCard
            title="Imposto Industrial"
            subtitle="Estimativa baseada em receitas e custos"
            icon={
              <Factory size={23} />
            }
            iconClass="bg-emerald-50 text-emerald-600"
            borderClass="border-emerald-100"
            rate="25%"
          >

            <div className="mb-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4">

              <div className="flex items-start gap-3">

                <TrendingUp
                  size={18}
                  className="text-emerald-600 mt-0.5 shrink-0"
                />

                <div>

                  <p className="text-sm font-bold text-slate-800">
                    Base do cálculo
                  </p>

                  <p className="text-xs text-slate-500 leading-5 mt-1">
                    Informe as receitas e os custos para
                    estimar a matéria colectável e o imposto.
                  </p>

                </div>

              </div>

            </div>

            <Field
              label="Receitas"
              placeholder="Ex.: 500000"
              value={receitas}
              onChange={setReceitas}
              type="number"
              suffix="AOA"
            />

            <Field
              label="Custos"
              placeholder="Ex.: 200000"
              value={custos}
              onChange={setCustos}
              type="number"
              suffix="AOA"
            />

            {industrialError && (
              <ErrorBox
                message={industrialError}
              />
            )}

            <CalculateButton
              loading={industrialLoading}
              onClick={handleIndustrial}
              label="Calcular imposto"
              loadingLabel="A calcular imposto..."
              className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
            />

            {industrialResult && (
              <div className="mt-7 pt-6 border-t border-slate-100">

                <ResultTitle
                  title="Resultado do cálculo"
                  badge="Industrial"
                />

                <div className="rounded-2xl border border-slate-100 overflow-hidden">

                  <ResultRow
                    label="Regime"
                    value={
                      industrialResult.regime ||
                      'GERAL'
                    }
                  />

                  <ResultRow
                    label="Receitas"
                    value={`${money(
                      resultValue(
                        industrialResult,
                        'receitas',
                      ),
                    )} AOA`}
                  />

                  <ResultRow
                    label="Custos"
                    value={`${money(
                      resultValue(
                        industrialResult,
                        'custos',
                      ),
                    )} AOA`}
                  />

                  <ResultRow
                    label="Matéria colectável"
                    value={`${money(
                      resultValue(
                        industrialResult,
                        'materiaColectavel',
                      ),
                    )} AOA`}
                    emphasized
                  />

                  <ResultRow
                    label="Taxa aplicada"
                    value={`${money(
                      resultValue(
                        industrialResult,
                        'ratePercent',
                      ),
                    )}%`}
                  />

                </div>

                <ResultHighlight
                  label="Imposto estimado"
                  value={`${money(
                    resultValue(
                      industrialResult,
                      'imposto',
                      'estimatedTax',
                    ),
                  )} AOA`}
                  className="bg-emerald-50 border-emerald-100 text-emerald-600"
                />

                <ClearButton
                  onClick={clearIndustrial}
                />

              </div>
            )}

          </SimulatorCard>

        </div>

        {/* =================================================
            AVISO LEGAL
        ================================================= */}

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex items-start gap-3">

            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">

              <AlertCircle
                size={18}
                className="text-slate-500"
              />

            </div>

            <div>

              <p className="text-sm font-bold text-slate-800 mb-1">
                Nota sobre as simulações
              </p>

              <p className="text-sm text-slate-500 leading-6">
                Os valores apresentados são estimativas
                calculadas com base nos parâmetros
                configurados no sistema e nos dados
                informados. Antes de utilizar um resultado
                numa declaração ou obrigação fiscal,
                confirme o enquadramento fiscal aplicável.
              </p>

            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

// =====================================================
// HERO STAT
// =====================================================

function HeroStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">

      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>

      <div>

        <p className="text-[11px] text-slate-400 font-medium">
          {label}
        </p>

        <p className="text-xs font-bold text-slate-700">
          {value}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// HERO DIVIDER
// =====================================================

function HeroDivider() {
  return (
    <div className="hidden md:block w-px h-8 bg-slate-200" />
  );
}

// =====================================================
// RESUMO DE MÓDULO
// =====================================================

function ModuleSummary({
  icon,
  title,
  description,
  rate,
  iconClass,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  rate: string;
  iconClass: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      <div className="flex items-start gap-3">

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-center justify-between gap-3">

            <h3 className="font-bold text-slate-900 text-sm">
              {title}
            </h3>

            <span className="text-xs font-bold text-slate-500">
              {rate}
            </span>

          </div>

          <p className="text-xs text-slate-500 leading-5 mt-1">
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// CARD
// =====================================================

function SimulatorCard({
  title,
  subtitle,
  icon,
  iconClass,
  borderClass,
  rate,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconClass: string;
  borderClass: string;
  rate: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`bg-white border ${borderClass} rounded-[26px] shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200`}
    >

      <div className="h-1 bg-slate-100">
        <div className="h-full w-1/3 bg-indigo-500 opacity-20" />
      </div>

      <div className="p-6 md:p-7">

        <div className="flex items-start justify-between gap-4 mb-7">

          <div className="flex items-start gap-3 min-w-0">

            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconClass}`}
            >
              {icon}
            </div>

            <div className="min-w-0">

              <h2 className="text-lg font-bold text-slate-900">
                {title}
              </h2>

              <p className="text-xs md:text-sm text-slate-500 leading-5 mt-1">
                {subtitle}
              </p>

            </div>

          </div>

          <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            {rate}
          </span>

        </div>

        {children}

      </div>

    </section>
  );
}

// =====================================================
// FIELD
// =====================================================

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  suffix,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
}) {
  return (
    <div className="mb-5">

      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>

      <div className="relative">

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) =>
            onChange(
              e.target.value,
            )
          }
          className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 ${
            suffix
              ? 'pr-16'
              : ''
          } py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition`}
        />

        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            {suffix}
          </span>
        )}

      </div>

    </div>
  );
}

// =====================================================
// TEXTAREA
// =====================================================

function TextareaField({
  label,
  optional,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  optional?: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5">

      <label className="block text-sm font-bold text-slate-700 mb-2">

        {label}

        {optional && (
          <span className="ml-1.5 font-normal text-slate-400">
            (opcional)
          </span>
        )}

      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value,
          )
        }
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition"
      />

    </div>
  );
}

// =====================================================
// BOTÃO OPERAÇÃO
// =====================================================

function OperationButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        min-h-[46px]
        flex items-center justify-center gap-2
        rounded-xl border
        px-3 py-2.5
        text-xs font-bold
        transition-all duration-200
        ${
          active
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
        }
      `}
    >
      {icon}

      <span>{label}</span>

    </button>
  );
}

// =====================================================
// BOTÃO CALCULAR
// =====================================================

function CalculateButton({
  loading,
  onClick,
  label,
  loadingLabel,
  className,
}: {
  loading: boolean;
  onClick: () => void;
  label: string;
  loadingLabel: string;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full min-h-[50px] flex items-center justify-center gap-2 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 ${className}`}
    >
      {loading ? (
        <>
          <Loader2
            size={18}
            className="animate-spin"
          />

          {loadingLabel}
        </>
      ) : (
        <>
          <Calculator size={18} />

          {label}

          <ArrowRight size={16} />
        </>
      )}
    </button>
  );
}

// =====================================================
// TÍTULO DO RESULTADO
// =====================================================

function ResultTitle({
  title,
  badge,
}: {
  title: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">

      <div className="flex items-center gap-2">

        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">

          <Calculator
            size={14}
            className="text-slate-500"
          />

        </div>

        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>

      </div>

      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
        {badge}
      </span>

    </div>
  );
}

// =====================================================
// LINHA DE RESULTADO
// =====================================================

function ResultRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-100 last:border-b-0">

      <span
        className={`text-xs ${
          emphasized
            ? 'font-semibold text-slate-700'
            : 'text-slate-500'
        }`}
      >
        {label}
      </span>

      <strong
        className={`text-xs text-right ${
          emphasized
            ? 'text-slate-900 font-bold'
            : 'text-slate-700 font-semibold'
        }`}
      >
        {value}
      </strong>

    </div>
  );
}

// =====================================================
// RESULTADO DESTACADO
// =====================================================

function ResultHighlight({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div
      className={`mt-4 rounded-2xl border p-4 flex items-center justify-between gap-4 ${className}`}
    >

      <span className="text-sm font-bold text-slate-700">
        {label}
      </span>

      <strong className="text-lg md:text-xl font-extrabold">
        {value}
      </strong>

    </div>
  );
}

// =====================================================
// LIMPAR
// =====================================================

function ClearButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition"
    >
      <RotateCcw size={14} />

      Limpar resultado
    </button>
  );
}

// =====================================================
// ERRO
// =====================================================

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">

      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">

        <AlertCircle
          size={16}
          className="text-red-500"
        />

      </div>

      <div>

        <p className="text-xs font-bold text-red-700">
          Não foi possível concluir o cálculo
        </p>

        <p className="text-xs text-red-600 leading-5 mt-0.5">
          {message}
        </p>

      </div>

    </div>
  );
}