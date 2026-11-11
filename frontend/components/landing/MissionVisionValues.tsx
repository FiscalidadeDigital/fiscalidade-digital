'use client';

import { useReducedMotion } from 'framer-motion';

type LandingLocale = 'pt-AO' | 'en';

type PurposeItem = {
  id: 'mission' | 'vision' | 'values';
  label: string;
  description: string;
  values?: readonly string[];
};

type PurposeContent = {
  eyebrow: string;
  title: string;
  introduction: string;
  valuesLabel: string;
  items: readonly PurposeItem[];
};

const purposeContent: Record<LandingLocale, PurposeContent> = {
  'pt-AO': {
    eyebrow: 'O nosso compromisso',
    title: 'Missão, visão e valores.',
    introduction: 'O que orienta o nosso trabalho com empresas e cidadãos em Angola.',
    valuesLabel: 'Valores da Fiscalidade Digital',
    items: [
      {
        id: 'mission',
        label: 'Missão',
        description: 'Promover a literacia fiscal e a conformidade tributária em Angola através de uma plataforma digital que apoia empresas e cidadãos na organização da gestão fiscal.',
      },
      {
        id: 'vision',
        label: 'Visão',
        description: 'Ser a principal referência em soluções digitais fiscais em Angola, contribuindo para um ambiente empresarial mais saudável, competitivo e sustentável.',
      },
      {
        id: 'values',
        label: 'Valores',
        description: 'Princípios presentes nas decisões, funcionalidades e relações que construímos.',
        values: ['Transparência', 'Educação', 'Inovação', 'Compromisso', 'Simplicidade'],
      },
    ],
  },
  en: {
    eyebrow: 'Our commitment',
    title: 'Mission, vision and values.',
    introduction: 'What guides our work with companies and citizens in Angola.',
    valuesLabel: 'Fiscalidade Digital values',
    items: [
      {
        id: 'mission',
        label: 'Mission',
        description: 'To promote tax literacy and tax compliance in Angola through a digital platform that supports companies and citizens in organising tax management.',
      },
      {
        id: 'vision',
        label: 'Vision',
        description: 'To be a reference in tax technology in Angola, contributing to a better informed and better prepared business environment.',
      },
      {
        id: 'values',
        label: 'Values',
        description: 'Principles present in the decisions, features and relationships we build.',
        values: ['Transparency', 'Education', 'Innovation', 'Commitment', 'Simplicity'],
      },
    ],
  },
};

export default function MissionVisionValues({ locale }: { locale: LandingLocale }) {
  const content = purposeContent[locale];
  const reduceMotion = useReducedMotion();

  return (
    <section id="missao-visao-valores" aria-labelledby="mission-vision-values-title" data-motion={reduceMotion ? 'reduced' : 'standard'} className="mt-16 border-y border-slate-200 py-10 sm:py-12 lg:mt-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,.82fr)_minmax(18rem,.58fr)] lg:items-end">
        <div>
          <p className="text-sm font-medium text-fd-accent">{content.eyebrow}</p>
          <h2 id="mission-vision-values-title" className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-fd-text sm:text-4xl">{content.title}</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{content.introduction}</p>
      </div>

      <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {content.items.map((item) => (
          <article key={item.id} className="border-t border-slate-300 pt-5">
            <h3 className="text-lg font-bold text-fd-text">{item.label}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            {item.values ? (
              <ul aria-label={content.valuesLabel} className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-sm font-medium text-fd-primary">
                {item.values.map((value) => <li key={value}>{value}</li>)}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
