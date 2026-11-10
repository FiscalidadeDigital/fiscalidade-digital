'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronRight,
  Linkedin,
  LogIn,
  Mail,
  MailCheck,
  Menu,
  UserPlus,
  X,
} from 'lucide-react';
import MissionVisionValues from '@/components/landing/MissionVisionValues';
import WhyChooseSection from '@/components/landing/WhyChooseSection';

const whatsappUrl = 'https://wa.me/244924462591';
const contactEmail = 'empresa@fiscalidadedigital.com';
const landingLocaleStorageKey = 'fd:landing-locale';

type LandingLocale = 'pt-AO' | 'en';

const nav = [
  ['Início', '#inicio'],
  ['Funcionalidades', '#funcionalidades'],
  ['Sobre nós', '#missao-visao-valores'],
  ['Contacto', '#contacto'],
] as const;

const navByLocale = {
  'pt-AO': nav,
  en: [
    ['Home', '#inicio'],
    ['Features', '#funcionalidades'],
    ['About us', '#missao-visao-valores'],
    ['Contact', '#contacto'],
  ],
} as const;

const onboardingSteps = [
  {
    title: ['Criar a conta', 'Create an account'],
    detail: ['Comece por aqui.', 'Start here.'],
    Icon: UserPlus,
  },
  {
    title: ['Confirmar o e-mail', 'Confirm your email'],
    detail: ['Confirme o e-mail que indicou.', 'Confirm the email address you provided.'],
    Icon: MailCheck,
  },
  {
    title: ['Indicar nome, NIF e situação fiscal', 'Add the company name, NIF and tax situation'],
    detail: ['Registe os dados da empresa.', 'Record the company details.'],
    Icon: Building2,
  },
  {
    title: ['Iniciar sessão', 'Log in'],
    detail: ['Entre na plataforma.', 'Access the platform.'],
    Icon: LogIn,
  },
] as const;

const partnerLogos = [
  { name: 'YAS', image: '/yas.jpg' },
  { name: 'Mabak', image: '/mabak.jpg' },
  { name: 'ENSA', image: '/Ensalogo.png' },
  { name: 'Yash Hub', image: '/yashhublogo.jpg' },
  { name: 'Rede Canais', image: '/imageslogo.jfif' },
  { name: 'Banco Nacional de Angola', image: '/Bnalogo.png' },
  { name: 'Acelera', image: '/aceleralogo.jpg' },
  { name: 'Ignition', image: '/Ignitionlogo.png' },
  { name: 'Catoca', image: '/catocalogo.png' },
  { name: 'BAI', image: '/bailogo.png' },
] as const;

