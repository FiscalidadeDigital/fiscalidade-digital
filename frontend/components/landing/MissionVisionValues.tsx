'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Eye, HeartHandshake, Target, type LucideIcon } from 'lucide-react';

type LandingLocale = 'pt-AO' | 'en';

type PurposeCard = {
  id: 'mission' | 'vision' | 'values';
  label: string;
  description: string;
  values?: readonly string[];
  Icon: LucideIcon;
};

type PurposeContent = {
  eyebrow: string;
  title: string;
  introduction: string;
  valuesLabel: string;
  cards: readonly PurposeCard[];
};

const purposeContent: Record<LandingLocale, PurposeContent> = {
  'pt-AO': {
    eyebrow: 'O nosso compromisso',
    title: 'Missão, visão e valores que orientam a Fiscalidade Digital.',
    introduction: 'Uma forma mais clara, acessível e responsável de aproximar empresas e cidadãos da gestão fiscal.',
    valuesLabel: 'Valores da Fiscalidade Digital',
    cards: [
      {
        id: 'mission',
        label: 'Missão',
        description: 'Promover a literacia fiscal e a conformidade tributária em Angola através de uma plataforma digital intuitiva, que capacita empresas e cidadãos para uma gestão fiscal eficiente e sem multas.',
        Icon: Target,
      },
      {
        id: 'vision',
        label: 'Visão',
        description: 'Ser a principal referência em soluções digitais fiscais em Angola, contribuindo para um ambiente empresarial mais saudável, competitivo e sustentável.',
        Icon: Eye,
      },
      {
        id: 'values',
        label: 'Valores',
        description: 'Princípios que orientam cada decisão, cada funcionalidade e cada relação que construímos.',
        values: ['Transparência', 'Educação', 'Inovação', 'Compromisso', 'Simplicidade'],
        Icon: HeartHandshake,
      },
    ],
  },
  en: {
    eyebrow: 'Our commitment',
    title: 'Mission, vision and values that guide Fiscalidade Digital.',
    introduction: 'A clearer, more accessible and more responsible way to bring companies and citizens closer to tax management.',
    valuesLabel: 'Fiscalidade Digital values',
    cards: [
      {
        id: 'mission',
        label: 'Mission',
        description: 'To promote tax literacy and tax compliance in Angola through an intuitive digital platform that empowers companies and citizens to manage taxes efficiently and avoid penalties.',
        Icon: Target,
      },
      {
        id: 'vision',
        label: 'Vision',
        description: 'To be the leading reference in digital tax solutions in Angola, contributing to a healthier, more competitive and more sustainable business environment.',
        Icon: Eye,
      },
      {
        id: 'values',
        label: 'Values',
        description: 'Principles that guide every decision, every feature and every relationship we build.',
        values: ['Transparency', 'Education', 'Innovation', 'Commitment', 'Simplicity'],
        Icon: HeartHandshake,
      },
    ],
  },
};

const entranceEase = [0.22, 1, 0.36, 1] as const;

export default function MissionVisionValues({ locale }: { locale: LandingLocale }) {
  const reduceMotion = useReducedMotion();
  const content = purposeContent[locale];

  return (
    <section id="missao-visao-valores" aria-labelledby="mission-vision-values-title" className="relative mt-12 overflow-hidden rounded-[28px] border border-cyan-100 bg-[#f3fafb] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/45 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative">
        <div className="grid gap-5 border-b border-cyan-950/10 pb-8 lg:grid-cols-[minmax(0,.88fr)_minmax(18rem,.62fr)] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-fd-accent">{content.eyebrow}</p>
            <h2 id="mission-vision-values-title" className="mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-fd-text sm:text-4xl">{content.title}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{content.introduction}</p>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {content.cards.map((card, index) => {
            const Icon = card.Icon;

            return (
              <motion.article
                key={card.id}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : index * 0.1, ease: entranceEase }}
                className="group relative flex min-h-[272px] flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-6 shadow-[0_16px_34px_rgba(15,41,79,.07)] transition-[box-shadow,transform] duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_20px_42px_rgba(15,41,79,.12)]"
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fd-primary via-cyan-400 to-emerald-300" />
                <motion.span
                  aria-hidden="true"
                  animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 3.2 + index * 0.25, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-fd-accent-soft text-fd-primary"
                >
                  <Icon size={21} strokeWidth={1.9} />
                </motion.span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-fd-accent">{card.label}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700 sm:text-[15px] sm:leading-7">{card.description}</p>

                {card.values && (
                  <ul aria-label={content.valuesLabel} className="mt-auto flex flex-wrap gap-2 pt-6">
                    {card.values.map((value) => (
                      <li key={value} className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-fd-primary">
                        {value}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
