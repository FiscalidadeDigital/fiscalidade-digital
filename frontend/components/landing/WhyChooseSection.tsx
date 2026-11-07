'use client';

import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Briefcase,
  CalendarDays,
  Check,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import {
  type KeyboardEvent,
  useId,
  useMemo,
  useState,
} from 'react';

type LandingLocale = 'pt-AO' | 'en';

type SolutionGroup = {
  id: 'operation' | 'compliance' | 'information' | 'knowledge' | 'specialised-services';
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  benefits: readonly string[];
  previewTitle: string;
  previewLabel: string;
  previewItems: readonly string[];
  cta: string;
  ctaHref: string;
  Icon: LucideIcon;
};

const solutionGroups: Record<LandingLocale, readonly SolutionGroup[]> = {
  'pt-AO': [
    {
      id: 'operation',
      label: 'Operação empresarial',
      eyebrow: 'Operação empresarial',
      title: 'Emita facturas e mantenha a operação da empresa organizada.',
      description: 'Registe facturas, pró-formas, compras, clientes, fornecedores e produtos para acompanhar o dia a dia da empresa.',
      benefits: ['Facturas e pró-formas', 'Compras e facturas recebidas', 'Clientes, fornecedores e produtos'],
      previewTitle: 'Operação da empresa',
      previewLabel: 'Fluxo de trabalho',
      previewItems: ['Facturas', 'Compras recebidas', 'Clientes e fornecedores'],
      cta: 'Criar conta',
      ctaHref: '/register',
      Icon: FileText,
    },
    {
      id: 'compliance',
      label: 'Gestão e cumprimento fiscal',
      eyebrow: 'Gestão e cumprimento fiscal',
      title: 'Acompanhe os prazos fiscais que se aplicam à sua empresa.',
      description: 'Consulte obrigações, calendário por imposto e período, situação fiscal, pagamentos registados e simulações quando precisar de preparar a próxima decisão.',
      benefits: ['Calendário com contagem de dias', 'Obrigações e Central Fiscal', 'Alertas na plataforma'],
      previewTitle: 'Agenda fiscal',
      previewLabel: 'Acompanhamento',
      previewItems: ['Calendário fiscal', 'Obrigações a acompanhar', 'Situação fiscal'],
      cta: 'Criar conta',
      ctaHref: '/register',
      Icon: CalendarDays,
    },
    {
      id: 'information',
      label: 'Contabilidade e informação',
      eyebrow: 'Contabilidade e informação',
      title: 'Organize a informação contabilística sem procurar ficheiros em vários sítios.',
      description: 'Organize documentos e relatórios, acompanhe a facturação e gere e exporte o ficheiro SAF-T a partir dos dados registados.',
      benefits: ['Documentos da empresa', 'Relatórios e exportação CSV', 'Geração e exportação de SAF-T'],
      previewTitle: 'Informação da empresa',
      previewLabel: 'Consulta e organização',
      previewItems: ['Documentos', 'Relatórios', 'Ficheiro SAF-T'],
      cta: 'Criar conta',
      ctaHref: '/register',
      Icon: FileSpreadsheet,
    },
    {
      id: 'knowledge',
      label: 'Conhecimento fiscal',
      eyebrow: 'Conhecimento fiscal',
      title: 'Consulte legislação fiscal quando precisar de orientar uma decisão.',
      description: 'Pesquise a biblioteca de legislação fiscal disponível na plataforma.',
      benefits: ['Legislação fiscal', 'Pesquisa na biblioteca', 'Educação Fiscal'],
      previewTitle: 'Base de conhecimento',
      previewLabel: 'Apoio à consulta',
      previewItems: ['Legislação fiscal', 'Pesquisa na biblioteca', 'Educação Fiscal'],
      cta: 'Falar com a equipa',
      ctaHref: '#contacto',
      Icon: BookOpen,
    },
    {
      id: 'specialised-services',
      label: 'Serviços especializados',
      eyebrow: 'Serviços especializados',
      title: 'Apoio especializado quando a decisão exige mais contexto.',
      description: 'Fale connosco sobre consultoria fiscal e contabilística para enquadrar os próximos passos da sua empresa.',
      benefits: ['Orientação fiscal ajustada ao contexto', 'Apoio contabilístico para decisões informadas', 'Canal directo para falar com a equipa'],
      previewTitle: 'Pedido de apoio',
      previewLabel: 'Consulta especializada',
      previewItems: ['Consultoria fiscal', 'Apoio contabilístico', 'Contexto da empresa'],
      cta: 'Falar com um especialista',
      ctaHref: '#contacto',
      Icon: Briefcase,
    },
  ],
  en: [
    {
      id: 'operation',
      label: 'Business operations',
      eyebrow: 'Business operations',
      title: 'Issue invoices and keep company operations organised.',
      description: 'Record invoices, pro formas, purchases, customers, suppliers and products to follow the company’s daily activity.',
      benefits: ['Invoices and pro formas', 'Purchases and received invoices', 'Customers, suppliers and products'],
      previewTitle: 'Company operations',
      previewLabel: 'Working flow',
      previewItems: ['Invoices', 'Received purchases', 'Customers and suppliers'],
      cta: 'Create account',
      ctaHref: '/register',
      Icon: FileText,
    },
    {
      id: 'compliance',
      label: 'Tax management and compliance',
      eyebrow: 'Tax management and compliance',
      title: 'Follow the tax deadlines that apply to your company.',
      description: 'Consult obligations, the tax calendar by tax and period, tax situation, recorded payments and simulations when preparing the next decision.',
      benefits: ['Calendar with day counts', 'Obligations and Central Fiscal', 'Platform alerts'],
      previewTitle: 'Tax agenda',
      previewLabel: 'Follow-up',
      previewItems: ['Tax calendar', 'Obligations to follow', 'Tax situation'],
      cta: 'Create account',
      ctaHref: '/register',
      Icon: CalendarDays,
    },
    {
      id: 'information',
      label: 'Accounting and information',
      eyebrow: 'Accounting and information',
      title: 'Organise accounting information without searching through files in different places.',
      description: 'Organise documents and reports, follow invoicing and generate and export the SAF-T file from recorded data.',
      benefits: ['Company documents', 'Reports and CSV export', 'SAF-T generation and export'],
      previewTitle: 'Company information',
      previewLabel: 'Review and organisation',
      previewItems: ['Documents', 'Reports', 'SAF-T file'],
      cta: 'Create account',
      ctaHref: '/register',
      Icon: FileSpreadsheet,
    },
    {
      id: 'knowledge',
      label: 'Tax knowledge',
      eyebrow: 'Tax knowledge',
      title: 'Consult tax legislation when you need to guide a decision.',
      description: 'Search the tax legislation library available in the platform.',
      benefits: ['Tax legislation', 'Library search', 'Tax Education'],
      previewTitle: 'Knowledge base',
      previewLabel: 'Research support',
      previewItems: ['Tax legislation', 'Library search', 'Tax Education'],
      cta: 'Talk to the team',
      ctaHref: '#contacto',
      Icon: BookOpen,
    },
    {
      id: 'specialised-services',
      label: 'Specialised services',
      eyebrow: 'Specialised services',
      title: 'Specialised support when a decision needs more context.',
      description: 'Talk to us about tax and accounting consulting to frame the next steps for your company.',
      benefits: ['Tax guidance tailored to your context', 'Accounting support for informed decisions', 'A direct channel to talk to the team'],
      previewTitle: 'Support request',
      previewLabel: 'Specialised consultation',
      previewItems: ['Tax consulting', 'Accounting support', 'Company context'],
      cta: 'Talk to a specialist',
      ctaHref: '#contacto',
      Icon: Briefcase,
    },
  ],
};