const members = [
  {
    name: 'Desidério Pereira',
    area: 'Contabilidade · Fiscalidade · Estratégia',
    image: '/team-desiderio.webp',
    position: 'object-[center_20%]',
    link: 'https://www.linkedin.com/in/desiderio-pereira-4b1a492a7',
    email: 'desideriopereira@fiscalidadedigital.com',
    summary: 'Jovem angolano e finalista de Contabilidade e Finanças no ISAF, com forte interesse em IFRS, fiscalidade, empreendedorismo e inovação.',
    bio: 'Jovem angolano e finalista de Contabilidade e Finanças no Instituto Superior de Administração e Finanças — ISAF, com forte interesse em IFRS, fiscalidade, empreendedorismo e inovação. É co-fundador da Respirando Contabilidade e idealizador da Fiscalidade Digital, procurando combinar tecnologia, contabilidade e fiscalidade para desenvolver soluções mais acessíveis para empresas angolanas.',
    education: [
      'Ensino médio concluído no Instituto Médio de Economia de Luanda — IMEL',
      'Finalista de Contabilidade e Finanças no ISAF',
      'IFRS, Fiscalidade, Contabilidade, Empreendedorismo e Inovação',
    ],
    highlights: [
      'Co-fundador da Respirando Contabilidade',
      'Idealizador da Fiscalidade Digital',
      'Embaixador da KPMG Angola no ISAF',
      'Bolseiro de Mérito',
    ],
  },
  {
    name: 'Edgar Gilson da Silva António',
    area: 'Contabilidade · Fiscalidade · Análise Financeira',
    image: '/team-edgar.webp',
    position: 'object-[center_18%]',
    link: 'https://www.linkedin.com/in/edgar-ant%C3%B3nio-3a1048289',
    email: 'edgar@fiscalidadedigital.com',
    summary: 'Jovem angolano e finalista de Contabilidade e Finanças no ISAF, com interesse em Contabilidade, Fiscalidade e Análise Financeira.',
    bio: 'Jovem angolano e finalista de Contabilidade e Finanças no ISAF, com interesse em Contabilidade, Fiscalidade, Análise Financeira, Contabilidade de Custos, Contabilidade Gerencial, IFRS e Contabilidade Forense. O seu percurso combina formação académica, conhecimento técnico, liderança e inovação.',
    education: [
      'Ensino médio concluído no Instituto Médio de Economia de Luanda — IMEL',
      'Finalista de Contabilidade e Finanças no ISAF',
      'Excel Avançado, Primavera ERP, Portal do Contribuinte e Microsoft Office 365',
    ],
    highlights: [
      'Co-fundador da Respirando Contabilidade',
      'Monitor de Contabilidade Analítica',
      'Bolseiro de Mérito da Fundação BAI',
      'Investigador Científico Certificado',
    ],
  },
  {
    name: 'Francisco António',
    area: 'Contabilidade · Fiscalidade · Investigação',
    image: '/team-francisco.webp',
    position: 'object-[center_18%]',
    link: 'https://www.linkedin.com/in/francisco-ant%C3%B3nio-891555281',
    email: 'francisco@fiscalidadedigital.com',
    summary: 'Finalista de Contabilidade e Finanças no ISAF, com experiência de formação, investigação e empreendedorismo.',
    bio: 'Finalista de Contabilidade e Finanças no ISAF, Francisco contribui para a componente contabilística e fiscal da Fiscalidade Digital, com experiência de formação, investigação e empreendedorismo.',
    education: [
      'Finalista de Contabilidade e Finanças — ISAF',
      'Contabilidade e Fiscalidade — Centro de Formação Ferkund',
      'Gestão Financeira — DW e Kixicrédito',
      'Voluntariado — Fundação BAI',
    ],
    highlights: [
      'Bolseiro de Mérito BAI',
      'Co-Fundador da Respirando Contabilidade',
      'Presidente do Clube de Fiscalidade do ISAF',
      'Investigador pelo Programa de Iniciação Científica do ISAF',
    ],
  },
  {
    name: 'Anildo Manuel João',
    area: 'Tecnologia · Desenvolvimento · Automação',
    image: '/team-anildo.webp',
    position: 'object-[center_15%]',
    link: 'https://www.linkedin.com/in/anildo-jo%C3%A3o-85643330b',
    email: 'anildomanuel@fiscalidadedigital.com',
    summary: 'Profissional angolano de tecnologia, estudante de Engenharia Informática e Comunicação e desenvolvedor Full Stack.',
    bio: 'Profissional angolano de tecnologia, estudante de Engenharia Informática e Comunicação, desenvolvedor Full Stack e técnico com formação nas áreas de Automação Industrial, Instrumentação e Controlo. O seu percurso está na intersecção entre software, sistemas, infraestrutura tecnológica e tecnologia industrial.',
    education: [
      'Técnico Médio de Informática de Gestão pelo Instituto Médio de Economia de Luanda — IMEL',
      'Engenharia Informática e Comunicação — Universidade Óscar Ribas',
      'Full Stack, APIs, Bases de Dados, Redes, IoT, Inteligência Artificial e Gestão de Projectos',
    ],
    highlights: [
      'Desenvolvimento tecnológico da Fiscalidade Digital',
      'CEO e Fundador da Yash Hub5',
      'Software + Automação Industrial + Instrumentação + Control Systems',
    ],
  },
] as const;

