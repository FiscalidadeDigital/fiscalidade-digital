'use client';

import Link from 'next/link';
import { useRef, useState, type KeyboardEvent } from 'react';
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  FileBarChart2,
  FileText,
  Landmark,
  type LucideIcon,
} from 'lucide-react';

type Solution = {
  id: string;
  number: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  benefits: string[];
  previewLabel: string;
  previewItems: string[];
  cta: string;
  href: string;
  Icon: LucideIcon;
};

const solutions: Solution[] = [
  {
    id: 'operacao',
    number: '01',
    label: 'Operação empresarial',
    eyebrow: 'Operação empresarial',
    title: 'Facturação mais simples. Negócios mais organizados.',
    description: 'Reúna facturas, pró-formas, compras, clientes e documentos num fluxo de trabalho mais claro para a equipa.',
    benefits: ['Documentos comerciais no mesmo ambiente', 'Consulta organizada da operação', 'Contexto para a equipa trabalhar melhor'],
    previewLabel: 'Fluxo organizado',
    previewItems: ['Facturação', 'Compras recebidas', 'Clientes e fornecedores'],
    cta: 'Criar conta',
    href: '/register',
    Icon: Briefcase,
  },
  {
    id: 'cumprimento',
    number: '02',
    label: 'Gestão e cumprimento fiscal',
    eyebrow: 'Gestão e cumprimento fiscal',
    title: 'Os impostos da sua empresa não precisam de ser uma surpresa.',
    description: 'Conheça as obrigações, acompanhe os prazos e planeie os pagamentos com uma leitura mais organizada da situação fiscal.',
    benefits: ['Enquadramento, obrigações e calendário', 'Simulações para apoiar a preparação', 'Alertas na plataforma e por e-mail'],
    previewLabel: 'Agenda fiscal',
    previewItems: ['Calendário fiscal', 'Prazos a acompanhar', 'Estados de cumprimento'],
    cta: 'Conhecer a plataforma',
    href: '/register',
    Icon: Landmark,
  },
  {
    id: 'informacao',
    number: '03',
    label: 'Contabilidade e informação',
    eyebrow: 'Contabilidade e informação',
    title: 'Informação estruturada para decisões mais claras.',
    description: 'Organize ficheiros, relatórios e informação de facturação sem perder o contexto do trabalho contabilístico.',
    benefits: ['Biblioteca documental privada', 'Relatórios disponíveis na plataforma', 'Dados organizados para SAF-T'],
    previewLabel: 'Informação da empresa',
    previewItems: ['Documentos privados', 'Relatórios', 'Dados contabilísticos'],
    cta: 'Explorar as soluções',
    href: '/register',
    Icon: FileBarChart2,
  },
  {
    id: 'conhecimento',
    number: '04',
    label: 'Conhecimento fiscal',
    eyebrow: 'Conhecimento fiscal',
    title: 'Mais contexto para compreender a operação fiscal.',
    description: 'Aceda a conteúdos de apoio e informação legislativa para preparar perguntas e decisões com melhor contexto.',
    benefits: ['Educação fiscal acessível', 'Biblioteca de legislação', 'Assistência inteligente para consulta responsável'],
    previewLabel: 'Base de conhecimento',
    previewItems: ['Conceitos fiscais', 'Referências legais', 'Temas para a equipa'],
    cta: 'Falar com a equipa',
    href: '#contacto',
    Icon: BookOpen,
  },
  {
    id: 'servicos',
    number: '05',
    label: 'Serviços especializados',
    eyebrow: 'Serviços especializados',
    title: 'Apoio especializado quando a decisão exige mais contexto.',
    description: 'Fale connosco sobre consultoria fiscal e contabilística para enquadrar os próximos passos da sua empresa.',
    benefits: ['Orientação fiscal ajustada ao contexto', 'Apoio contabilístico para decisões informadas', 'Canal directo para falar com a equipa'],
    previewLabel: 'Pedido de apoio',
    previewItems: ['Consultoria fiscal', 'Apoio contabilístico', 'Contexto da empresa'],
    cta: 'Falar com um especialista',
    href: '#contacto',
    Icon: CalendarDays,
  },
];

