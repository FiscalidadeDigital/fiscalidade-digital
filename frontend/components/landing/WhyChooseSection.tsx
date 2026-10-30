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
  number: string;
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
      number: '01',
      label: 'Operação empresarial',
      eyebrow: 'Operação empresarial',
      title: 'Facturação mais simples. Negócios mais organizados.',
      description: 'Reúna facturas, pró-formas, compras, clientes, fornecedores e produtos num fluxo de trabalho mais claro.',
      benefits: ['Documentos comerciais no mesmo ambiente', 'Consulta organizada da operação', 'Contexto para a equipa trabalhar melhor'],
      previewTitle: 'Documentos e operação',
      previewLabel: 'Fluxo organizado',
      previewItems: ['Facturação', 'Compras recebidas', 'Clientes e fornecedores'],
      cta: 'Criar a minha conta',
      ctaHref: '/register',
      Icon: FileText,
    },
    {
      id: 'compliance',
      number: '02',
      label: 'Gestão e cumprimento fiscal',
      eyebrow: 'Gestão e cumprimento fiscal',
      title: 'Os compromissos fiscais, sempre mais visíveis.',
      description: 'Acompanhe obrigações, prazos, estados e simulações com uma leitura mais organizada da situação da empresa.',
      benefits: ['Calendário e prazos por acompanhar', 'Obrigações com estado operacional', 'Simulações para apoiar a preparação'],
      previewTitle: 'Agenda fiscal',
      previewLabel: 'Acompanhamento',
      previewItems: ['Períodos fiscais', 'Prazos a acompanhar', 'Estados de cumprimento'],
      cta: 'Conhecer a plataforma',
      ctaHref: '/register',
      Icon: CalendarDays,
    },
    {
      id: 'information',
      number: '03',
      label: 'Contabilidade e informação',
      eyebrow: 'Contabilidade e informação',
      title: 'Informação estruturada para decisões mais claras.',
      description: 'Organize ficheiros, relatórios, informação de facturação e recursos contabilísticos sem perder o contexto do trabalho.',
      benefits: ['Biblioteca documental privada', 'Relatórios disponíveis na plataforma', 'Estruturação de informação contabilística'],
      previewTitle: 'Informação da empresa',
      previewLabel: 'Consulta e organização',
      previewItems: ['Documentos privados', 'Relatórios', 'Dados para SAF-T'],
      cta: 'Explorar as soluções',
      ctaHref: '/register',
      Icon: FileSpreadsheet,
    },
    {
      id: 'knowledge',
      number: '04',
      label: 'Conhecimento fiscal',
      eyebrow: 'Conhecimento fiscal',
      title: 'Mais contexto para compreender a operação fiscal.',
      description: 'Aceda a conteúdos de apoio e informação legislativa para preparar perguntas e decisões com melhor contexto.',
      benefits: ['Educação fiscal acessível', 'Biblioteca de legislação', 'Informação apresentada para revisão responsável'],
      previewTitle: 'Base de conhecimento',
      previewLabel: 'Apoio à consulta',
      previewItems: ['Conceitos fiscais', 'Referências legais', 'Temas para a equipa'],
      cta: 'Falar com a equipa',
      ctaHref: '#contacto',
      Icon: BookOpen,
    },
    {
      id: 'specialised-services',
      number: '05',
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
      number: '01',
      label: 'Business operations',
      eyebrow: 'Business operations',
      title: 'Simpler invoicing. Better-organised businesses.',
      description: 'Bring invoices, pro formas, purchases, customers, suppliers and products into a clearer working flow.',
      benefits: ['Commercial documents in one environment', 'A more organised operational view', 'Context for the team to work better'],
      previewTitle: 'Documents and operations',
      previewLabel: 'Organised flow',
      previewItems: ['Invoicing', 'Received purchases', 'Customers and suppliers'],
      cta: 'Create my account',
      ctaHref: '/register',
      Icon: FileText,
    },
    {
      id: 'compliance',
      number: '02',
      label: 'Tax management and compliance',
      eyebrow: 'Tax management and compliance',
      title: 'Tax commitments, easier to keep in view.',
      description: 'Follow obligations, deadlines, statuses and simulations with a better-organised view of the company.',
      benefits: ['Calendar and deadlines to follow', 'Obligations with operational status', 'Simulations to support preparation'],
      previewTitle: 'Tax agenda',
      previewLabel: 'Follow-up',
      previewItems: ['Tax periods', 'Upcoming deadlines', 'Compliance status'],
      cta: 'Explore the platform',
      ctaHref: '/register',
      Icon: CalendarDays,
    },
    {
      id: 'information',
      number: '03',
      label: 'Accounting and information',
      eyebrow: 'Accounting and information',
      title: 'Structured information for clearer decisions.',
      description: 'Organise files, reports, invoicing information and accounting resources without losing the context of the work.',
      benefits: ['Private document library', 'Reports available in the platform', 'Structured accounting information'],
      previewTitle: 'Company information',
      previewLabel: 'Review and organisation',
      previewItems: ['Private documents', 'Reports', 'SAF-T data'],
      cta: 'Explore the solutions',
      ctaHref: '/register',
      Icon: FileSpreadsheet,
    },
    {
      id: 'knowledge',
      number: '04',
      label: 'Tax knowledge',
      eyebrow: 'Tax knowledge',
      title: 'More context to understand tax operations.',
      description: 'Access support content and legislative information to prepare questions and decisions with better context.',
      benefits: ['Accessible tax education', 'Legislation library', 'Information presented for responsible review'],
      previewTitle: 'Knowledge base',
      previewLabel: 'Research support',
      previewItems: ['Tax concepts', 'Legal references', 'Topics for the team'],
      cta: 'Talk to the team',
      ctaHref: '#contacto',
      Icon: BookOpen,
    },
    {
      id: 'specialised-services',
      number: '05',
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
    <section id="funcionalidades" aria-labelledby="why-choose-title" className="bg-[#f7fafc] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div data-reveal className="landing-reveal grid gap-7 border-b border-slate-200 pb-9 lg:grid-cols-[minmax(0,.82fr)_minmax(20rem,.58fr)] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">
              {copy(locale, 'Soluções com contexto', 'Solutions with context')}
            </p>
            <h2 id="why-choose-title" className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#102447] sm:text-4xl">
              {copy(locale, 'Porquê escolher a Fiscalidade Digital?', 'Why choose Fiscalidade Digital?')}
            </h2>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-6 text-slate-700 sm:text-lg sm:leading-7">
              {copy(locale, 'Porque a sua empresa merece mais tempo para crescer e menos complexidade para gerir.', 'Because your company deserves more time to grow and less complexity to manage.')}
            </p>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {copy(locale, 'Da operação diária ao acompanhamento fiscal, reunimos informação e ferramentas num ambiente mais claro para a equipa.', 'From daily operations to tax follow-up, we bring information and tools together in a clearer environment for the team.')}
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
                className={`group min-h-[92px] min-w-[13.5rem] shrink-0 snap-start border p-4 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 motion-safe:hover:-translate-y-0.5 sm:min-h-[132px] sm:min-w-0 ${active ? 'border-[#102447] bg-[#102447] text-white shadow-[0_14px_28px_rgba(16,36,71,.14)]' : 'border-slate-200 bg-white text-[#102447] hover:border-cyan-300 hover:shadow-[0_10px_22px_rgba(15,41,79,.07)]'}`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-white/12 text-cyan-200' : 'bg-cyan-50 text-cyan-800'}`}>
                  <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className={`mt-3 block text-[10px] font-bold tracking-[.14em] sm:mt-5 ${active ? 'text-cyan-200' : 'text-slate-600'}`}>{group.number}</span>
                <span className="mt-1 block text-sm font-extrabold leading-5">{group.label}</span>
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
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">{activeGroup.eyebrow}</p>
                    <h3 className="mt-4 max-w-2xl text-2xl font-extrabold leading-tight tracking-[-.04em] text-[#102447] sm:text-3xl">{activeGroup.title}</h3>
                  </div>
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800 sm:flex">
                    <ActiveIcon size={21} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{activeGroup.description}</p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                  {activeGroup.benefits.map((benefit) => (
                    <li key={benefit} className="border-t border-slate-200 pt-3 text-sm font-semibold leading-5 text-slate-700">
                      <Check size={16} className="mb-2 text-cyan-700" aria-hidden="true" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <Link href={activeGroup.ctaHref} className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#102447] px-4 py-2.5 text-sm font-extrabold text-white transition-[background-color,transform] duration-200 hover:bg-[#17365f] motion-safe:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
                  {activeGroup.cta}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>

              <div className="border-t border-slate-200 bg-[#eef7f9] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                <div className="border border-[#d4e8ed] bg-white p-4 shadow-[0_12px_28px_rgba(15,41,79,.08)] sm:p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-700">{activeGroup.previewLabel}</p>
                      <p className="mt-1 text-sm font-extrabold text-[#102447]">{activeGroup.previewTitle}</p>
                    </div>
                    <BarChart3 size={19} className="text-cyan-700" aria-hidden="true" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {activeGroup.previewItems.map((item, index) => (
                      <div key={item} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-cyan-500' : 'bg-slate-300'}`} aria-hidden="true" />
                        <span className="text-xs font-bold text-slate-700">{item}</span>
                        <span className={`ml-auto h-1.5 rounded-full ${index === 0 ? 'w-16 bg-cyan-200' : index === 1 ? 'w-11 bg-slate-200' : 'w-8 bg-slate-100'}`} aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </div>
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