const englishMemberContent = [
  {
    area: 'Accounting · Tax · Strategy',
    summary: 'Angolan and a final-year Accounting and Finance student at ISAF, with a strong interest in IFRS, taxation, entrepreneurship and innovation.',
    bio: 'Angolan and a final-year Accounting and Finance student at the Instituto Superior de Administração e Finanças — ISAF, with a strong interest in IFRS, taxation, entrepreneurship and innovation. He is co-founder of Respirando Contabilidade and the creator of Fiscalidade Digital, seeking to combine technology, accounting and taxation to develop more accessible solutions for Angolan companies.',
    education: ['Secondary education completed at Instituto Médio de Economia de Luanda — IMEL', 'Final-year Accounting and Finance student at ISAF', 'IFRS, Taxation, Accounting, Entrepreneurship and Innovation'],
    highlights: ['Co-founder of Respirando Contabilidade', 'Creator of Fiscalidade Digital', 'KPMG Angola ambassador at ISAF', 'Merit scholarship holder'],
  },
  {
    area: 'Accounting · Tax · Financial Analysis',
    summary: 'Angolan and a final-year Accounting and Finance student at ISAF, interested in Accounting, Taxation and Financial Analysis.',
    bio: 'Angolan and a final-year Accounting and Finance student at ISAF, interested in Accounting, Taxation, Financial Analysis, Cost Accounting, Management Accounting, IFRS and Forensic Accounting. His path combines academic training, technical knowledge, leadership and innovation.',
    education: ['Secondary education completed at Instituto Médio de Economia de Luanda — IMEL', 'Final-year Accounting and Finance student at ISAF', 'Advanced Excel, Primavera ERP, Taxpayer Portal and Microsoft Office 365'],
    highlights: ['Co-founder of Respirando Contabilidade', 'Analytical Accounting monitor', 'Fundação BAI merit scholarship holder', 'Certified scientific researcher'],
  },
  {
    area: 'Accounting · Tax · Research',
    summary: 'Final-year Accounting and Finance student at ISAF, with experience in education, research and entrepreneurship.',
    bio: 'A final-year Accounting and Finance student at ISAF, Francisco contributes to the accounting and tax side of Fiscalidade Digital, with experience in education, research and entrepreneurship.',
    education: ['Final-year Accounting and Finance student — ISAF', 'Accounting and Taxation — Centro de Formação Ferkund', 'Financial Management — DW and Kixicrédito', 'Volunteering — Fundação BAI'],
    highlights: ['BAI merit scholarship holder', 'Co-founder of Respirando Contabilidade', 'President of ISAF’s Tax Club', 'Researcher in ISAF’s Scientific Initiation Programme'],
  },
  {
    area: 'Technology · Development · Automation',
    summary: 'Angolan technology professional, Computer Engineering and Communications student, and Full Stack developer.',
    bio: 'Angolan technology professional, Computer Engineering and Communications student, Full Stack developer and technician trained in Industrial Automation, Instrumentation and Control. His work sits at the intersection of software, systems, technology infrastructure and industrial technology.',
    education: ['IT Management technician from Instituto Médio de Economia de Luanda — IMEL', 'Computer Engineering and Communications — Universidade Óscar Ribas', 'Full Stack, APIs, Databases, Networks, IoT, Artificial Intelligence and Project Management'],
    highlights: ['Fiscalidade Digital technology development', 'CEO and founder of Yash Hub5', 'Software + Industrial Automation + Instrumentation + Control Systems'],
  },
] as const;

const membersByLocale = {
  'pt-AO': members,
  en: members.map((member, index) => ({ ...member, ...englishMemberContent[index] })),
} as const;

function tr(locale: LandingLocale, pt: string, en: string) {
  return locale === 'en' ? en : pt;
}

