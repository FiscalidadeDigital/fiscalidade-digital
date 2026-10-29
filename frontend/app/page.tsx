'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Landmark,
  Linkedin,
  Menu,
  ReceiptText,
  UsersRound,
  X,
} from 'lucide-react';

const whatsappUrl = 'https://wa.me/244924462591';
const contactEmail = 'fiscalidadedigital@empresa.ao';

const nav = [
  ['Início', '#inicio'],
  ['Plataforma', '#plataforma'],
  ['Assistente', '#assistente'],
  ['Para quem', '#para-quem'],
  ['Sobre nós', '#sobre'],
  ['Contacto', '#contacto'],
] as const;

const logos = [
  { name: 'YAS', image: '/yas.jpg', variant: 'yas', width: 1080, height: 1080 },
  { name: 'Yash Hub', image: '/yashhublogo.jpg', variant: 'yash', width: 1080, height: 1080 },
  { name: 'Acelera Angola', image: '/aceleralogo.jpg', variant: 'acelera', width: 1181, height: 1181 },
  { name: 'Ignition Angola', image: '/Ignitionlogo.png', variant: 'ignition', width: 300, height: 78 },
];

const features = [
  ['Gestão fiscal', Landmark, ['Central Fiscal', 'Obrigações Fiscais', 'Calendário Fiscal', 'Alertas']],
  ['Operação empresarial', ReceiptText, ['Facturação', 'Compras e facturas recebidas', 'Clientes']],
  ['Pessoas', UsersRound, ['Funcionários', 'Processamento salarial', 'IRT e INSS']],
  ['Dados e conformidade', FileCheck2, ['SAF-T', 'Relatórios', 'Histórico']],
] as const;

