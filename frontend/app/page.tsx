'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Linkedin,
  Mail,
  Menu,
  X,
} from 'lucide-react';
import WhyChooseSection from '@/components/landing/WhyChooseSection';

const whatsappUrl = 'https://wa.me/244924462591';
const contactEmail = 'fiscalidadedigital@empresa.ao';
const landingLocaleStorageKey = 'fd:landing-locale';

type LandingLocale = 'pt-AO' | 'en';

const nav = [
  ['Início', '#inicio'],
  ['Funcionalidades', '#funcionalidades'],
  ['Sobre nós', '#sobre'],
  ['Contacto', '#contacto'],
] as const;

const navByLocale = {
  'pt-AO': nav,
  en: [
    ['Home', '#inicio'],
    ['Features', '#funcionalidades'],
    ['About us', '#sobre'],
    ['Contact', '#contacto'],
  ],
} as const;

const ecosystemPartners = [
  { name: 'YAS', image: '/yas.jpg', width: 1080, height: 1080, imageClassName: 'h-20 w-20 object-contain sm:h-24 sm:w-24' },
  { name: 'Yash Hub', image: '/yashhublogo.jpg', width: 1080, height: 1080, imageClassName: 'h-20 w-20 object-contain sm:h-24 sm:w-24' },
  { name: 'Acelera Angola', image: '/aceleralogo.jpg', width: 1181, height: 1181, imageClassName: 'h-20 w-20 object-contain sm:h-24 sm:w-24' },
  { name: 'Ignition Angola', image: '/Ignitionlogo.png', width: 300, height: 78, imageClassName: 'h-12 w-40 object-contain sm:h-14 sm:w-44' },
] as const;

