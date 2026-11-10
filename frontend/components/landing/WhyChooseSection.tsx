'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
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
  previewItems: readonly string[];
  cta: string;
  ctaHref: string;
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
      previewItems: ['Facturas', 'Compras recebidas', 'Clientes e fornecedores'],
      cta: 'Criar conta',
      ctaHref: '/register',
    },
    {
      id: 'compliance',
      label: 'Gestão fiscal',
      eyebrow: 'Gestão e cumprimento fiscal',
      title: 'Acompanhe os prazos fiscais que se aplicam à sua empresa.',
      description: 'Consulte obrigações, calendário por imposto e período, situação fiscal, pagamentos registados e simulações quando precisar de preparar a próxima decisão.',
      benefits: ['Calendário com contagem de dias', 'Obrigações e Central Fiscal', 'Alertas na plataforma'],
      previewTitle: 'Agenda fiscal',
      previewItems: ['Calendário fiscal', 'Obrigações a acompanhar', 'Situação fiscal'],
      cta: 'Criar conta',
      ctaHref: '/register',
    },
    {
      id: 'information',
      label: 'Informação da empresa',
      eyebrow: 'Contabilidade e informação',
      title: 'Organize a informação contabilística sem procurar ficheiros em vários sítios.',
      description: 'Organize documentos e relatórios, acompanhe a facturação e gere e exporte o ficheiro SAF-T a partir dos dados registados.',
      benefits: ['Documentos da empresa', 'Relatórios e exportação CSV', 'Geração e exportação de SAF-T'],
      previewTitle: 'Informação da empresa',
      previewItems: ['Documentos', 'Relatórios', 'Ficheiro SAF-T'],
      cta: 'Criar conta',
      ctaHref: '/register',
    },
    {
      id: 'knowledge',
      label: 'Conhecimento fiscal',
      eyebrow: 'Conhecimento fiscal',
      title: 'Consulte legislação fiscal quando precisar de orientar uma decisão.',
      description: 'Pesquise a biblioteca de legislação fiscal disponível na plataforma.',
      benefits: ['Legislação fiscal', 'Pesquisa na biblioteca', 'Educação Fiscal'],
      previewTitle: 'Biblioteca fiscal',
      previewItems: ['Legislação fiscal', 'Pesquisa na biblioteca', 'Educação Fiscal'],
      cta: 'Falar com a equipa',
      ctaHref: '#contacto',
    },
    {
      id: 'specialised-services',
      label: 'Serviços especializados',
      eyebrow: 'Serviços especializados',
      title: 'Peça apoio quando a decisão exige mais contexto.',
      description: 'Fale connosco sobre consultoria fiscal e contabilística para enquadrar os próximos passos da sua empresa.',
      benefits: ['Orientação fiscal ajustada ao contexto', 'Apoio contabilístico para decisões informadas', 'Canal directo para falar com a equipa'],
      previewTitle: 'Pedido de apoio',
      previewItems: ['Consultoria fiscal', 'Apoio contabilístico', 'Contexto da empresa'],
      cta: 'Falar com a equipa',
      ctaHref: '#contacto',
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
      previewItems: ['Invoices', 'Received purchases', 'Customers and suppliers'],
      cta: 'Create account',
      ctaHref: '/register',
    },
    {
      id: 'compliance',
      label: 'Tax management',
      eyebrow: 'Tax management and compliance',
      title: 'Follow the tax deadlines that apply to your company.',
      description: 'Consult obligations, the tax calendar by tax and period, tax situation, recorded payments and simulations when preparing the next decision.',
      benefits: ['Calendar with day counts', 'Obligations and Central Fiscal', 'Platform alerts'],
      previewTitle: 'Tax agenda',
      previewItems: ['Tax calendar', 'Obligations to follow', 'Tax situation'],
      cta: 'Create account',
      ctaHref: '/register',
    },
    {
      id: 'information',
      label: 'Company information',
      eyebrow: 'Accounting and information',
      title: 'Organise accounting information without searching through files in different places.',
      description: 'Organise documents and reports, follow invoicing and generate and export the SAF-T file from recorded data.',
      benefits: ['Company documents', 'Reports and CSV export', 'SAF-T generation and export'],
      previewTitle: 'Company information',
      previewItems: ['Documents', 'Reports', 'SAF-T file'],
      cta: 'Create account',
      ctaHref: '/register',
    },
    {
      id: 'knowledge',
      label: 'Tax knowledge',
      eyebrow: 'Tax knowledge',
      title: 'Consult tax legislation when you need to guide a decision.',
      description: 'Search the tax legislation library available in the platform.',
      benefits: ['Tax legislation', 'Library search', 'Tax Education'],
      previewTitle: 'Tax library',
      previewItems: ['Tax legislation', 'Library search', 'Tax Education'],
      cta: 'Talk to the team',
      ctaHref: '#contacto',
    },
    {
      id: 'specialised-services',
      label: 'Specialised support',
      eyebrow: 'Specialised services',
      title: 'Ask for support when a decision needs more context.',
      description: 'Talk to us about tax and accounting consulting to frame the next steps for your company.',
      benefits: ['Tax guidance tailored to your context', 'Accounting support for informed decisions', 'A direct channel to talk to the team'],
      previewTitle: 'Support request',
      previewItems: ['Tax consulting', 'Accounting support', 'Company context'],
      cta: 'Talk to the team',
      ctaHref: '#contacto',
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

  return (
    <section id="funcionalidades" aria-labelledby="why-choose-title" data-motion={reduceMotion ? 'reduced' : 'standard'} className="border-y border-slate-200 bg-[var(--fd-surface-muted)] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-6 border-b border-slate-200 pb-9 lg:grid-cols-[minmax(0,.82fr)_minmax(20rem,.58fr)] lg:items-end">
          <div>
            <p className="text-sm font-medium text-fd-accent">{copy(locale, 'A plataforma', 'The platform')}</p>
            <h2 id="why-choose-title" className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-fd-text sm:text-4xl">
              {copy(locale, 'Porquê escolher a Fiscalidade Digital?', 'Why choose Fiscalidade Digital?')}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            {copy(locale, 'Porque a sua empresa merece mais tempo para crescer e menos complexidade para gerir. Da emissão de facturas ao acompanhamento das obrigações fiscais, encontre as ferramentas e a informação registada pela empresa.', 'Because your company deserves more time to grow and less complexity to manage. From invoicing to tax obligation follow-up, find the tools and information recorded by the company.')}
          </p>
        </div>

        <div className="-mx-5 mt-8 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist" aria-orientation="horizontal" aria-label={copy(locale, 'Áreas da Fiscalidade Digital', 'Fiscalidade Digital areas')}>
          <div className="flex min-w-max border-b border-slate-300 sm:min-w-0 sm:justify-between">
            {groups.map((group) => {
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
                  className={`min-h-11 shrink-0 border-b-2 px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-700 sm:px-4 ${active ? 'border-fd-primary text-fd-primary' : 'border-transparent text-slate-600 hover:border-slate-400 hover:text-fd-text'}`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
        </div>

        <div id={panelId} role="tabpanel" aria-labelledby={`solution-tab-${activeGroup.id}`} className="mt-8 grid border-y border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.8fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-sm font-medium text-fd-accent">{activeGroup.eyebrow}</p>
            <h3 className="mt-4 max-w-2xl text-2xl font-bold leading-tight text-fd-text sm:text-3xl">{activeGroup.title}</h3>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{activeGroup.description}</p>
            <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {activeGroup.benefits.map((benefit) => (
                <li key={benefit} className="py-3 text-sm font-medium leading-6 text-slate-700">{benefit}</li>
              ))}
            </ul>
            <Link href={activeGroup.ctaHref} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fd-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
              {activeGroup.cta}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <ProductPreview group={activeGroup} locale={locale} />
        </div>
      </div>
    </section>
  );
}

function ProductPreview({ group, locale }: { group: SolutionGroup; locale: LandingLocale }) {
  return (
    <aside className="border-t border-slate-200 bg-[var(--fd-surface-muted)] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-sm font-bold text-fd-text">{group.previewTitle}</p>
        </div>
        <ul className="divide-y divide-slate-100 px-4">
          {group.previewItems.map((item, index) => (
            <li key={item} className="flex items-center gap-3 py-4 text-sm text-slate-700">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-fd-accent' : 'bg-slate-300'}`} />
              {item}
              <span aria-hidden="true" className="ml-auto text-xs text-slate-600">{index === 0 ? copy(locale, 'Activo', 'Active') : copy(locale, 'Consulta', 'View')}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