const members = [
  {
    name: 'Desidério Pereira',
    area: 'Contabilidade · Fiscalidade · Estratégia',
    image: '/Desiderio.jpeg',
    position: 'object-[center_20%]',
    link: 'https://www.linkedin.com/in/desiderio-pereira-4b1a492a7',
  },
  {
    name: 'Edgar Gilson da Silva António',
    area: 'Contabilidade · Fiscalidade · Análise Financeira',
    image: '/edgar.jpg',
    position: 'object-[center_18%]',
    link: 'https://www.linkedin.com/in/edgar-ant%C3%B3nio-3a1048289',
  },
  {
    name: 'Francisco António',
    area: 'Contabilidade · Fiscalidade · Investigação',
    image: '/Francisco.jpeg',
    position: 'object-[center_18%]',
    link: 'https://www.linkedin.com/in/francisco-ant%C3%B3nio-891555281',
  },
  {
    name: 'Anildo Manuel João',
    area: 'Tecnologia · Desenvolvimento · Automação',
    image: '/Anildodev.jpg',
    position: 'object-[center_15%]',
    link: 'https://www.linkedin.com/in/anildo-jo%C3%A3o-85643330b',
  },
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" aria-label="Fiscalidade Digital — início" className="inline-flex items-center gap-3">
      <span className="rounded-xl bg-white p-1 shadow-sm">
        <Image src="/logofiscalidade.png" alt="" width={34} height={34} priority />
      </span>
      <span className={`font-extrabold tracking-tight ${inverse ? 'text-white' : 'text-[#102447]'}`}>
        Fiscalidade <span className="text-cyan-500">Digital</span>
      </span>
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

function Mockup() {
  return (
    <div className="hero-mockup relative mx-auto max-w-[470px]">
      <div className="absolute -left-6 bottom-8 hidden w-44 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_18px_35px_rgba(15,41,79,.11)] sm:block">
        <p className="text-xs font-bold text-[#102447]">Obrigações</p>
        <p className="mt-1 text-[11px] text-slate-500">Prazos organizados</p>
      </div>
      <div className="absolute -right-5 top-8 hidden w-44 rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_18px_35px_rgba(15,41,79,.11)] sm:block">
        <p className="text-xs font-bold text-[#102447]">Impostos</p>
        <p className="mt-1 text-[11px] text-slate-500">Fiscalidade num só lugar</p>
      </div>
      <div className="rounded-[28px] border border-white bg-white p-5 shadow-[0_30px_70px_rgba(15,41,79,.16)]">
        <div className="flex gap-1.5">
          <i className="h-2 w-2 rounded-full bg-cyan-400" />
          <i className="h-2 w-2 rounded-full bg-slate-200" />
          <i className="h-2 w-2 rounded-full bg-slate-200" />
        </div>
        <div className="mt-12 rounded-2xl bg-[#f2f9fb] p-5">
          <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-cyan-700">
            <FileText size={13} /> Gestão fiscal
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight text-[#102447]">
            Simplifique<br />a gestão da<br />sua empresa.
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
          <span className="rounded-xl bg-cyan-50 px-2 py-3 text-cyan-800">Impostos</span>
          <span className="rounded-xl bg-slate-50 px-2 py-3 text-[#102447]">Obrigações</span>
          <span className="rounded-xl bg-slate-50 px-2 py-3 text-[#102447]">Folha salarial</span>
        </div>
      </div>
    </div>
  );
}

function FiscalDemo() {
  const rows = [
    ['IVA', 'Enquadramento por imposto', 'Consultar'],
    ['Imposto Industrial', 'Regras por período', 'Consultar'],
    ['IRT', 'Factos laborais', 'Acompanhar'],
    ['INSS', 'Contribuições laborais', 'Acompanhar'],
    ['SAF-T', 'Requisito documental', 'Preparar'],
  ];

  return (
    <div className="demo-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,41,79,.12)] sm:p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Demonstração da plataforma</span>
        <span className="rounded bg-cyan-50 px-2 py-1 text-[10px] font-bold text-cyan-800">Central Fiscal</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Metric label="Situação fiscal" value="Organizada" dark />
        <Metric label="Em atenção" value="01" />
        <Metric label="Próximas" value="02" />
      </div>
      <div className="mt-4 space-y-2">
        {rows.map(([tax, text, state]) => (
          <div className="demo-row flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5" key={tax}>
            <b className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-[10px] text-cyan-800">
              {tax === 'Imposto Industrial' ? 'II' : tax}
            </b>
            <span className="min-w-0 flex-1">
              <strong className="block text-xs text-[#102447]">{tax}</strong>
              <small className="text-[11px] text-slate-500">{text}</small>
            </span>
            <em className="rounded-full bg-slate-100 px-2 py-1 text-[10px] not-italic text-slate-600">{state}</em>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-5 text-slate-500">Demonstração visual. Os dados não correspondem a uma empresa real.</p>
    </div>
  );
}

function Metric({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`demo-stat rounded-xl p-3 ${dark ? 'bg-[#102447] text-white' : 'bg-slate-50 text-[#102447]'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-cyan-200' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}

function AssistantPreview() {
  return (
    <div className="assistant-preview relative mx-auto max-w-xl rounded-[28px] border border-cyan-100 bg-white p-4 shadow-[0_24px_60px_rgba(15,41,79,.12)] sm:p-5">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Bot size={18} /></span>
        <div>
          <p className="text-sm font-extrabold text-[#102447]">Assistente Fiscal</p>
          <p className="text-[11px] text-slate-500">Consulta assistida e fundamentada</p>
        </div>
      </div>
      <div className="mt-6 space-y-3 text-sm leading-6">
        <div className="assistant-question ml-8 rounded-2xl rounded-tr-sm bg-[#102447] px-4 py-3 text-white">
          Quais obrigações devo acompanhar este mês?
        </div>
        <div className="assistant-answer mr-6 rounded-2xl rounded-tl-sm border-l-2 border-cyan-500 bg-slate-50 px-4 py-3 text-slate-700">
          Posso ajudar a organizar a consulta e indicar as fontes disponíveis na sua sessão.
        </div>
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">A informação da empresa é usada apenas no contexto autorizado.</p>
    </div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logosPaused, setLogosPaused] = useState(false);
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    const elements = Array.from(page.querySelectorAll<HTMLElement>('[data-reveal]'));
    page.dataset.motion = 'ready';
    const revealInViewport = () => {
      elements.forEach((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 1.15 && bounds.bottom > -64) element.classList.add('is-visible');
      });
    };
    const visibilityFallback = window.setTimeout(() => {
      elements.forEach((element) => element.classList.add('is-visible'));
    }, 5000);
    window.addEventListener('scroll', revealInViewport, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8%', threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => {
      window.clearTimeout(visibilityFallback);
      window.removeEventListener('scroll', revealInViewport);
      observer.disconnect();
      delete page.dataset.motion;
    };
  }, []);

  return (
    <main ref={pageRef} className="site min-h-screen overflow-x-hidden bg-white text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <nav aria-label="Navegação principal" className="hidden gap-5 xl:flex">
            {nav.map(([name, href]) => <a key={href} href={href} className="text-sm font-bold text-slate-600 transition-colors hover:text-cyan-700">{name}</a>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="text-sm font-bold text-[#102447] transition-colors hover:text-cyan-700">Entrar</Link>
            <Link href="/register" className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-600">Criar conta</Link>
          </div>
          <button type="button" className="rounded-lg p-2 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 xl:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-controls="menu-principal-mobile" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav id="menu-principal-mobile" aria-label="Navegação principal móvel" className="border-t border-slate-100 bg-white px-5 py-4 xl:hidden">
            {nav.map(([name, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block border-b border-slate-100 py-3 text-sm font-bold text-[#102447] transition-colors hover:text-cyan-700">{name}</a>)}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-[#102447]">Entrar</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-white">Criar conta</Link>
            </div>
          </nav>
        )}
      </header>

      <section id="inicio" className="relative overflow-hidden bg-white py-16 sm:py-20">
        <svg aria-hidden="true" className="absolute right-0 top-0 h-full w-2/3 opacity-70" viewBox="0 0 800 600" fill="none"><path d="M110 50c220 0 120 185 330 185S555 430 820 420" stroke="#A5F3FC" strokeDasharray="5 8" /><circle cx="610" cy="120" r="180" fill="#EEF9FC" /></svg>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:px-8">
          <div>
            <p className="hero-reveal r1 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.17em] text-cyan-700"><i className="h-2 w-2 rounded-full bg-cyan-500" />Fiscalidade Digital</p>
            <h1 className="hero-reveal r2 mt-5 text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-[#102447] sm:text-6xl">Organize a gestão<br />da sua empresa<br /><span className="text-cyan-500">num só lugar.</span></h1>
            <p className="hero-reveal r3 mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Facturação, obrigações, prazos, compras e equipa organizados num único ambiente.</p>
            <div className="hero-reveal r4 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(8,169,209,.2)] transition hover:-translate-y-0.5 hover:bg-cyan-600">Criar conta <ArrowRight size={17} /></Link>
              <a href="#plataforma" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-[#102447] transition hover:border-cyan-300 hover:text-cyan-800">Conhecer a plataforma <ChevronRight size={17} /></a>
            </div>
            <div className="hero-reveal r4 mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              {['Pensado para empresas em Angola', 'Prazos mais visíveis', 'Informação organizada'].map((text) => <span key={text} className="inline-flex items-center gap-1.5"><Check size={14} className="text-cyan-600" />{text}</span>)}
            </div>
          </div>
          <div className="hero-reveal r5"><Mockup /></div>
        </div>
      </section>

      <section className="border-y border-slate-100 py-7 sm:py-8">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Ecossistema e iniciativas relacionadas</p>
        <div className="mb-4 flex justify-center">
          <button type="button" aria-pressed={logosPaused} onClick={() => setLogosPaused((paused) => !paused)} className="rounded-full px-3 py-1.5 text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-cyan-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
            {logosPaused ? 'Retomar movimento' : 'Pausar movimento'}
          </button>
        </div>
        <div className={`landing-logo-marquee ${logosPaused ? 'landing-logo-marquee--paused' : ''}`} aria-label="Ecossistema e iniciativas relacionadas">
          <div className="landing-logo-marquee__track">
            {[0, 1].map((group) => <div key={group} aria-hidden={group === 1} className="landing-logo-marquee__group">{logos.map((logo) => <div key={`${group}-${logo.name}`} className={`landing-logo-marquee__item landing-logo-marquee__item--${logo.variant}`}><Image src={logo.image} alt={group ? '' : logo.name} width={logo.width} height={logo.height} sizes="(max-width: 639px) 232px, 260px" className="landing-logo-marquee__image" /></div>)}</div>)}
          </div>
        </div>
      </section>

      <div id="sobre">
        <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
            <Title eyebrow="Sobre a Fiscalidade Digital">Tecnologia para<br /><span className="text-cyan-500">organizar</span><br />a operação fiscal.</Title>
            <div data-reveal className="landing-reveal landing-reveal--d1 max-w-2xl space-y-5 self-center text-base leading-7 text-slate-600">
              <p>Reúna facturação, obrigações e dados administrativos num ambiente de trabalho claro.</p>
              <p className="border-l-2 border-cyan-500 pl-4 font-bold text-[#102447]">Menos informação espalhada. Mais contexto para acompanhar a empresa.</p>
            </div>
          </div>
          <div data-reveal className="landing-reveal landing-reveal--d2 mt-12 grid gap-x-12 gap-y-8 border-t border-slate-200 pt-8 md:grid-cols-2">
            <article>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">Missão</p>
              <p className="mt-3 max-w-md text-lg font-extrabold leading-7 tracking-[-.025em] text-[#102447]">Organizar a operação fiscal e empresarial num único ambiente de trabalho claro.</p>
            </article>
            <article className="md:border-l md:border-slate-200 md:pl-12">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">Visão</p>
              <p className="mt-3 max-w-md text-lg font-extrabold leading-7 tracking-[-.025em] text-[#102447]">Dar às empresas em Angola uma leitura mais clara da sua operação fiscal.</p>
            </article>
          </div>
        </div>
        </section>

        <Team />
      </div>

      <section id="plataforma" className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.78fr_1.22fr] lg:items-center lg:px-8">
          <div data-reveal className="landing-reveal">
            <Title eyebrow="Central Fiscal">Veja o que exige atenção.</Title>
            <p className="mt-5 text-base leading-7 text-slate-600">Enquadramentos, obrigações, prazos e alertas numa só vista.</p>
            <div className="mt-7 border-l-2 border-cyan-500 pl-4 text-sm leading-7 text-slate-600"><p><b className="text-[#102447]">Enquadramento</b> por imposto e período.</p><p><b className="text-[#102447]">Obrigações</b> e prazos a acompanhar.</p><p><b className="text-[#102447]">Alertas</b> para priorizar o próximo passo.</p></div>
            <Link href="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-cyan-800 transition hover:translate-x-1 hover:text-cyan-600">Organizar a situação fiscal da empresa <ArrowRight size={16} /></Link>
          </div>
          <div data-reveal className="landing-reveal landing-reveal--d1"><FiscalDemo /></div>
        </div>
      </section>

      <section id="assistente" className="overflow-hidden bg-[#e9f5f8] py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-8">
          <div data-reveal className="landing-reveal">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-800">Assistente Fiscal</p>
            <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#102447] sm:text-4xl">Uma pergunta fiscal não precisa ficar sem contexto.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">No ambiente autenticado, o assistente apoia a consulta de temas fiscais e mostra fontes quando estão disponíveis.</p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">Perguntas sobre a empresa respeitam o contexto autorizado da sua sessão.</p>
            <Link href="/assistant" className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#102447] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(15,41,79,.16)] transition hover:-translate-y-0.5 hover:bg-[#17365f]">Experimentar o assistente <ArrowRight size={17} /></Link>
          </div>
          <div data-reveal className="landing-reveal landing-reveal--d1"><AssistantPreview /></div>
        </div>
      </section>

      <section id="funcionalidades" className="bg-[#f7fafc] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Title eyebrow="Ecossistema">Uma plataforma para organizar a operação fiscal e empresarial.</Title>
          <div className="mt-10 grid gap-x-14 gap-y-10 lg:grid-cols-2">
            {features.map(([name, Icon, items], index) => <article data-reveal key={name} className={`landing-reveal border-t border-slate-300 pt-5 ${index % 2 ? 'landing-reveal--d1' : ''}`}><div className="flex gap-4"><Icon size={20} className="mt-0.5 text-cyan-700" /><h3 className="text-xl font-extrabold text-[#102447]">{name}</h3></div><div className="mt-5 divide-y divide-slate-200">{items.map((item) => <p key={item} className="py-3 text-sm font-semibold text-slate-600">{item}</p>)}</div></article>)}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <Title eyebrow="Como funciona">Da operação diária a uma visão mais clara.</Title>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {['Cadastre a empresa', 'Organize a operação', 'Defina o contexto fiscal', 'Acompanhe a Central Fiscal', 'Controle os próximos prazos'].map((text, index) => <li data-reveal key={text} className={`landing-reveal border-t border-slate-300 pt-4 ${index > 0 ? 'landing-reveal--d1' : ''}`}><span className="text-xs font-bold text-cyan-700">0{index + 1}</span><p className="mt-4 text-sm font-extrabold leading-6 text-[#102447]">{text}</p></li>)}
          </ol>
        </div>
      </section>

      <section id="para-quem" className="bg-[#102447] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div data-reveal className="landing-reveal"><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Para quem é</p><h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Informação organizada para quem acompanha a empresa todos os dias.</h2></div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[[Briefcase, 'Empresas', 'Centralize a operação fiscal e tenha maior visibilidade sobre obrigações, facturação, equipa e prazos.'], [FileCheck2, 'Contabilistas', 'Organize informação fiscal e operacional e acompanhe responsabilidades dos clientes.'], [BarChart3, 'Equipas financeiras', 'Tenha informação empresarial e fiscal estruturada para acompanhamento e decisão.']].map(([Icon, title, text], index) => { const ItemIcon = Icon as typeof Briefcase; return <div data-reveal key={title as string} className={`landing-reveal border-t border-white/25 pt-5 ${index ? 'landing-reveal--d1' : ''}`}><ItemIcon size={22} className="text-cyan-300" /><h3 className="mt-4 text-lg font-extrabold">{title as string}</h3><p className="mt-3 text-sm leading-6 text-slate-200">{text as string}</p></div>; })}
          </div>
        </div>
      </section>

      <section id="contacto" className="relative overflow-hidden bg-[#102447] py-16 text-white sm:py-20">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 1200 400" fill="none"><path d="M0 300c280-20 290-220 550-220s320 190 650 120" stroke="#67E8F9" strokeDasharray="5 8" /></svg>
        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 lg:flex-row lg:items-end lg:px-8">
          <div data-reveal className="landing-reveal"><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Contacto</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Vamos falar sobre a gestão fiscal da sua empresa?</h2><p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">Conheça a plataforma e organize a operação da sua empresa.</p></div>
          <div data-reveal className="landing-reveal landing-reveal--d1 flex flex-col items-start gap-4">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp da Fiscalidade Digital" className="inline-flex min-h-[52px] items-center gap-3 rounded-xl bg-[#25D366] px-5 py-3.5 text-sm font-extrabold text-[#06351b] shadow-[0_12px_24px_rgba(0,0,0,.16)] transition hover:-translate-y-0.5 hover:bg-[#53e589]"><WhatsAppIcon size={21} />Falar no WhatsApp</a>
            <div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">E-mail</p><a href={`mailto:${contactEmail}`} className="mt-1 inline-block text-sm font-bold text-cyan-200 underline underline-offset-4 transition hover:text-white">{contactEmail}</a></div>
          </div>
        </div>
      </section>

      <section className="bg-[#082755] py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 lg:flex-row lg:items-end lg:px-8">
          <div data-reveal className="landing-reveal"><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-200">Fiscalidade Digital</p><h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Tenha uma visão mais clara da fiscalidade da sua empresa.</h2><p className="mt-4 max-w-2xl leading-7 text-slate-200">Centralize facturação, obrigações, equipa e prazos numa única plataforma.</p></div>
          <div data-reveal className="landing-reveal landing-reveal--d1 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="rounded-xl bg-cyan-300 px-5 py-3.5 text-center text-sm font-extrabold text-[#062247] transition hover:-translate-y-0.5 hover:bg-cyan-200">Criar minha conta</Link><Link href="/login" className="rounded-xl border border-white/35 px-5 py-3.5 text-center text-sm font-bold transition hover:bg-white/10">Já tenho conta</Link></div>
        </div>
      </section>

      <footer className="bg-[#061a36] text-slate-300">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="grid gap-8 border-b border-white/15 pb-9 sm:grid-cols-2 lg:grid-cols-4"><div><Brand inverse /><p className="mt-4 text-sm leading-6 text-slate-400">Gestão fiscal e empresarial para empresas em Angola.</p></div><Footer title="Plataforma" links={[['Plataforma', '#plataforma'], ['Funcionalidades', '#funcionalidades'], ['Como funciona', '#como-funciona']]} /><div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Empresa</p><div className="mt-4 grid gap-3 text-sm"><a href="#sobre" className="transition hover:text-cyan-200">Sobre nós</a><a href="#contacto" className="transition hover:text-cyan-200">Contacto</a><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-[42px] w-fit items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 font-extrabold text-[#06351b] transition hover:-translate-y-0.5 hover:bg-[#53e589] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"><WhatsAppIcon size={16} />Falar no WhatsApp</a></div></div><Footer title="Conta" links={[['Entrar', '/login'], ['Criar conta', '/register'], [contactEmail, `mailto:${contactEmail}`]]} /></div>
          <p className="pt-6 text-xs text-slate-500">© {new Date().getFullYear()} Fiscalidade Digital · Angola</p>
        </div>
      </footer>

      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp da Fiscalidade Digital" className="fixed bottom-4 left-4 z-40 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-extrabold text-[#06351b] shadow-[0_12px_28px_rgba(15,41,79,.22)] transition hover:-translate-y-0.5 hover:bg-[#53e589] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700 sm:bottom-5 sm:left-5"><WhatsAppIcon size={20} /><span className="hidden sm:inline">Falar no WhatsApp</span><span className="sm:hidden">WhatsApp</span></a>

      <style jsx global>{`
        @keyframes reveal { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes row { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }
        @keyframes landingLogoMarquee { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(-50%, 0, 0); } }
        @keyframes assistantDrift { from { transform: translateY(0); } to { transform: translateY(-4px); } }
        .hero-reveal, .hero-mockup { animation: reveal .62s both cubic-bezier(.2, .7, .2, 1); }
        .r1 { animation-delay: 60ms; } .r2 { animation-delay: 140ms; } .r3 { animation-delay: 220ms; } .r4 { animation-delay: 300ms; } .r5 { animation-delay: 380ms; }
        .demo-stat, .demo-row { animation: row .42s both ease-out; }
        .demo-row:nth-child(2) { animation-delay: 80ms; } .demo-row:nth-child(3) { animation-delay: 160ms; } .demo-row:nth-child(4) { animation-delay: 240ms; } .demo-row:nth-child(5) { animation-delay: 320ms; }
        .assistant-question { animation: assistantDrift 3.8s ease-in-out infinite alternate; }
        .assistant-answer { animation: assistantDrift 4.6s .45s ease-in-out infinite alternate-reverse; }
        .landing-logo-marquee { position: relative; width: 100%; max-width: 100%; min-width: 0; overflow: hidden; isolation: isolate; }
        .landing-logo-marquee__track { display: flex; width: max-content; align-items: center; animation: landingLogoMarquee 38s linear infinite; will-change: transform; }
        .landing-logo-marquee__group { display: flex; flex: 0 0 auto; align-items: center; gap: 2.5rem; padding-right: 2.5rem; }
        .landing-logo-marquee__item { display: flex; flex: 0 0 220px; width: 220px; height: 132px; align-items: center; justify-content: center; overflow: hidden; }
        .landing-logo-marquee__image { display: block; max-width: none !important; flex: none; object-fit: contain; opacity: 1; transition: transform .3s ease; }
        .landing-logo-marquee__item--yas .landing-logo-marquee__image { width: 252px; height: 252px; }
        .landing-logo-marquee__item--yash .landing-logo-marquee__image { width: 282px; height: 282px; }
        .landing-logo-marquee__item--acelera .landing-logo-marquee__image { width: 352px; height: 352px; }
        .landing-logo-marquee__item--ignition .landing-logo-marquee__image { width: 286px; height: auto; }
        .landing-logo-marquee--paused .landing-logo-marquee__track { animation-play-state: paused; }
        @media (hover: hover) { .landing-logo-marquee:hover .landing-logo-marquee__track { animation-play-state: paused; } }
        [data-motion='ready'] .landing-reveal { opacity: 0; transform: translateY(20px); }
        [data-motion='ready'] .landing-reveal.is-visible { opacity: 1; transform: none; animation: reveal .7s both cubic-bezier(.2, .7, .2, 1); }
        [data-motion='ready'] .landing-reveal--d1.is-visible { animation-delay: 100ms; }
        [data-motion='ready'] .landing-reveal--d2.is-visible { animation-delay: 180ms; }
        @media (max-width: 639px) {
          .landing-logo-marquee__track { animation-duration: 48s; }
          .landing-logo-marquee__group { gap: 1rem; padding-right: 1rem; }
          .landing-logo-marquee__item { flex-basis: 232px; width: 232px; height: 168px; }
          .landing-logo-marquee__item--yas .landing-logo-marquee__image { width: 270px; height: 270px; }
          .landing-logo-marquee__item--yash .landing-logo-marquee__image { width: 270px; height: 270px; }
          .landing-logo-marquee__item--acelera .landing-logo-marquee__image { width: 290px; height: 290px; }
          .landing-logo-marquee__item--ignition .landing-logo-marquee__image { width: 226px; height: auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
          .landing-logo-marquee__track { animation: none; transform: none; }
          [data-motion='ready'] .landing-reveal { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </main>
  );
}

function Title({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return <div data-reveal className="landing-reveal"><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-700">{eyebrow}</p><h2 className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#102447] sm:text-4xl">{children}</h2></div>;
}

function Team() {
  return <section aria-label="Equipa" className="bg-[#f7fafc] py-16 sm:py-20"><div className="mx-auto max-w-7xl px-5 lg:px-8"><Title eyebrow="Equipa">Pessoas que combinam contexto local e construção tecnológica.</Title><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{members.map((member, index) => <figure data-reveal key={member.name} className={`landing-reveal group overflow-hidden bg-[#082755] ${index % 2 ? 'landing-reveal--d1' : ''}`}><div className="relative aspect-[4/5] overflow-hidden"><Image src={member.image} alt={`Fotografia de ${member.name}`} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className={`object-cover transition duration-700 group-hover:scale-[1.03] ${member.position}`} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#061a36]/90 to-transparent p-5 pt-20"><p className="text-lg font-extrabold text-white">{member.name}</p><p className="mt-2 text-xs leading-5 text-cyan-100">{member.area}</p></div></div><figcaption className="flex items-center justify-between px-5 py-4 text-sm font-bold text-white"><span>Fiscalidade Digital</span><a href={member.link} target="_blank" rel="noopener noreferrer" aria-label={`Abrir LinkedIn de ${member.name}`} className="rounded p-1 text-cyan-200 transition hover:bg-white/10 hover:text-white"><Linkedin size={17} /></a></figcaption></figure>)}</div></div></section>;
}

function Footer({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{title}</p><div className="mt-4 grid gap-3 text-sm">{links.map(([name, href]) => href.startsWith('/') ? <Link key={href} href={href} className="transition hover:text-cyan-200">{name}</Link> : <a key={href} href={href} target={href === whatsappUrl ? '_blank' : undefined} rel={href === whatsappUrl ? 'noopener noreferrer' : undefined} className="transition hover:text-cyan-200">{name}</a>)}</div></div>;
}
