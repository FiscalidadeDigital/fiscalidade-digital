'use client';

import { AlertCircle, AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, Clock3, FileCheck2, Landmark, Loader2, RefreshCw, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFiscalSituation, type FiscalSituation, type FiscalSituationTax } from '@/services/fiscal-situation';

const presentation: Record<FiscalSituationTax['taxType'], { label: string; description: string; icon: typeof Landmark }> = {
  IVA: { label: 'IVA', description: 'Imposto sobre o Valor Acrescentado', icon: Landmark },
  INDUSTRIAL: { label: 'Imposto Industrial', description: 'Enquadramento autónomo do Imposto Industrial', icon: ShieldCheck },
  IRT: { label: 'IRT', description: 'Imposto sobre Rendimentos do Trabalho', icon: Users },
  SS: { label: 'INSS', description: 'Segurança Social associada aos factos laborais', icon: ShieldAlert },
  SAFT: { label: 'SAF-T', description: 'Requisito declarativo e de reporte contabilístico', icon: FileCheck2 },
};

const statusStyle: Record<string, { label: string; classes: string }> = {
  APPLICABLE: { label: 'Aplicável', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
  NOT_APPLICABLE: { label: 'Não aplicável', classes: 'bg-slate-100 text-slate-600 ring-slate-200' },
  REVIEW_REQUIRED: { label: 'Revisão necessária', classes: 'bg-amber-50 text-amber-700 ring-amber-100' },
  MISSING_INFORMATION: { label: 'Informação em falta', classes: 'bg-amber-50 text-amber-700 ring-amber-100' },
};

const currentPeriod = () => new Date().toISOString().slice(0, 7);

function formatDate(value?: string | null) {
  if (!value) return 'Não definida';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatPeriod(value: string) {
  const [year, month] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-AO', { month: 'long', year: 'numeric' }).format(new Date(year, (month || 1) - 1, 1));
}

export default function FiscalSituationPage() {
  const [period, setPeriod] = useState(currentPeriod);
  const [situation, setSituation] = useState<FiscalSituation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(selectedPeriod = period) {
    try {
      setLoading(true);
      setError('');
      setSituation(await getFiscalSituation(selectedPeriod));
    } catch (requestError: any) {
      console.error('Não foi possível carregar a situação fiscal.', requestError);
      setSituation(null);
      setError(requestError?.response?.data?.message || 'Não foi possível carregar a situação fiscal. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(period); }, [period]);

  const nextObligations = useMemo(() => (situation?.taxes || [])
    .filter((tax) => tax.nextObligation)
    .map((tax) => ({ tax, obligation: tax.nextObligation! }))
    .sort((a, b) => (a.obligation.dueDate || '9999-12-31').localeCompare(b.obligation.dueDate || '9999-12-31')), [situation]);

  return <DashboardLayout><main className="min-h-full bg-[#f7f9fc] px-4 py-5 sm:px-6 lg:px-8 lg:py-7"><div className="mx-auto max-w-7xl">
    <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#e5ebf3] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0787ad]">Central Fiscal</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111b3b]">Situação Fiscal</h1><p className="mt-1 max-w-2xl text-sm text-[#687896]">Visão consolidada de enquadramentos, obrigações e pontos que exigem atenção.</p></div>
      <div className="flex flex-wrap items-center gap-2"><Link href="/fiscal-enrollments" className="inline-flex items-center gap-2 rounded-xl border border-[#dce6f0] bg-white px-3 py-2 text-sm font-bold text-[#075f86] hover:bg-[#f2f7fb]"><ShieldCheck size={16} />Enquadramentos</Link><label className="flex items-center gap-3 rounded-xl border border-[#dce6f0] bg-[#fbfdff] px-3 py-2 text-sm font-semibold text-[#405275]"><CalendarDays size={17} className="text-[#0787ad]" /><span className="sr-only">Período de referência</span><input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-transparent text-sm outline-none" aria-label="Período de referência" /></label></div>
    </header>
    {error && <section role="alert" className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 shrink-0" size={19} /><p className="text-sm font-medium">{error}</p></div><button type="button" onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><RefreshCw size={14} />Tentar novamente</button></section>}
    {loading ? <LoadingState /> : situation ? <>
      <section aria-label="Resumo executivo" className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric title="Aplicáveis" value={situation.summary.applicable} tone="green" icon={<CheckCircle2 size={18} />} /><Metric title="Não aplicáveis" value={situation.summary.notApplicable} tone="slate" icon={<ShieldCheck size={18} />} /><Metric title="Em revisão" value={situation.summary.reviewRequired} tone="amber" icon={<AlertTriangle size={18} />} /><Metric title="Próximas" value={situation.summary.upcoming} tone="blue" icon={<CalendarClock size={18} />} /><Metric title="Em atraso" value={situation.summary.overdue} tone="red" icon={<Clock3 size={18} />} /></section>
      <section className="mb-6 rounded-2xl border border-[#e5ebf3] bg-white shadow-sm"><div className="border-b border-[#eef2f6] px-5 py-4 sm:px-6"><h2 className="text-base font-extrabold text-[#152343]">Enquadramento por domínio</h2><p className="mt-1 text-sm text-[#7180a2]">Referência: {formatPeriod(situation.period)}. IVA e Imposto Industrial são avaliados de forma independente.</p></div>{situation.taxes.length ? <div className="grid divide-y divide-[#eef2f6] lg:grid-cols-2 lg:divide-x lg:divide-y-0">{situation.taxes.map((tax) => <TaxCard key={tax.taxType} tax={tax} />)}</div> : <EmptyState />}</section>
      <section className="rounded-2xl border border-[#e5ebf3] bg-white shadow-sm"><div className="border-b border-[#eef2f6] px-5 py-4 sm:px-6"><h2 className="text-base font-extrabold text-[#152343]">Próximas obrigações</h2><p className="mt-1 text-sm text-[#7180a2]">Apenas obrigações pendentes ou em atraso associadas à situação atual.</p></div>{nextObligations.length ? <ul className="divide-y divide-[#eef2f6]">{nextObligations.map(({ tax, obligation }) => { const taxLabel = presentation[tax.taxType]?.label || tax.taxType; return <li key={`${tax.taxType}-${obligation.id || obligation.dueDate}`} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-bold text-[#152343]">{obligation.title || `${taxLabel} — obrigação fiscal`}</p><p className="mt-1 text-xs text-[#7180a2]">{taxLabel}{obligation.period ? ` · Período ${obligation.period}` : ''}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#f2f7fb] px-3 py-2 text-xs font-bold text-[#075f86]"><CalendarDays size={14} />{obligation.dueDate ? formatDate(obligation.dueDate) : 'Data não disponível'}</span></li>; })}</ul> : <div className="px-5 py-10 text-center sm:px-6"><CalendarClock className="mx-auto text-[#9aa8bd]" size={26} /><p className="mt-3 text-sm font-bold text-[#405275]">Sem obrigações pendentes neste período</p><p className="mt-1 text-sm text-[#7d8ba5]">Não são apresentadas datas estimadas quando o calendário oficial ainda não está disponível.</p></div>}</section>
    </> : !error ? <EmptyState /> : null}
  </div></main></DashboardLayout>;
}

function Metric({ title, value, tone, icon }: { title: string; value: number; tone: 'green' | 'slate' | 'amber' | 'blue' | 'red'; icon: ReactNode }) {
  const styles = { green: 'border-emerald-100 bg-emerald-50 text-emerald-700', slate: 'border-slate-200 bg-slate-50 text-slate-600', amber: 'border-amber-100 bg-amber-50 text-amber-700', blue: 'border-sky-100 bg-sky-50 text-sky-700', red: 'border-red-100 bg-red-50 text-red-700' };
  return <div className="rounded-2xl border border-[#e5ebf3] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#7180a2]">{title}</p><p className="mt-2 text-2xl font-extrabold tabular-nums text-[#152343]">{value}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-xl border ${styles[tone]}`}>{icon}</span></div></div>;
}

function TaxCard({ tax }: { tax: FiscalSituationTax }) {
  const item = presentation[tax.taxType] ?? { label: tax.taxType, description: 'Domínio fiscal', icon: Landmark }; const Icon = item.icon;
  const status = statusStyle[tax.applicability.status] || { label: tax.applicability.status, classes: 'bg-slate-100 text-slate-600 ring-slate-200' };
  const needsAttention = tax.attentionRequired || ['REVIEW_REQUIRED', 'MISSING_INFORMATION'].includes(tax.applicability.status);
  const pendingCalendar = tax.calendar.status === 'OFFICIAL_CALENDAR_PENDING';
  return <article className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf4f8] text-[#075f86]"><Icon size={20} /></span><div><h3 className="font-extrabold text-[#152343]">{item.label}</h3><p className="mt-0.5 text-xs leading-5 text-[#7180a2]">{item.description}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${status.classes}`}>{status.label}</span></div><div className="mt-4 space-y-3 rounded-xl bg-[#f8fafc] p-3.5 text-sm"><Detail label="Regime" value={tax.taxType === 'SAFT' ? 'Requisito de reporte — não é regime' : tax.enrollment?.regime || 'Sem enquadramento vigente'} />{tax.enrollment && <><Detail label="Vigência" value={`${formatDate(tax.enrollment.validFrom)}${tax.enrollment.validUntil ? ` até ${formatDate(tax.enrollment.validUntil)}` : ' — sem termo definido'}`} />{tax.enrollment.legalBasis?.diploma && <Detail label="Fundamento" value={tax.enrollment.legalBasis.diploma} />}</>}{pendingCalendar ? <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" />Calendário oficial de {tax.calendar.referenceYear} pendente. Nenhuma data de vencimento é inferida.</p> : <Detail label="Calendário" value={tax.calendar.status || 'Não disponível'} />}</div>{needsAttention && <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{tax.applicability.reasonCode || 'É necessária revisão antes de automatizar este enquadramento.'}</p>}{!tax.automationReady && !needsAttention && <p className="mt-3 text-xs text-[#7180a2]">Automação indisponível até confirmação dos dados ou regras aplicáveis.</p>}</article>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2"><span className="shrink-0 text-xs font-semibold text-[#7180a2]">{label}</span><span className="text-xs font-medium leading-5 text-[#405275]">{value}</span></div>; }
function LoadingState() { return <section className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#e5ebf3] bg-white text-center shadow-sm"><Loader2 className="animate-spin text-[#0787ad]" size={32} /><h2 className="mt-4 text-base font-bold text-[#152343]">A carregar a situação fiscal</h2><p className="mt-1 text-sm text-[#7180a2]">A consultar os dados do período selecionado.</p></section>; }
function EmptyState() { return <section className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-[#e5ebf3] bg-white px-6 text-center shadow-sm"><ShieldAlert className="text-[#9aa8bd]" size={30} /><h2 className="mt-4 text-base font-extrabold text-[#152343]">Sem informação fiscal para este período</h2><p className="mt-1 max-w-md text-sm leading-6 text-[#7180a2]">Não foram encontrados enquadramentos ou obrigações para apresentar. A página não cria dados nem estima prazos.</p></section>; }