export default function WhyChooseSection() {
  const [activeId, setActiveId] = useState('cumprimento');
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = solutions.findIndex((solution) => solution.id === activeId);
  const active = solutions[activeIndex] ?? solutions[0];
  const ActiveIcon = active.Icon;

  function selectTab(nextIndex: number) {
    const index = (nextIndex + solutions.length) % solutions.length;
    setActiveId(solutions[index].id);
    tabsRef.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      selectTab(index + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      selectTab(index - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      selectTab(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectTab(solutions.length - 1);
    }
  }

  return (
    <section id="funcionalidades" aria-labelledby="why-choose-title" className="relative isolate overflow-hidden border-y border-cyan-100 bg-[#f5fafb] py-16 sm:py-20 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/3 h-48 w-48 rounded-full border border-emerald-200/70" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-7 border-b border-slate-200 pb-9 lg:grid-cols-[minmax(0,.9fr)_minmax(18rem,.55fr)] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-800">Soluções com contexto</p>
            <h2 id="why-choose-title" className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#102447] sm:text-4xl">Porquê escolher a Fiscalidade Digital?</h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-6 text-slate-700 sm:text-lg sm:leading-7">A sua empresa cresce. Nós ajudamos a manter a fiscalidade sob controlo.</p>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">Da emissão de facturas ao acompanhamento das obrigações fiscais, reunimos ferramentas, informação e serviços especializados para simplificar a gestão empresarial.</p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(16rem,.52fr)_minmax(0,1fr)] lg:items-start">
          <div role="tablist" aria-label="Soluções da Fiscalidade Digital" className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:sticky lg:top-28 lg:grid-cols-1">
            {solutions.map((solution, index) => {
              const selected = solution.id === active.id;
              const Icon = solution.Icon;
              return (
                <button
                  key={solution.id}
                  ref={(element) => { tabsRef.current[index] = element; }}
                  id={`solution-tab-${solution.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="solution-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveId(solution.id)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={`group min-h-[88px] min-w-[13.5rem] shrink-0 snap-start border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 motion-safe:hover:-translate-y-0.5 sm:min-h-[106px] sm:min-w-0 ${selected ? 'border-[#102447] bg-[#102447] text-white shadow-[0_14px_28px_rgba(16,36,71,.14)]' : 'border-slate-200 bg-white/90 text-[#102447] hover:border-cyan-300 hover:shadow-[0_10px_22px_rgba(15,41,79,.07)]'}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? 'bg-white/12 text-cyan-200' : 'bg-cyan-50 text-cyan-800'}`}><Icon size={18} aria-hidden="true" /></span>
                  <span className={`mt-3 block text-[10px] font-bold tracking-[.14em] ${selected ? 'text-cyan-200' : 'text-slate-500'}`}>{solution.number}</span>
                  <span className="mt-1 block text-sm font-extrabold leading-5">{solution.label}</span>
                </button>
              );
            })}
          </div>

          <div id="solution-panel" role="tabpanel" aria-labelledby={`solution-tab-${active.id}`} className="overflow-hidden border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,41,79,.08)]">
            <div key={active.id} className="fd-solution-panel grid lg:grid-cols-[minmax(0,1fr)_minmax(17rem,.78fr)]">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-800">{active.eyebrow}</p>
                    <h3 className="mt-4 max-w-2xl text-2xl font-extrabold leading-tight tracking-[-.04em] text-[#102447] sm:text-3xl">{active.title}</h3>
                  </div>
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800 sm:flex"><ActiveIcon size={21} aria-hidden="true" /></span>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{active.description}</p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                  {active.benefits.map((benefit) => <li key={benefit} className="border-t border-slate-200 pt-3 text-sm font-semibold leading-5 text-slate-700"><Check size={16} className="mb-2 text-cyan-700" aria-hidden="true" />{benefit}</li>)}
                </ul>
                <Link href={active.href} className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#102447] px-4 py-2.5 text-sm font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#17365f] motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">{active.cta}<ArrowRight size={17} aria-hidden="true" /></Link>
              </div>

              <div className="border-t border-slate-200 bg-[#eaf5f7] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                {active.id === 'cumprimento' ? <FiscalAlertPreview /> : <SolutionPreview active={active} />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fd-solution-panel-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fd-solution-panel { animation: fd-solution-panel-in 360ms cubic-bezier(.22,1,.36,1) both; }
        @media (prefers-reduced-motion: reduce) { .fd-solution-panel { animation: none; } }
      `}</style>
    </section>
  );
}

function SolutionPreview({ active }: { active: Solution }) {
  return <div className="border border-[#cfe5ea] bg-white p-5 shadow-[0_12px_28px_rgba(15,41,79,.08)]"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-800">{active.previewLabel}</p><h4 className="mt-3 text-lg font-extrabold tracking-[-.02em] text-[#102447]">{active.eyebrow}</h4><div className="mt-6 space-y-3">{active.previewItems.map((item, index) => <div key={item} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-xs font-extrabold text-cyan-800">0{index + 1}</span><span className="text-sm font-bold text-slate-700">{item}</span></div>)}</div><p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Exemplo de organização dentro da plataforma.</p></div>;
}

function FiscalAlertPreview() {
  return <div className="border border-[#cfe5ea] bg-white p-5 shadow-[0_12px_28px_rgba(15,41,79,.08)]">
    <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-800">Demonstração de alerta</p><BellRing size={18} className="text-emerald-600" aria-hidden="true" /></div>
    <h4 className="mt-4 text-lg font-extrabold tracking-[-.02em] text-[#102447]">IVA — Declaração periódica</h4>
    <dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><dt className="text-slate-500">Prazo</dt><dd className="text-right font-bold text-[#102447]">30 de Novembro de 2026<small className="mt-0.5 block font-normal text-slate-500">Exemplo ilustrativo</small></dd></div><div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><dt className="text-slate-500">Estado</dt><dd className="font-bold text-amber-700">Prazo a aproximar-se</dd></div><div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><dt className="text-slate-500">Valor</dt><dd className="font-bold text-[#102447]">A determinar</dd></div></dl>
    <div className="mt-6 rounded-xl bg-[#102447] p-4 text-white"><p className="text-xs font-extrabold text-cyan-200">Fiscalidade Digital</p><p className="mt-2 text-sm font-semibold leading-5">A sua empresa tem uma obrigação fiscal com prazo próximo.</p><p className="mt-2 text-xs leading-5 text-slate-300">Consulte o calendário fiscal para verificar a informação aplicável.</p></div>
    <p className="mt-5 text-xs leading-5 text-slate-500">Alertas disponíveis na plataforma e por e-mail. SMS e WhatsApp dependem de configuração e consentimento.</p>
  </div>;
}