const members = [
  {
    name: 'Desidério Pereira',
    area: 'Contabilidade · Fiscalidade · Estratégia',
    image: '/Desiderio.jpeg',
    position: 'object-[center_20%]',
    link: 'https://www.linkedin.com/in/desiderio-pereira-4b1a492a7',
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
    image: '/edgar.jpg',
    position: 'object-[center_18%]',
    link: 'https://www.linkedin.com/in/edgar-ant%C3%B3nio-3a1048289',
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
    image: '/Francisco.jpeg',
    position: 'object-[center_18%]',
    link: 'https://www.linkedin.com/in/francisco-ant%C3%B3nio-891555281',
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
    image: '/Anildodev.jpg',
    position: 'object-[center_15%]',
    link: 'https://www.linkedin.com/in/anildo-jo%C3%A3o-85643330b',
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
    <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-[#102447] shadow-sm ${mobile ? 'w-full justify-between px-3 py-2.5 text-sm' : ''}`}>
      <span className={mobile ? '' : 'sr-only'}>{tr(locale, 'Idioma da landing', 'Landing page language')}</span>
      <select
        aria-label={tr(locale, 'Idioma da landing', 'Landing page language')}
        value={locale}
        onChange={(event) => onChange(event.target.value === 'en' ? 'en' : 'pt-AO')}
        className="min-w-0 bg-transparent font-bold text-[#102447] outline-none"
      >
        <option value="pt-AO">{mobile ? 'Português (Angola)' : 'PT'}</option>
        <option value="en">{mobile ? 'English' : 'EN'}</option>
      </select>
    </label>
  );
}

function Brand({ locale }: { locale: LandingLocale }) {
  return (
    <Link href="/" aria-label={tr(locale, 'Fiscalidade Digital — início', 'Fiscalidade Digital — home')} className="inline-flex rounded-lg bg-white p-1.5 shadow-sm">
      <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={256} height={85} className="h-11 w-auto object-contain sm:h-12" priority />
    </Link>
  );
}

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        fill="currentColor"
        d="M19.2 4.77A9.59 9.59 0 0 0 12.42 2C7.14 2 2.86 6.28 2.86 11.56c0 1.69.44 3.34 1.27 4.79L2.78 22l5.81-1.32a9.5 9.5 0 0 0 3.82.8h.01c5.27 0 9.56-4.28 9.56-9.56a9.49 9.49 0 0 0-2.78-6.75Zm-6.78 15.1a7.88 7.88 0 0 1-3.57-.86l-.26-.12-3.45.79.74-3.36-.14-.27a7.9 7.9 0 0 1-1.22-4.2c0-4.36 3.55-7.91 7.92-7.91a7.86 7.86 0 0 1 5.6 2.31 7.88 7.88 0 0 1 2.31 5.61c0 4.36-3.55 7.91-7.91 7.91Zm4.34-5.92c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.23-.62.77-.76.93-.14.16-.28.18-.52.06a6.39 6.39 0 0 1-1.93-1.19 7.2 7.2 0 0 1-1.33-1.65c-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.59 4.11 3.63.57.25 1.02.4 1.37.52.58.18 1.1.15 1.52.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}

function Mockup({ locale }: { locale: LandingLocale }) {
  return (
    <div className="hero-mockup relative mx-auto max-w-[470px]">
      <div className="absolute -left-6 bottom-8 hidden w-44 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_18px_35px_rgba(15,41,79,.11)] sm:block">
        <p className="text-xs font-bold text-[#102447]">{tr(locale, 'Obrigações', 'Obligations')}</p>
        <p className="mt-1 text-[11px] text-slate-500">{tr(locale, 'Prazos organizados', 'Organised deadlines')}</p>
      </div>
      <div className="absolute -right-5 top-8 hidden w-44 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_18px_35px_rgba(15,41,79,.11)] sm:block">
        <p className="text-xs font-bold text-[#102447]">{tr(locale, 'Impostos', 'Taxes')}</p>
        <p className="mt-1 text-[11px] text-slate-500">{tr(locale, 'Fiscalidade num só lugar', 'Tax management in one place')}</p>
      </div>
      <div className="rounded-[28px] border border-white bg-white p-5 shadow-[0_30px_70px_rgba(15,41,79,.16)]">
        <div className="flex gap-1.5">
          <i className="h-2 w-2 rounded-full bg-cyan-400" />
          <i className="h-2 w-2 rounded-full bg-slate-200" />
          <i className="h-2 w-2 rounded-full bg-slate-200" />
        </div>
        <div className="mt-12 rounded-2xl bg-[#f2f9fb] p-5">
          <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-cyan-700">
            <FileText size={13} /> {tr(locale, 'Gestão fiscal', 'Tax management')}
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-[#102447]">
            {locale === 'en' ? <>Simplify your<br />company’s tax<br />management.</> : <>Simplifique<br />a gestão da<br />sua empresa.</>}
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
          <span className="rounded-xl bg-cyan-50 px-2 py-3 text-cyan-800">{tr(locale, 'Impostos', 'Taxes')}</span>
          <span className="rounded-xl bg-slate-50 px-2 py-3 text-[#102447]">{tr(locale, 'Obrigações', 'Obligations')}</span>
          <span className="rounded-xl bg-slate-50 px-2 py-3 text-[#102447]">{tr(locale, 'Folha salarial', 'Payroll')}</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useState<LandingLocale>('pt-AO');
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
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    const elements = Array.from(page.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!elements.length) return;

    const revealInViewport = () => {
      elements.forEach((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 1.15 && bounds.bottom > -64) element.classList.add('is-visible');
      });
    };

    let observer: IntersectionObserver | null = null;
    let initialFrame = 0;
    try {
      page.dataset.motion = 'ready';
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer?.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8%', threshold: 0.12 },
      );
      elements.forEach((element) => observer?.observe(element));
      initialFrame = window.requestAnimationFrame(revealInViewport);
      window.addEventListener('scroll', revealInViewport, { passive: true });
    } catch {
      delete page.dataset.motion;
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener('scroll', revealInViewport);
      observer?.disconnect();
      delete page.dataset.motion;
    };
  }, []);

  return (
    <main ref={pageRef} lang={locale} className="site min-h-screen overflow-x-hidden bg-white text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand locale={locale} />
          <nav aria-label={tr(locale, 'Navegação principal', 'Main navigation')} className="hidden gap-5 xl:flex">
            {navByLocale[locale].map(([name, href]) => <a key={href} href={href} className="text-sm font-bold text-slate-600 transition-colors hover:text-cyan-700">{name}</a>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <LanguageSelector locale={locale} onChange={selectLocale} />
            <Link href="/login" className="text-sm font-bold text-[#102447] transition-colors hover:text-cyan-700">{tr(locale, 'Entrar', 'Log in')}</Link>
            <Link href="/register" className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-600">{tr(locale, 'Criar conta', 'Create account')}</Link>
          </div>
          <button type="button" className="rounded-lg p-2 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 xl:hidden" aria-label={menuOpen ? tr(locale, 'Fechar menu', 'Close menu') : tr(locale, 'Abrir menu', 'Open menu')} aria-controls="menu-principal-mobile" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav id="menu-principal-mobile" aria-label={tr(locale, 'Navegação principal móvel', 'Main mobile navigation')} className="border-t border-slate-100 bg-white px-5 py-4 xl:hidden">
            <LanguageSelector locale={locale} onChange={selectLocale} mobile />
            <div className="mt-3">
            {navByLocale[locale].map(([name, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block border-b border-slate-100 py-3 text-sm font-bold text-[#102447] transition-colors hover:text-cyan-700">{name}</a>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-[#102447]">{tr(locale, 'Entrar', 'Log in')}</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-white">{tr(locale, 'Criar conta', 'Create account')}</Link>
            </div>
          </nav>
        )}
      </header>

      <section id="inicio" className="relative overflow-hidden bg-white py-16 sm:py-20">
        <svg aria-hidden="true" className="absolute right-0 top-0 h-full w-2/3 opacity-70" viewBox="0 0 800 600" fill="none"><path d="M110 50c220 0 120 185 330 185S555 430 820 420" stroke="#A5F3FC" strokeDasharray="5 8" /><circle cx="610" cy="120" r="180" fill="#EEF9FC" /></svg>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
          <div>
            <p className="hero-reveal r1 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.17em] text-cyan-700"><i className="h-2 w-2 rounded-full bg-cyan-500" />Fiscalidade Digital</p>
            <h1 className="hero-reveal r2 mt-5 text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-[#102447] sm:text-6xl xl:text-[3.35rem] 2xl:text-6xl">{locale === 'en' ? <><span className="block xl:whitespace-nowrap">Organise your company’s</span><span className="block xl:whitespace-nowrap">tax management</span><span className="block text-cyan-500 xl:whitespace-nowrap">in one place.</span></> : <><span className="block xl:whitespace-nowrap">Organize a gestão fiscal</span><span className="block xl:whitespace-nowrap">da sua empresa</span><span className="block text-cyan-500 xl:whitespace-nowrap">num só lugar.</span></>}</h1>
            <p className="hero-reveal r3 mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{tr(locale, 'Facturação, obrigações, prazos, compras e equipa organizados num único ambiente.', 'Invoicing, obligations, deadlines, purchases and your team organised in one workspace.')}</p>
            <div className="hero-reveal r4 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(8,169,209,.2)] transition hover:-translate-y-0.5 hover:bg-cyan-600">{tr(locale, 'Criar conta', 'Create account')} <ArrowRight size={17} /></Link>
              <a href="#funcionalidades" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-[#102447] transition hover:border-cyan-300 hover:text-cyan-800">{tr(locale, 'Conhecer as soluções', 'Explore the solutions')} <ChevronRight size={17} /></a>
            </div>
            <div className="hero-reveal r4 mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              {(locale === 'en' ? ['Built for companies in Angola', 'More visible deadlines', 'Organised information'] : ['Pensado para empresas em Angola', 'Prazos mais visíveis', 'Informação organizada']).map((text) => <span key={text} className="inline-flex items-center gap-1.5"><Check size={14} className="text-cyan-600" />{text}</span>)}
            </div>
          </div>
          <div className="hero-reveal r5"><Mockup locale={locale} /></div>
        </div>
      </section>

      <div>
        <section id="sobre" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <Title eyebrow={tr(locale, 'Sobre a Fiscalidade Digital', 'About Fiscalidade Digital')}>{locale === 'en' ? <>Technology to<br /><span className="text-cyan-500">organise</span><br />tax operations.</> : <>Tecnologia para<br /><span className="text-cyan-500">organizar</span><br />a operação fiscal.</>}</Title>
            <div data-reveal className="landing-reveal landing-reveal--d1 max-w-2xl space-y-5 self-center text-base leading-7 text-slate-600">
              <p>{tr(locale, 'Reúna facturação, obrigações e dados administrativos num ambiente de trabalho claro.', 'Bring invoicing, obligations and administrative data together in a clear workspace.')}</p>
              <p className="border-l-2 border-cyan-500 pl-4 font-bold text-[#102447]">{tr(locale, 'Menos informação espalhada. Mais contexto para acompanhar a empresa.', 'Less scattered information. More context to follow your company.')}</p>
            </div>
          </div>
          <div data-reveal className="landing-reveal landing-reveal--d2 mt-12 grid gap-x-12 gap-y-8 border-t border-slate-200 pt-8 md:grid-cols-2">
            <article>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">{tr(locale, 'Missão', 'Mission')}</p>
              <p className="mt-3 max-w-md text-lg font-extrabold leading-7 tracking-[-.025em] text-[#102447]">{tr(locale, 'Simplificar a gestão fiscal e empresarial em Angola, reunindo informação, ferramentas e apoio num único lugar para ajudar as empresas a trabalhar com mais organização e confiança.', 'To simplify tax and business management in Angola, bringing together information, tools and support in one place so companies can work with more organisation and confidence.')}</p>
            </article>
            <article className="md:border-l md:border-slate-200 md:pl-12">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">{tr(locale, 'Visão', 'Vision')}</p>
              <p className="mt-3 max-w-md text-lg font-extrabold leading-7 tracking-[-.025em] text-[#102447]">{tr(locale, 'Ser uma referência em soluções digitais de gestão em Angola, aproximando as empresas da tecnologia e contribuindo para negócios mais organizados e preparados para crescer.', 'To be a reference for digital management solutions in Angola, bringing companies closer to technology and helping build more organised businesses ready to grow.')}</p>
            </article>
          </div>
        </div>
        </section>

      </div>

      <WhyChooseSection locale={locale} />

      <section id="ecossistema" aria-labelledby="ecosystem-title" className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal className="landing-reveal flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">{tr(locale, 'Ecossistema', 'Ecosystem')}</p>
              <h2 id="ecosystem-title" className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#102447] sm:text-4xl">{tr(locale, 'Relações que reforçam a nossa visão.', 'Relationships that reinforce our vision.')}</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{tr(locale, 'Iniciativas e organizações que fazem parte do percurso da Fiscalidade Digital em Angola.', 'Initiatives and organisations that are part of Fiscalidade Digital’s journey in Angola.')}</p>
          </div>
          <ul data-reveal className="landing-reveal landing-reveal--d1 mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={tr(locale, 'Parceiros e iniciativas relacionadas', 'Related partners and initiatives')}>
            {ecosystemPartners.map((partner) => (
              <li key={partner.name} className="flex min-h-[132px] items-center justify-center rounded-xl border border-slate-200 bg-[#f8fafc] p-6 shadow-[0_8px_22px_rgba(15,41,79,.04)] transition-[border-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_14px_28px_rgba(15,41,79,.08)]">
                <Image src={partner.image} alt={partner.name} width={partner.width} height={partner.height} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 38vw, 76vw" className={partner.imageClassName} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="como-funciona" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Title eyebrow={tr(locale, 'Como funciona', 'How it works')}>{tr(locale, 'Da operação diária a uma visão mais clara.', 'From daily operations to a clearer view.')}</Title>
          <div role="list" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(locale === 'en' ? ['Register the company', 'Organise operations', 'Keep essential information together', 'Plan the next steps'] : ['Registe a empresa', 'Organize a operação', 'Mantenha a informação essencial reunida', 'Planeie os próximos passos']).map((text, index) => <article role="listitem" data-reveal key={text} className={`landing-reveal border-t border-slate-300 pt-4 ${index > 0 ? 'landing-reveal--d1' : ''}`}><p className="mt-1 text-sm font-extrabold leading-6 text-[#102447]">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative overflow-hidden bg-[#102447] py-16 text-white sm:py-20 lg:py-24">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 1200 400" fill="none"><path d="M0 300c280-20 290-220 550-220s320 190 650 120" stroke="#67E8F9" strokeDasharray="5 8" /></svg>
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,.7fr)] lg:items-center lg:px-8">
          <div data-reveal className="landing-reveal">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-200">{tr(locale, 'Contacto', 'Contact')}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{tr(locale, 'Vamos falar sobre a gestão fiscal da sua empresa?', 'Shall we talk about your company’s tax management?')}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">{tr(locale, 'Conheça a plataforma, coloque as suas questões e encontre o próximo passo mais adequado para a sua empresa.', 'Get to know the platform, ask your questions and find the next step that best fits your company.')}</p>
          </div>
          <div data-reveal className="landing-reveal landing-reveal--d1 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.055] shadow-[0_18px_42px_rgba(3,16,38,.18)]">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={tr(locale, 'Falar no WhatsApp da Fiscalidade Digital', 'Talk to Fiscalidade Digital on WhatsApp')} className="group flex min-h-[104px] items-center gap-4 border-b border-white/15 p-5 transition-[background-color,transform] duration-200 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-cyan-200">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-[#06351b] transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5"><WhatsAppIcon size={22} /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-[.14em] text-cyan-200">WhatsApp</span><span className="mt-1 block text-base font-extrabold text-white">{tr(locale, 'Falar com a equipa', 'Talk to the team')}</span><span className="mt-1 block text-xs leading-5 text-slate-300">{tr(locale, 'Uma conversa directa para conhecer melhor a sua necessidade.', 'A direct conversation to better understand your needs.')}</span></span>
              <ChevronRight size={19} className="shrink-0 text-cyan-200 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a href={`mailto:${contactEmail}`} className="group flex min-h-[104px] items-center gap-4 p-5 transition-[background-color,transform] duration-200 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-cyan-200">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-200 transition-transform duration-200 motion-safe:group-hover:-translate-y-0.5"><Mail size={21} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase tracking-[.14em] text-cyan-200">{tr(locale, 'E-mail', 'Email')}</span><span className="mt-1 block break-all text-sm font-extrabold text-white sm:text-base">{contactEmail}</span><span className="mt-1 block text-xs leading-5 text-slate-300">{tr(locale, 'Use este canal para nos enviar o contexto da sua empresa.', 'Use this channel to send us your company context.')}</span></span>
              <ChevronRight size={19} className="shrink-0 text-cyan-200 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[#082755] py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 lg:flex-row lg:items-end lg:px-8">
          <div data-reveal className="landing-reveal"><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Fiscalidade Digital</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{tr(locale, 'Tenha uma visão mais clara da fiscalidade da sua empresa.', 'Get a clearer view of your company’s tax position.')}</h2><p className="mt-4 max-w-2xl leading-7 text-slate-200">{tr(locale, 'Centralize facturação, obrigações, equipa e prazos numa única plataforma.', 'Centralise invoicing, obligations, people and deadlines in one platform.')}</p></div>
          <div data-reveal className="landing-reveal landing-reveal--d1 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="rounded-xl bg-cyan-300 px-5 py-3.5 text-center text-sm font-extrabold text-[#062247] transition hover:-translate-y-0.5 hover:bg-cyan-200">{tr(locale, 'Criar a minha conta', 'Create my account')}</Link><Link href="/login" className="rounded-xl border border-white/35 px-5 py-3.5 text-center text-sm font-bold transition hover:bg-white/10">{tr(locale, 'Já tenho conta', 'I already have an account')}</Link></div>
        </div>
      </section>

      <Team locale={locale} />

      <footer className="bg-[#061a36] text-slate-300">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="grid gap-8 border-b border-white/15 pb-9 sm:grid-cols-2 lg:grid-cols-5">
            <div><Brand locale={locale} /><p className="mt-4 text-sm leading-6 text-slate-400">{tr(locale, 'Gestão fiscal e empresarial para empresas em Angola.', 'Tax and business management for companies in Angola.')}</p></div>
            <Footer title={tr(locale, 'Plataforma', 'Platform')} links={locale === 'en' ? [['Features', '#funcionalidades'], ['How it works', '#como-funciona']] : [['Funcionalidades', '#funcionalidades'], ['Como funciona', '#como-funciona']]} />
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{tr(locale, 'Empresa', 'Company')}</p>
              <div className="mt-4 grid gap-3 text-sm">
                <a href="#sobre" className="inline-flex min-h-[40px] items-center transition hover:text-cyan-200">{tr(locale, 'Sobre nós', 'About us')}</a>
                <a href="#contacto" className="inline-flex min-h-[40px] items-center transition hover:text-cyan-200">{tr(locale, 'Contacto', 'Contact')}</a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-[42px] w-fit items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 font-extrabold text-[#06351b] transition hover:-translate-y-0.5 hover:bg-[#53e589] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"><WhatsAppIcon size={16} />{tr(locale, 'Falar no WhatsApp', 'Talk on WhatsApp')}</a>
              </div>
            </div>
            <Footer title={tr(locale, 'Conta', 'Account')} links={locale === 'en' ? [['Log in', '/login'], ['Create account', '/register'], [contactEmail, `mailto:${contactEmail}`]] : [['Entrar', '/login'], ['Criar conta', '/register'], [contactEmail, `mailto:${contactEmail}`]]} />
            <Footer title={tr(locale, 'Legal', 'Legal')} links={locale === 'en' ? [['Terms of Use (Portuguese)', '/terms'], ['Privacy Policy (Portuguese)', '/privacy']] : [['Termos de Utilização', '/terms'], ['Política de Privacidade', '/privacy']]} />
          </div>
          <p className="pt-6 text-xs text-slate-500">© {new Date().getFullYear()} Fiscalidade Digital · Angola</p>
        </div>
      </footer>

      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={tr(locale, 'Falar no WhatsApp da Fiscalidade Digital', 'Talk to Fiscalidade Digital on WhatsApp')} className="fixed bottom-4 left-4 z-40 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-extrabold text-[#06351b] shadow-[0_12px_28px_rgba(15,41,79,.22)] transition hover:-translate-y-0.5 hover:bg-[#53e589] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 sm:bottom-5 sm:left-5"><WhatsAppIcon size={20} /><span className="hidden sm:inline">{tr(locale, 'Falar no WhatsApp', 'Talk on WhatsApp')}</span><span className="sm:hidden">WhatsApp</span></a>

      <style jsx global>{`
        @keyframes reveal { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .site .hero-reveal { animation: reveal .62s both cubic-bezier(.2, .7, .2, 1); }
        .site .r1 { animation-delay: 60ms; } .site .r2 { animation-delay: 140ms; } .site .r3 { animation-delay: 220ms; } .site .r4 { animation-delay: 300ms; } .site .r5 { animation-delay: 380ms; }
        [data-motion='ready'] .landing-reveal { opacity: 0; transform: translateY(20px); }
        [data-motion='ready'] .landing-reveal.is-visible { opacity: 1; transform: none; animation: reveal .7s both cubic-bezier(.2, .7, .2, 1); }
        [data-motion='ready'] .landing-reveal--d1.is-visible { animation-delay: 100ms; }
        [data-motion='ready'] .landing-reveal--d2.is-visible { animation-delay: 180ms; }
        @media (prefers-reduced-motion: reduce) {
          .site *, .site *::before, .site *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
          [data-motion='ready'] .landing-reveal { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </main>
  );
}

function Title({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return <div data-reveal className="landing-reveal"><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">{eyebrow}</p><h2 className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#102447] sm:text-4xl">{children}</h2></div>;
}

type TeamMember = {
  name: string;
  area: string;
  image: string;
  position: string;
  link: string;
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
        <div data-reveal className="landing-reveal max-w-3xl">
          <h2 className="text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#102447] sm:text-4xl">{tr(locale, 'A equipa por trás da Fiscalidade Digital', 'The team behind Fiscalidade Digital')}</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member, index) => (
            <figure data-reveal key={member.name} className={`landing-reveal group overflow-hidden rounded-2xl border border-slate-200 bg-white ${index % 2 ? 'landing-reveal--d1' : ''}`}>
              <div className="relative aspect-[4/5] bg-slate-100">
                <Image src={member.image} alt={tr(locale, `Fotografia de ${member.name}`, `Portrait of ${member.name}`)} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className={`object-contain transition-transform duration-500 motion-reduce:transform-none group-hover:scale-[1.025] ${member.position}`} />
              </div>
              <figcaption className="p-5">
                <p className="text-lg font-extrabold text-[#102447]">{member.name}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-cyan-800">{member.area}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{member.summary}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      lastTriggerRef.current = event.currentTarget;
                      setSelectedMember(member);
                    }}
                    className="inline-flex min-h-[42px] items-center rounded-lg bg-[#102447] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#17365f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
                  >
                    {tr(locale, 'Ver biografia', 'View biography')}
                  </button>
                  <a href={member.link} target="_blank" rel="noopener noreferrer" aria-label={tr(locale, `Abrir LinkedIn de ${member.name}`, `Open ${member.name}'s LinkedIn`)} className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg border border-slate-200 text-[#0b6f93] transition hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"><Linkedin size={18} /></a>
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
              <p className="text-sm font-bold text-[#102447]">{tr(locale, 'Equipa Fiscalidade Digital', 'Fiscalidade Digital team')}</p>
              <button ref={closeButtonRef} type="button" onClick={closeBiography} className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#102447] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700" aria-label={tr(locale, 'Fechar biografia', 'Close biography')}><X size={20} /></button>
            </div>
            <div className="grid gap-7 p-5 sm:grid-cols-[180px_1fr] sm:p-7">
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[180px] overflow-hidden rounded-2xl bg-slate-100 sm:mx-0">
                <Image src={selectedMember.image} alt={tr(locale, `Fotografia de ${selectedMember.name}`, `Portrait of ${selectedMember.name}`)} fill sizes="180px" className={`object-contain ${selectedMember.position}`} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-cyan-700">{selectedMember.area}</p>
                <h3 id="team-biography-title" className="mt-3 text-3xl font-extrabold tracking-tight text-[#102447]">{selectedMember.name}</h3>
                <p id="team-biography-summary" className="mt-4 text-base leading-7 text-slate-600">{selectedMember.bio}</p>
                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                  <section aria-labelledby="team-education-title">
                    <h4 id="team-education-title" className="text-sm font-extrabold text-[#102447]">{tr(locale, 'Formação e competências', 'Education and skills')}</h4>
                    <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">{selectedMember.education.map((item) => <li key={item} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-cyan-700" />{item}</li>)}</ul>
                  </section>
                  <section aria-labelledby="team-highlights-title">
                    <h4 id="team-highlights-title" className="text-sm font-extrabold text-[#102447]">{tr(locale, 'Destaques', 'Highlights')}</h4>
                    <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">{selectedMember.highlights.map((item) => <li key={item} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-cyan-700" />{item}</li>)}</ul>
                  </section>
                </div>
                <a href={selectedMember.link} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-cyan-200 px-4 py-2 text-sm font-bold text-cyan-800 transition hover:bg-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"><Linkedin size={17} />{tr(locale, 'Ver LinkedIn', 'View LinkedIn')}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Footer({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{title}</p><div className="mt-4 grid gap-3 text-sm">{links.map(([name, href]) => href.startsWith('/') ? <Link key={href} href={href} className="inline-flex min-h-[40px] items-center transition hover:text-cyan-200">{name}</Link> : <a key={href} href={href} target={href === whatsappUrl ? '_blank' : undefined} rel={href === whatsappUrl ? 'noopener noreferrer' : undefined} className="inline-flex min-h-[40px] items-center transition hover:text-cyan-200">{name}</a>)}</div></div>;
}