function LanguageSelector({ locale, onChange, mobile = false }: { locale: LandingLocale; onChange: (locale: LandingLocale) => void; mobile?: boolean }) {
  return (
    <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-fd-text shadow-sm ${mobile ? 'w-full justify-between px-3 py-2.5 text-sm' : ''}`}>
      <span className={mobile ? '' : 'sr-only'}>{tr(locale, 'Idioma', 'Language')}</span>
      <select
        aria-label={tr(locale, 'Selecionar idioma', 'Select language')}
        value={locale}
        onChange={(event) => onChange(event.target.value === 'en' ? 'en' : 'pt-AO')}
        className="min-w-0 bg-transparent font-bold text-fd-text outline-none"
      >
        <option value="pt-AO">{mobile ? 'Português (Angola)' : 'PT'}</option>
        <option value="en">{mobile ? 'English' : 'EN'}</option>
      </select>
    </label>
  );
}

function Brand({ locale }: { locale: LandingLocale }) {
  return (
    <Link href="/" aria-label={tr(locale, 'Fiscalidade Digital — início', 'Fiscalidade Digital — home')} className="inline-flex shrink-0 rounded-lg bg-white p-1.5 shadow-sm">
      <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={2172} height={724} className="h-10 w-auto object-contain sm:h-11" priority />
    </Link>
  );
}

function Mockup({ locale }: { locale: LandingLocale }) {
  return (
    <div className="mx-auto max-w-[660px] border border-slate-200 bg-white text-left">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-fd-accent motion-safe:animate-pulse motion-reduce:animate-none" />
        <p className="text-sm font-bold text-fd-text">Fiscalidade Digital</p>
      </div>
      <div className="grid sm:grid-cols-[10rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-slate-50 p-4 sm:block">
          <p className="text-xs font-medium text-slate-500">{tr(locale, 'Área da empresa', 'Company area')}</p>
          <nav aria-label={tr(locale, 'Navegação de demonstração', 'Demonstration navigation')} className="mt-5 grid gap-3 text-sm text-slate-700">
            <span className="font-semibold text-fd-primary">{tr(locale, 'Resumo', 'Overview')}</span>
            <span>{tr(locale, 'Obrigações', 'Obligations')}</span>
            <span>{tr(locale, 'Facturas', 'Invoices')}</span>
            <span>{tr(locale, 'Documentos', 'Documents')}</span>
          </nav>
        </aside>
        <div className="p-5 sm:p-6">
          <div className="border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-medium text-fd-accent">{tr(locale, 'Resumo fiscal', 'Tax summary')}</p>
              <p className="mt-1 text-lg font-bold text-fd-text">{tr(locale, 'Informação da empresa', 'Company information')}</p>
            </div>
          </div>
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-slate-600">{tr(locale, 'Obrigações', 'Obligations')}</dt>
              <dd className="font-semibold text-fd-text">{tr(locale, 'Consultar calendário', 'Check calendar')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-slate-600">{tr(locale, 'Facturas', 'Invoices')}</dt>
              <dd className="font-semibold text-fd-text">{tr(locale, 'Registos organizados', 'Organised records')}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-slate-600">{tr(locale, 'Documentos', 'Documents')}</dt>
              <dd className="font-semibold text-fd-text">{tr(locale, 'Ficheiros da empresa', 'Company files')}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function PartnerMarquee({ locale }: { locale: LandingLocale }) {
  return (
    <section className="partners-section" aria-labelledby="partners-title">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p id="partners-title" className="partners-title text-xs font-bold uppercase text-slate-500">{tr(locale, 'Parceiros e ecossistema', 'Partners and ecosystem')}</p>
      </div>
      <div className="partners-window">
        <div className="partners-track">
          {[0, 1].map((groupIndex) => (
            <div className="partners-group" key={`partner-group-${groupIndex}`} aria-hidden={groupIndex === 1}>
              {partnerLogos.map((partner) => (
                <div className="partner-item" key={`${groupIndex}-${partner.name}`} title={partner.name}>
                  <Image src={partner.image} alt={groupIndex === 0 ? partner.name : ''} width={142} height={66} sizes="142px" loading={groupIndex === 0 ? 'eager' : 'lazy'} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useState<LandingLocale>('pt-AO');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const pageRef = useRef<HTMLElement>(null);
  const selectLocale = useCallback((nextLocale: LandingLocale) => {
    setLocale(nextLocale);
    try {
      window.localStorage.setItem(landingLocaleStorageKey, nextLocale);
    } catch {
      // The landing remains usable when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      const savedLocale = window.localStorage.getItem(landingLocaleStorageKey);
      if (savedLocale === 'en' || savedLocale === 'pt-AO') setLocale(savedLocale);
    } catch {
      // Portuguese (Angola) remains the default when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const howPath = page.querySelector<HTMLElement>('[data-how-path]');
    const pathSteps = Array.from(howPath?.querySelectorAll<HTMLElement>('[data-how-step]') ?? []);
    if (!howPath || !pathSteps.length) return;

    const updateHowPath = () => {
      const bounds = howPath.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.78 - bounds.top) / Math.max(bounds.height + window.innerHeight * 0.35, 1)));
      howPath.style.setProperty('--how-path-progress', progress.toFixed(3));
      howPath.classList.toggle('is-path-active', progress > 0.01);

      pathSteps.forEach((step, index) => {
        const threshold = 0.08 + (index / Math.max(pathSteps.length - 1, 1)) * 0.82;
        step.classList.toggle('is-path-reached', progress >= threshold);
      });
    };

    let frame = 0;
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        updateHowPath();
        frame = 0;
      });
    };

    page.dataset.motion = 'ready';
    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      delete page.dataset.motion;
    };
  }, []);

  return (
    <main ref={pageRef} lang={locale} className="site min-h-screen overflow-x-hidden bg-white text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand locale={locale} />
          <nav aria-label={tr(locale, 'Navegação principal', 'Main navigation')} className="hidden gap-5 xl:flex">
            {navByLocale[locale].map(([name, href]) => <a key={href} href={href} className="text-sm font-bold text-slate-600 transition-colors hover:text-fd-accent">{name}</a>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <LanguageSelector locale={locale} onChange={selectLocale} />
            <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-bold text-fd-text transition-colors hover:text-fd-accent">{tr(locale, 'Entrar', 'Log in')}</Link>
            <Link href="/register" className="inline-flex min-h-11 items-center rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-fd-primary-hover">{tr(locale, 'Criar conta', 'Create account')}</Link>
          </div>
          <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 xl:hidden" aria-label={menuOpen ? tr(locale, 'Fechar menu', 'Close menu') : tr(locale, 'Abrir menu', 'Open menu')} aria-controls="menu-principal-mobile" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav id="menu-principal-mobile" aria-label={tr(locale, 'Navegação principal móvel', 'Main mobile navigation')} className="border-t border-slate-100 bg-white px-5 py-4 xl:hidden">
            <LanguageSelector locale={locale} onChange={selectLocale} mobile />
            <div className="mt-3">
            {navByLocale[locale].map(([name, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center border-b border-slate-100 py-3 text-sm font-bold text-fd-text transition-colors hover:text-fd-accent">{name}</a>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-fd-text">{tr(locale, 'Entrar', 'Log in')}</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-fd-primary px-4 py-3 text-sm font-bold text-white">{tr(locale, 'Criar conta', 'Create account')}</Link>
            </div>
          </nav>
        )}
      </header>

      <section id="inicio" className="border-b border-slate-200 bg-[var(--fd-surface-muted)] py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-medium text-fd-accent">Fiscalidade Digital</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-normal text-fd-text sm:text-5xl xl:text-[3.35rem]">{locale === 'en' ? <>Tax deadlines under control.<br /><span className="text-fd-accent">An organised company.</span></> : <>Prazos fiscais sob controlo.<br /><span className="text-fd-accent">Empresa organizada.</span></>}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{tr(locale, 'Acompanhe obrigações, facturas, salários e documentos numa plataforma feita para empresas em Angola.', 'Follow obligations, invoices, payroll and documents in a platform made for companies in Angola.')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-fd-primary px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-fd-primary-hover">{tr(locale, 'Criar conta', 'Create account')} <ArrowRight size={17} /></Link>
              <a href="#funcionalidades" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-fd-text transition-colors hover:border-fd-accent hover:text-fd-primary">{tr(locale, 'Conhecer a plataforma', 'Explore the platform')} <ChevronRight size={17} /></a>
            </div>
            <p className="mt-7 max-w-xl border-l-2 border-fd-accent pl-4 text-sm leading-6 text-slate-600">{tr(locale, 'Organize os registos da empresa e consulte a informação quando precisar.', 'Organise company records and review information when you need it.')}</p>
          </div>
          <Mockup locale={locale} />
        </div>
      </section>

      <PartnerMarquee locale={locale} />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <Title eyebrow={tr(locale, 'Sobre a Fiscalidade Digital', 'About Fiscalidade Digital')}>{locale === 'en' ? <>Information to follow<br />your <span className="text-fd-accent">company.</span></> : <>Informação para<br />acompanhar a <span className="text-fd-accent">empresa.</span></>}</Title>
            <div className="max-w-2xl space-y-5 self-center text-base leading-7 text-slate-600">
              <p>{tr(locale, 'Reúna facturação, obrigações e dados administrativos num ambiente de trabalho claro.', 'Bring invoicing, obligations and administrative data together in a clear workspace.')}</p>
              <p className="border-l-2 border-fd-accent pl-4 font-semibold text-fd-text">{tr(locale, 'Consulte a informação por área e mantenha os registos organizados.', 'Review information by area and keep records organised.')}</p>
            </div>
          </div>
          <MissionVisionValues locale={locale} />
        </div>
      </section>

      <WhyChooseSection locale={locale} />

      <section id="como-funciona" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Title eyebrow={tr(locale, 'Como funciona', 'How it works')}>{tr(locale, 'Comece pela conta e pelas informações da empresa.', 'Start with the account and your company information.')}</Title>
          <div className="how-path mt-10" data-how-path>
            <div aria-hidden="true" className="how-path-line"><span /></div>
            <ol className="how-path-steps">
              {onboardingSteps.map(({ title, detail, Icon }) => {
                const copyIndex = locale === 'en' ? 1 : 0;
                return (
                  <li
                    key={title[0]}
                    data-how-step
                    className="how-path-step"
                  >
                    <span aria-hidden="true" className="how-path-node"><Icon size={18} /></span>
                    <div className="how-path-copy">
                      <p className="text-base font-bold leading-6 text-fd-text">{title[copyIndex]}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{detail[copyIndex]}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      <section id="perguntas" aria-labelledby="perguntas-title" className="border-y border-slate-100 bg-[#f7fafc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div>
            <p className="text-sm font-medium text-fd-accent">{tr(locale, 'Perguntas frequentes', 'Frequently asked questions')}</p>
            <h2 id="perguntas-title" className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-fd-text sm:text-4xl">{tr(locale, 'Antes de começar, esclareça o essencial.', 'Clarify the essentials before you start.')}</h2>
          </div>
          <dl className="mt-10 grid gap-x-10 gap-y-7 md:grid-cols-2">
            {[
              [tr(locale, 'Para quem é a Fiscalidade Digital?', 'Who is Fiscalidade Digital for?'), tr(locale, 'Para empresas em Angola que querem acompanhar prazos e obrigações fiscais e ter facturas, salários e documentos organizados num só sítio.', 'For companies in Angola that want to follow tax deadlines and obligations while keeping invoices, payroll and documents organised in one place.')],
              [tr(locale, 'O que posso acompanhar na plataforma?', 'What can I follow on the platform?'), tr(locale, 'Na parte fiscal: obrigações, prazos, alertas na plataforma e pagamentos registados. Na operação: facturas, facturas recebidas, clientes, fornecedores, produtos, funcionários, folha salarial, documentos e relatórios, conforme a informação registada.', 'On the tax side: obligations, deadlines, platform alerts and recorded payments. In operations: invoices, received invoices, clients, suppliers, products, employees, payroll, documents and reports, according to the information recorded.')],
              [tr(locale, 'Como começo?', 'How do I get started?'), tr(locale, 'Crie a conta, confirme o e-mail, indique o nome e NIF da empresa e a situação fiscal conhecida. Depois, inicie sessão para aceder à plataforma.', 'Create an account, confirm your email, provide the company name, NIF and known tax situation. Then log in to access the platform.')],
              [tr(locale, 'Posso pagar impostos pela plataforma?', 'Can I pay taxes through the platform?'), tr(locale, 'Não. A plataforma ajuda a organizar obrigações e a consultar pagamentos registados, mas não executa pagamentos junto de bancos ou autoridades.', 'No. The platform helps organise obligations and consult recorded payments, but it does not execute payments with banks or authorities.')],
              [tr(locale, 'A minha equipa pode ter acesso?', 'Can my team have access?'), tr(locale, 'Sim. Pode dar acesso a outros utilizadores da empresa e definir o que cada um pode fazer na plataforma.', 'Yes. You can give access to other company users and define what each person can do on the platform.')],
            ].map(([question, answer], index) => (
              <div key={question} className={`border-t border-slate-300 ${index === 4 ? 'md:col-span-2' : ''}`}>
                <dt>
                  <button
                    type="button"
                    aria-expanded={openFaq === index}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenFaq((open) => open === index ? null : index)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-bold text-fd-text transition-colors hover:text-fd-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
                  >
                    <span>{question}</span>
                    <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                </dt>
                {openFaq === index && <dd id={`faq-answer-${index}`} className="-mt-1 max-w-3xl pb-5 text-sm leading-6 text-slate-600">{answer}</dd>}
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Team locale={locale} />

      <section id="contacto" className="bg-fd-primary py-12 text-white sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,.7fr)] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-medium text-cyan-200">{tr(locale, 'Contacto', 'Contact')}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{tr(locale, 'Tem dúvidas antes de começar?', 'Have questions before getting started?')}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">{tr(locale, 'Fale connosco no WhatsApp ou por e-mail. Se já decidiu, crie a conta.', 'Talk to us on WhatsApp or by email. If you have decided, create an account.')}</p>
          </div>
          <div className="border-y border-white/20">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={tr(locale, 'Falar no WhatsApp da Fiscalidade Digital', 'Talk to Fiscalidade Digital on WhatsApp')} className="block min-h-[104px] border-b border-white/20 py-5 transition-colors hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">
              <span className="block text-sm font-medium text-cyan-200">WhatsApp</span>
              <span className="mt-2 block text-base font-bold text-white">{tr(locale, 'Falar com a equipa', 'Talk to the team')}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-300">{tr(locale, 'Uma conversa directa para conhecer melhor a sua necessidade.', 'A direct conversation to better understand your needs.')}</span>
            </a>
            <a href={`mailto:${contactEmail}`} className="block min-h-[104px] py-5 transition-colors hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">
              <span className="block text-sm font-medium text-cyan-200">{tr(locale, 'E-mail', 'Email')}</span>
              <span className="mt-2 block break-all text-base font-bold text-white">{contactEmail}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-300">{tr(locale, 'Use este canal para nos enviar o contexto da sua empresa.', 'Use this channel to send us your company context.')}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="bg-fd-primary py-11 text-white sm:py-14">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 lg:flex-row lg:items-end lg:px-8">
          <div><p className="text-sm font-medium text-cyan-200">Fiscalidade Digital</p><h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">{tr(locale, 'Crie a conta e registe a sua empresa.', 'Create an account and register your company.')}</h2></div>
          <div className="flex flex-wrap items-center gap-3"><Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cyan-300 px-5 py-3.5 text-center text-sm font-semibold text-fd-text transition-colors hover:bg-cyan-200">{tr(locale, 'Criar conta', 'Create account')}</Link><a href="#funcionalidades" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/35 px-5 py-3.5 text-center text-sm font-semibold transition-colors hover:bg-white/10">{tr(locale, 'Conhecer a plataforma', 'Explore the platform')}</a><Link href="/login" className="inline-flex min-h-11 items-center px-1 py-2 text-sm font-semibold text-cyan-100 underline underline-offset-4 transition hover:text-white">{tr(locale, 'Já tenho conta', 'I already have an account')}</Link></div>
        </div>
      </section>

      <footer className="bg-[#061a36] text-slate-300">
        <div className="mx-auto max-w-7xl px-5 py-10 pb-20 sm:pb-10 lg:px-8">
          <div className="grid gap-8 border-b border-white/15 pb-9 sm:grid-cols-2 lg:grid-cols-5">
            <div><Brand locale={locale} /><p className="mt-4 text-sm leading-6 text-slate-400">{tr(locale, 'Gestão fiscal e empresarial para empresas em Angola.', 'Tax and business management for companies in Angola.')}</p></div>
            <Footer title={tr(locale, 'Plataforma', 'Platform')} links={locale === 'en' ? [['Features', '#funcionalidades'], ['How it works', '#como-funciona']] : [['Funcionalidades', '#funcionalidades'], ['Como funciona', '#como-funciona']]} />
            <div>
              <p className="text-sm font-medium text-slate-400">{tr(locale, 'Empresa', 'Company')}</p>
              <div className="mt-4 grid gap-3 text-sm">
                <a href="#equipa" className="inline-flex min-h-[40px] items-center transition hover:text-cyan-200">{tr(locale, 'Equipa', 'Team')}</a>
                <a href="#contacto" className="inline-flex min-h-[40px] items-center transition hover:text-cyan-200">{tr(locale, 'Contacto', 'Contact')}</a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 w-fit items-center rounded-lg bg-[#25D366] px-3 py-2 font-semibold text-[#06351b] transition-colors hover:bg-[#53e589] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">{tr(locale, 'Falar no WhatsApp', 'Talk on WhatsApp')}</a>
              </div>
            </div>
            <Footer title={tr(locale, 'Conta', 'Account')} links={locale === 'en' ? [['Log in', '/login'], ['Create account', '/register'], [contactEmail, `mailto:${contactEmail}`]] : [['Entrar', '/login'], ['Criar conta', '/register'], [contactEmail, `mailto:${contactEmail}`]]} />
            <Footer title={tr(locale, 'Legal', 'Legal')} links={locale === 'en' ? [['Terms of Use (Portuguese)', '/terms'], ['Privacy Policy (Portuguese)', '/privacy']] : [['Termos de Utilização', '/terms'], ['Política de Privacidade', '/privacy']]} />
          </div>
          <p className="pt-6 text-xs text-slate-300">© {new Date().getFullYear()} Fiscalidade Digital · Angola</p>
        </div>
      </footer>

      <Link
        href="/register"
        className="fixed bottom-4 right-4 z-40 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-fd-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(15,41,79,.18)] transition-colors hover:bg-fd-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 sm:hidden"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        {tr(locale, 'Criar conta', 'Create account')}
      </Link>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tr(locale, 'Falar no WhatsApp da Fiscalidade Digital', 'Talk to Fiscalidade Digital on WhatsApp')}
        className="whatsapp-fab fixed z-40 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-[#06351b] shadow-[0_8px_18px_rgba(15,41,79,.18)] transition-colors hover:bg-[#53e589] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
        style={{
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        {tr(locale, 'WhatsApp', 'WhatsApp')}
      </a>
    </main>
  );
}

function Title({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return <div><p className="text-sm font-medium text-fd-accent">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold leading-tight text-fd-text sm:text-4xl">{children}</h2></div>;
}

type TeamMember = {
  name: string;
  area: string;
  image: string;
  position: string;
  link: string;
  email: string;
  summary: string;
  bio: string;
  education: readonly string[];
  highlights: readonly string[];
};

function Team({ locale }: { locale: LandingLocale }) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);
  const teamMembers = membersByLocale[locale] as readonly TeamMember[];

  const closeBiography = useCallback(() => {
    setSelectedMember(null);
    window.requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!selectedMember) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeBiography();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedMember, closeBiography]);

  return (
    <section id="equipa" aria-label={tr(locale, 'Equipa', 'Team')} className="bg-[#f7fafc] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-fd-accent">{tr(locale, 'Equipa', 'Team')}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-fd-text sm:text-4xl">{tr(locale, 'A equipa por trás da Fiscalidade Digital', 'The team behind Fiscalidade Digital')}</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member) => (
            <figure key={member.name} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="relative aspect-[4/5] bg-slate-100">
                <Image src={member.image} alt={tr(locale, `Fotografia de ${member.name}`, `Portrait of ${member.name}`)} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className={`object-contain ${member.position}`} />
              </div>
              <figcaption className="p-5">
                <p className="text-lg font-bold text-fd-text">{member.name}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-fd-primary">{member.area}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{member.summary}</p>
                <a href={`mailto:${member.email}`} className="mt-4 block min-h-10 border-t border-slate-200 pt-3 text-xs font-semibold text-fd-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">{member.email}</a>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      lastTriggerRef.current = event.currentTarget;
                      setSelectedMember(member);
                    }}
                    className="inline-flex min-h-11 items-center rounded-lg bg-fd-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-fd-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
                  >
                    {tr(locale, 'Ver biografia', 'View biography')}
                  </button>
                  <a href={member.link} target="_blank" rel="noopener noreferrer" aria-label={tr(locale, `Abrir LinkedIn de ${member.name}`, `Open ${member.name}'s LinkedIn`)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-fd-accent transition-colors hover:border-fd-accent hover:bg-fd-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"><Linkedin size={18} /></a>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[70] flex items-end bg-slate-950/55 p-0 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) closeBiography(); }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="team-biography-title" aria-describedby="team-biography-summary" tabIndex={-1} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <p className="text-sm font-bold text-fd-text">{tr(locale, 'Equipa Fiscalidade Digital', 'Fiscalidade Digital team')}</p>
              <button ref={closeButtonRef} type="button" onClick={closeBiography} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-fd-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700" aria-label={tr(locale, 'Fechar biografia', 'Close biography')}><X size={20} /></button>
            </div>
            <div className="grid gap-7 p-5 sm:grid-cols-[180px_1fr] sm:p-7">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[180px] overflow-hidden rounded-lg bg-slate-100 sm:mx-0">
                <Image src={selectedMember.image} alt={tr(locale, `Fotografia de ${selectedMember.name}`, `Portrait of ${selectedMember.name}`)} fill sizes="180px" className={`object-contain ${selectedMember.position}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-fd-accent">{selectedMember.area}</p>
                <h3 id="team-biography-title" className="mt-3 text-3xl font-bold tracking-normal text-fd-text">{selectedMember.name}</h3>
                <p id="team-biography-summary" className="mt-4 text-base leading-7 text-slate-600">{selectedMember.bio}</p>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <section aria-labelledby="team-education-title">
                    <h4 id="team-education-title" className="text-sm font-bold text-fd-text">{tr(locale, 'Formação e competências', 'Education and skills')}</h4>
                    <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">{selectedMember.education.map((item) => <li key={item} className="border-l-2 border-slate-200 pl-3">{item}</li>)}</ul>
                  </section>
                  <section aria-labelledby="team-highlights-title">
                    <h4 id="team-highlights-title" className="text-sm font-bold text-fd-text">{tr(locale, 'Destaques', 'Highlights')}</h4>
                    <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">{selectedMember.highlights.map((item) => <li key={item} className="border-l-2 border-slate-200 pl-3">{item}</li>)}</ul>
                  </section>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <a href={`mailto:${selectedMember.email}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-fd-accent-soft px-4 py-2 text-sm font-bold text-fd-primary transition hover:bg-fd-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"><Mail size={17} />{selectedMember.email}</a>
                  <a href={selectedMember.link} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-fd-accent-soft px-4 py-2 text-sm font-bold text-fd-primary transition hover:bg-fd-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"><Linkedin size={17} />{tr(locale, 'Ver LinkedIn', 'View LinkedIn')}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Footer({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div><p className="text-sm font-medium text-slate-400">{title}</p><div className="mt-4 grid gap-3 text-sm">{links.map(([name, href]) => href.startsWith('/') ? <Link key={href} href={href} className="inline-flex min-h-11 items-center transition hover:text-cyan-200">{name}</Link> : <a key={href} href={href} target={href === whatsappUrl ? '_blank' : undefined} rel={href === whatsappUrl ? 'noopener noreferrer' : undefined} className={`inline-flex min-h-11 items-center transition hover:text-cyan-200 ${href.startsWith('mailto:') ? 'normal-case' : ''}`}>{name}</a>)}</div></div>;
}