function copy(locale: LandingLocale, portuguese: string, english: string) {
  return locale === 'en' ? english : portuguese;
}

export default function WhyChooseSection({ locale }: { locale: LandingLocale }) {
  const groups = solutionGroups[locale];
  const [activeId, setActiveId] = useState<SolutionGroup['id']>('operation');
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeId) ?? groups[0],
    [activeId, groups],
  );

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, direction: number) => {
    const index = groups.findIndex((group) => group.id === activeGroup.id);
    const nextIndex = (index + direction + groups.length) % groups.length;
    const nextGroup = groups[nextIndex];

    setActiveId(nextGroup.id);
    const tabs = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
    tabs[nextIndex]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(event, 1);
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(event, -1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveId(groups[0].id);
      event.currentTarget.parentElement?.querySelector<HTMLButtonElement>('[role="tab"]')?.focus();
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveId(groups[groups.length - 1].id);
      const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs?.[tabs.length - 1]?.focus();
    }
  };

  const ActiveIcon = activeGroup.Icon;
  const animation = reduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <section id="funcionalidades" aria-labelledby="why-choose-title" className="relative isolate overflow-hidden border-y border-cyan-100 bg-[#f5fafb] py-16 sm:py-20 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/3 h-48 w-48 rounded-full border border-emerald-200/70" />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div data-reveal className="landing-reveal grid gap-7 border-b border-slate-200 pb-9 lg:grid-cols-[minmax(0,.82fr)_minmax(20rem,.58fr)] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-fd-accent">
              {copy(locale, 'Soluções com contexto', 'Solutions with context')}
            </p>
            <h2 id="why-choose-title" className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-fd-text sm:text-4xl">
              {copy(locale, 'Porquê escolher a Fiscalidade Digital?', 'Why choose Fiscalidade Digital?')}
            </h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-6 text-slate-700 sm:text-lg sm:leading-7">
              {copy(locale, 'Porque a sua empresa merece mais tempo para crescer e menos complexidade para gerir.', 'Because your company deserves more time to grow and less complexity to manage.')}
            </p>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {copy(locale, 'Da emissão de facturas ao acompanhamento das obrigações fiscais, reunimos ferramentas, informação e serviços especializados para simplificar a gestão empresarial.', 'From invoicing to tax obligation follow-up, we bring together tools, information and specialised services to simplify business management.')}
          </p>
        </div>

        <div data-reveal className="landing-reveal landing-reveal--d1 -mx-5 mt-8 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5" role="tablist" aria-orientation="horizontal" aria-label={copy(locale, 'Soluções da Fiscalidade Digital', 'Fiscalidade Digital solutions')}>
          {groups.map((group) => {
            const Icon = group.Icon;
            const active = group.id === activeGroup.id;

            return (
              <button
                key={group.id}
                id={`solution-tab-${group.id}`}
                type="button"
                role="tab"
                aria-controls={panelId}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveId(group.id)}
                onKeyDown={handleTabKeyDown}
                className={`group relative min-h-[92px] min-w-[13.5rem] shrink-0 snap-start overflow-hidden border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 motion-safe:hover:-translate-y-0.5 sm:min-h-[132px] sm:min-w-0 ${active ? 'border-[#102447] bg-fd-primary text-white shadow-[0_14px_28px_rgba(16,36,71,.14)]' : 'border-slate-200 bg-white text-fd-text hover:border-fd-accent hover:shadow-[0_10px_22px_rgba(15,41,79,.07)]'}`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-white/12 text-cyan-200' : 'bg-fd-accent-soft text-fd-primary'}`}>
                  <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="mt-3 block text-sm font-extrabold leading-5 sm:mt-5">{group.label}</span>
                <span aria-hidden="true" className={`pointer-events-none absolute inset-x-4 bottom-0 h-[3px] origin-left rounded-t-full bg-cyan-200 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} />
              </button>
            );
          })}
        </div>

        <div id={panelId} role="tabpanel" aria-labelledby={`solution-tab-${activeGroup.id}`} className="mt-5 overflow-hidden border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,41,79,.06)] sm:mt-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeGroup.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={animation}
              className="grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]"
            >
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-fd-accent">{activeGroup.eyebrow}</p>
                    <h3 className="mt-4 max-w-2xl text-2xl font-extrabold leading-tight tracking-[-.04em] text-fd-text sm:text-3xl">{activeGroup.title}</h3>
                  </div>
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fd-accent-soft text-fd-primary sm:flex">
                    <ActiveIcon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{activeGroup.description}</p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                  {activeGroup.benefits.map((benefit) => (
                    <li key={benefit} className="border-t border-slate-200 pt-3 text-sm font-semibold leading-5 text-slate-700">
                      <Check size={16} className="mb-2 text-fd-accent" aria-hidden="true" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Link href={activeGroup.ctaHref} className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-fd-primary-hover motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
                  {activeGroup.cta}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>

              <div className="border-t border-slate-200 bg-[#eef7f9] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                {activeGroup.id === 'compliance' ? <FiscalAlertPreview locale={locale} /> : <div className="border border-[#d4e8ed] bg-white p-4 shadow-[0_12px_28px_rgba(15,41,79,.08)] sm:p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-fd-accent">{activeGroup.previewLabel}</p>
                      <p className="mt-1 text-sm font-extrabold text-fd-text">{activeGroup.previewTitle}</p>
                    </div>
                    <BarChart3 size={19} className="text-fd-accent" aria-hidden="true" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {activeGroup.previewItems.map((item, index) => (
                      <div key={item} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-fd-primary' : 'bg-slate-300'}`} aria-hidden="true" />
                        <span className="text-xs font-bold text-slate-700">{item}</span>
                        <span className={`ml-auto h-1.5 rounded-full ${index === 0 ? 'w-16 bg-cyan-200' : index === 1 ? 'w-11 bg-slate-200' : 'w-8 bg-slate-100'}`} aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </div>}
                <p className="mt-5 max-w-sm text-xs leading-5 text-slate-500">
                  {copy(locale, 'Uma visão ilustrativa da informação organizada por contexto — sem dados empresariais expostos.', 'An illustrative view of information organised by context — with no company data exposed.')}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <p data-reveal className="landing-reveal landing-reveal--d2 mt-7 max-w-3xl text-sm font-semibold leading-6 text-[#36506d]">
          {copy(locale, 'Uma plataforma. Múltiplas soluções. Mais controlo para o seu negócio.', 'One platform. Multiple solutions. More control for your business.')}
        </p>
      </div>
    </section>
  );
}

function FiscalAlertPreview({ locale }: { locale: LandingLocale }) {
  return (
    <div className="border border-[#d4e8ed] bg-white p-4 shadow-[0_12px_28px_rgba(15,41,79,.08)] sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-fd-accent">{copy(locale, 'Demonstração de alerta', 'Alert demonstration')}</p>
          <p className="mt-1 text-sm font-extrabold text-fd-text">{copy(locale, 'Agenda fiscal', 'Tax agenda')}</p>
        </div>
        <BellRing size={19} className="text-emerald-600" aria-hidden="true" />
      </div>
      <h4 className="mt-5 text-base font-extrabold text-fd-text">{copy(locale, 'Obrigação fiscal', 'Tax obligation')}</h4>
      <dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><dt className="text-slate-500">{copy(locale, 'Prazo', 'Due date')}</dt><dd className="text-right font-bold text-fd-text">{copy(locale, 'Consulte o calendário', 'Check the calendar')}<small className="mt-0.5 block font-normal text-slate-500">{copy(locale, 'Exemplo ilustrativo', 'Illustrative example')}</small></dd></div><div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><dt className="text-slate-500">{copy(locale, 'Estado', 'Status')}</dt><dd className="font-bold text-amber-700">{copy(locale, 'A acompanhar', 'To follow')}</dd></div><div className="flex justify-between gap-4 border-t border-slate-100 pt-3"><dt className="text-slate-500">{copy(locale, 'Valor', 'Amount')}</dt><dd className="font-bold text-fd-text">{copy(locale, 'A determinar', 'To be determined')}</dd></div></dl>
      <div className="mt-5 rounded-xl bg-fd-primary p-4 text-white"><p className="text-xs font-extrabold text-cyan-200">Fiscalidade Digital</p><p className="mt-2 text-xs font-semibold leading-5">{copy(locale, 'Há uma obrigação fiscal a acompanhar.', 'There is a tax obligation to follow.')}</p><p className="mt-2 text-xs leading-5 text-slate-300">{copy(locale, 'Consulte o calendário fiscal para verificar a informação aplicável.', 'Check the tax calendar to review the applicable information.')}</p></div>
      <p className="mt-5 text-xs leading-5 text-slate-500">{copy(locale, 'Demonstração fictícia. Os alertas são apresentados na plataforma.', 'Fictional demonstration. Alerts are shown in the platform.')}</p>
    </div>
  );
}
