'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  FileScan,
  FileText,
  LockKeyhole,
  Menu,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';

const nav = [
  ['Produto', '#produto'],
  ['Como funciona', '#como-funciona'],
  ['Segurança', '#seguranca'],
  ['FAQ', '#faq'],
] as const;

const ecosystem = [
  { name: 'yas', image: '/yas.jpg' },
  { name: 'mabak', image: '/mabak.jpg' },
  { name: 'Yash Hub', image: '/yashhublogo.jpg' },
  { name: 'Rede Canais', image: '/imageslogo.jfif' },
  { name: 'Acelera', image: '/aceleralogo.jpg' },
  { name: 'Ignition', image: '/Ignitionlogo.png' },
];

const team = [
  { name: 'Desiderio', image: '/Desiderio.jpeg' },
  { name: 'Edgar', image: '/edgar.jpg' },
  { name: 'Francisco', image: '/Francisco.jpeg' },
  { name: 'Anildodev', image: '/Anildodev.jpg' },
];

const faqs = [
  ['O que é a Fiscalidade Digital?', 'Uma plataforma para centralizar facturação, documentos, obrigações, calendário e acompanhamento operacional de empresas em Angola.'],
  ['A plataforma substitui um contabilista?', 'Não. Ajuda a organizar informação e processos; situações que exigem apreciação profissional continuam a precisar da revisão adequada.'],
  ['Como funciona a leitura de facturas?', 'O documento é importado, os dados extraídos são apresentados para revisão humana e só depois podem ser confirmados como factura recebida.'],
  ['Os documentos ficam públicos?', 'Não. Os documentos são associados à empresa e as operações de acesso passam pela plataforma autenticada.'],
  ['Posso acompanhar diferentes obrigações?', 'Sim. A plataforma reúne períodos, vencimentos, estados e o contexto disponível para o acompanhamento da operação fiscal.'],
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="Fiscalidade Digital — início">
      <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={154} height={44} className="h-9 w-auto" priority />
      <span className={`hidden text-sm font-bold tracking-tight sm:block ${inverse ? 'text-white' : 'text-slate-950'}`}>Fiscalidade Digital</span>
    </Link>
  );
}

function DashboardPreview({ active }: { active: string }) {
  const content = {
    dashboard: { eyebrow: 'Visão da empresa', title: 'O que requer atenção agora', lines: ['Obrigações do período', 'Facturas recebidas em revisão', 'Alertas activos'], side: 'Acompanhamento contínuo' },
    obligations: { eyebrow: 'Obrigações', title: 'Período, origem e estado do cálculo', lines: ['IVA · Revisão necessária', 'IRT · Calculado', 'INSS · Calculado'], side: 'Rastreável por período' },
    invoices: { eyebrow: 'Facturação', title: 'Emita e acompanhe documentos', lines: ['Factura normal', 'Pro Forma', 'Factura recebida'], side: 'Operação no mesmo lugar' },
    payroll: { eyebrow: 'Payroll', title: 'Folha salarial com contexto fiscal', lines: ['Funcionários', 'IRT da folha', 'INSS trabalhador e empresa'], side: 'Processamento mensal' },
  }[active] ?? { eyebrow: '', title: '', lines: [], side: '' };

  return (
    <div className="landing-panel overflow-hidden border border-slate-200 bg-white p-3 shadow-[0_28px_80px_rgba(15,23,42,.16)] sm:p-4">
      <div className="flex items-center justify-between border-b border-slate-200 px-2 pb-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
        <span>Fiscalidade Digital</span><span className="text-cyan-700">Empresa activa</span>
      </div>
      <div className="grid gap-3 pt-3 sm:grid-cols-[1.35fr_.75fr]">
        <div className="border border-slate-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">{content.eyebrow}</p>
          <h3 className="mt-3 max-w-sm text-xl font-semibold tracking-[-.035em] text-slate-950">{content.title}</h3>
          <div className="mt-6 space-y-3">
            {content.lines.map((line, index) => (
              <div className="flex items-center gap-3 border-t border-slate-100 pt-3" key={line}>
                <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-cyan-500' : 'bg-slate-300'}`} />
                <span className="text-xs font-medium text-slate-700">{line}</span>
                <span className="ml-auto h-1.5 w-12 bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#071e3d] p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-300">Estado operacional</p>
          <p className="mt-4 text-base font-semibold leading-6">{content.side}</p>
          <div className="mt-8 border-t border-white/20 pt-4 text-xs leading-5 text-slate-300">Informação organizada para apoiar a revisão da equipa.</div>
        </div>
      </div>
    </div>
  );
}

function ProductTabs() {
  const [active, setActive] = useState('dashboard');
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['obligations', 'Obrigações'],
    ['invoices', 'Facturação'],
    ['payroll', 'Payroll'],
  ];
  return (
    <div className="mt-10">
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Áreas da plataforma">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={active === id} onClick={() => setActive(id)} className={`shrink-0 border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 ${active === id ? 'border-[#082755] bg-[#082755] text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-500'}`}>
            {label}
          </button>
        ))}
      </div>
      <DashboardPreview active={active} />
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f7fa] text-slate-950">
      <style jsx global>{`
        @keyframes landing-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes landing-marquee { to { transform: translateX(-50%); } }
        .landing-rise { animation: landing-rise .7s cubic-bezier(.2,.8,.2,1) both; }
        .landing-panel { animation: landing-rise .8s .16s cubic-bezier(.2,.8,.2,1) both; }
        .landing-marquee { animation: landing-marquee 32s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .landing-rise, .landing-panel, .landing-marquee { animation: none !important; } }
      `}</style>

      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-[#f5f7fa]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {nav.map(([label, href]) => <a href={href} key={href} className="text-sm font-medium text-slate-600 transition hover:text-[#082755]">{label}</a>)}
          </nav>
          <div className="hidden items-center gap-5 lg:flex"><Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-[#082755]">Entrar</Link><Link href="/register" className="inline-flex items-center gap-2 bg-[#082755] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800">Criar conta <ArrowRight className="h-4 w-4" /></Link></div>
          <button type="button" className="grid h-10 w-10 place-items-center border border-slate-300 lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && <nav className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden" aria-label="Navegação móvel"><div className="mx-auto grid max-w-7xl gap-1">{nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="border-b border-slate-100 py-3 text-sm font-semibold">{label}</a>)}<Link href="/login" className="pt-4 text-sm font-semibold">Entrar</Link><Link href="/register" className="mt-3 inline-flex w-fit items-center gap-2 bg-[#082755] px-4 py-2.5 text-sm font-semibold text-white">Criar conta <ArrowRight className="h-4 w-4" /></Link></div></nav>}
      </header>

      <section className="relative overflow-hidden bg-[#082755] text-white">
        <div className="absolute inset-0 opacity-30 [background:linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-28">
          <div className="landing-rise self-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Fiscalidade Digital · Angola</p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-.052em] sm:text-5xl lg:text-6xl">Fiscalidade empresarial, organizada num só lugar.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">Centralize obrigações fiscais, facturação, facturas recebidas, calendário, alertas e folha salarial numa visão preparada para o trabalho da sua empresa.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-5 py-3 text-sm font-bold text-[#062247] transition hover:bg-cyan-300">Começar agora <ArrowRight className="h-4 w-4" /></Link><a href="#como-funciona" className="inline-flex items-center justify-center border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Ver como funciona</a></div>
            <p className="mt-6 text-xs text-slate-300">Desenvolvido para a realidade das empresas em Angola.</p>
          </div>
          <div className="self-center"><DashboardPreview active="dashboard" /></div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-8" aria-label="Ecossistema">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><p className="mb-5 text-center text-[10px] font-bold uppercase tracking-[.17em] text-slate-500">Programas e comunidades do ecossistema empreendedor</p></div>
        <div className="relative overflow-hidden"><div className="landing-marquee flex w-max hover:[animation-play-state:paused]">{[...ecosystem, ...ecosystem].map((partner, index) => <div key={`${partner.name}-${index}`} className="mx-3 flex h-14 w-32 items-center justify-center border border-slate-200 bg-[#f8fafc] px-3 sm:w-40"><Image src={partner.image} alt={partner.name} width={120} height={40} className="max-h-8 w-auto max-w-[105px] object-contain grayscale" /></div>)}</div></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-24">
        <div><p className="text-xs font-bold uppercase tracking-[.17em] text-cyan-800">Menos dispersão</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#082755] sm:text-4xl">Menos folhas dispersas. Mais controlo fiscal.</h2></div>
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">{['Prazos espalhados entre ficheiros e mensagens.', 'Documentos difíceis de encontrar no momento certo.', 'Facturação separada das obrigações.', 'Falta de visão consolidada sobre a operação.'].map((item, index) => <div className="border-t border-slate-300 pt-4" key={item}><span className="text-xs font-bold text-cyan-700">0{index + 1}</span><p className="mt-3 text-sm leading-6 text-slate-600">{item}</p></div>)}</div>
      </section>

      <section id="produto" className="bg-white py-16 lg:py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-cyan-800">Produto</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#082755] sm:text-4xl">Uma plataforma para acompanhar a operação fiscal da empresa.</h2></div><p className="max-w-xl self-end text-base leading-7 text-slate-600">Dashboard, obrigações, facturação, facturas recebidas, funcionários, payroll, calendário, alertas e simulador fiscal organizados no mesmo ambiente.</p></div><ProductTabs /></div></section>

      <section id="como-funciona" className="bg-[#e9f5f8] py-16 lg:py-24"><div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.82fr_1.18fr] lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-cyan-800">Documento a registo</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#082755] sm:text-4xl">A leitura ajuda. A decisão continua na sua equipa.</h2><p className="mt-5 max-w-md text-base leading-7 text-slate-600">Facturas recebidas passam por um fluxo de importação e revisão antes de se tornarem informação operacional.</p></div><div className="grid gap-px bg-cyan-900/15 sm:grid-cols-5">{[['Documento', FileText], ['OCR', FileScan], ['Dados extraídos', ReceiptText], ['Revisão humana', UsersRound], ['Factura recebida', Check]].map(([label, Icon], index) => { const ItemIcon = Icon as typeof FileText; return <div className={`min-h-40 p-5 ${index === 3 ? 'bg-[#082755] text-white' : 'bg-[#f8fcfd] text-[#082755]'}`} key={label as string}><ItemIcon className={`h-5 w-5 ${index === 3 ? 'text-cyan-300' : 'text-cyan-700'}`} /><p className="mt-8 text-sm font-semibold">{label as string}</p>{index === 3 && <p className="mt-2 text-xs leading-5 text-slate-300">REVIEW REQUIRED</p>}</div>; })}</div></div></section>

      <section className="bg-[#082755] py-16 text-white lg:py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="grid gap-12 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-cyan-300">Fiscal engine</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Acompanhamento fiscal mais claro e rastreável.</h2><p className="mt-5 max-w-lg text-base leading-7 text-slate-300">A plataforma mostra períodos, origem dos valores, estado do cálculo e pontos que precisam de revisão antes de uma decisão sensível.</p></div><div className="border-y border-white/20">{[['Facturação', 'Fiscal Engine', 'Obrigações'], ['Funcionários', 'Payroll', 'IRT / INSS']].map((flow) => <div className="grid grid-cols-3 border-b border-white/20 py-6 last:border-0" key={flow[0]}>{flow.map((step, index) => <div className="relative pr-4 text-sm font-semibold text-slate-100" key={step}>{step}{index < 2 && <span className="absolute right-3 text-cyan-300">→</span>}</div>)}</div>)}</div></div></div></section>

      <section id="seguranca" className="bg-white py-16 lg:py-24"><div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.75fr_1.25fr] lg:px-8"><div><ShieldCheck className="h-7 w-7 text-cyan-700" /><p className="mt-7 text-xs font-bold uppercase tracking-[.17em] text-cyan-800">Segurança e controlo</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#082755] sm:text-4xl">Segurança e controlo desde a arquitectura.</h2></div><div className="grid border-l border-t border-slate-200 sm:grid-cols-2">{[[LockKeyhole, 'Dados separados por empresa'], [UsersRound, 'Controlo de acesso por função'], [FileText, 'Documentos autenticados'], [Check, 'Revisão humana em decisões sensíveis']].map(([Icon, title]) => { const ItemIcon = Icon as typeof LockKeyhole; return <div className="border-b border-r border-slate-200 p-6" key={title as string}><ItemIcon className="h-5 w-5 text-cyan-700" /><p className="mt-8 text-sm font-semibold text-slate-900">{title as string}</p></div>; })}</div></div></section>

      <section className="bg-[#f1f4f7] py-16 lg:py-24"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-cyan-800">Quem está por trás</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#082755] sm:text-4xl">Uma equipa a construir para a operação real.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-600">Pessoas que já faziam parte da história visual da Fiscalidade Digital.</p></div><div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">{team.map((member) => <figure key={member.name} className="group overflow-hidden bg-[#082755]"><Image src={member.image} alt={member.name} width={360} height={420} className="aspect-[4/5] w-full object-cover grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0" /><figcaption className="px-4 py-4 text-sm font-semibold text-white">{member.name}</figcaption></figure>)}</div></div></section>

      <section id="faq" className="mx-auto max-w-4xl px-5 py-16 lg:py-24"><p className="text-xs font-bold uppercase tracking-[.17em] text-cyan-800">FAQ</p><h2 className="mt-4 text-3xl font-semibold tracking-[-.04em] text-[#082755] sm:text-4xl">Perguntas antes de começar.</h2><div className="mt-10 border-y border-slate-300">{faqs.map(([question, answer], index) => { const isOpen = index === openFaq; return <div className="border-b border-slate-300 last:border-0" key={question}><button type="button" className="flex w-full items-center justify-between gap-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600" onClick={() => setOpenFaq(isOpen ? -1 : index)} aria-expanded={isOpen}><span className="text-sm font-semibold text-slate-900 sm:text-base">{question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && <p className="max-w-2xl pb-5 text-sm leading-6 text-slate-600">{answer}</p>}</div>; })}</div></section>

      <section className="bg-[#082755] text-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-16 sm:flex-row sm:items-end lg:px-8 lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-cyan-300">Fiscalidade Digital</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Organize a operação fiscal da sua empresa num único lugar.</h2></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-5 py-3 text-sm font-bold text-[#062247] transition hover:bg-cyan-300">Criar conta <ArrowRight className="h-4 w-4" /></Link><Link href="/login" className="inline-flex items-center justify-center border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Entrar</Link></div></div></section>

      <footer className="bg-[#061a36] text-slate-300"><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="grid gap-9 border-b border-white/15 pb-10 sm:grid-cols-2 lg:grid-cols-4"><div><Brand inverse /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Gestão fiscal e operacional organizada para empresas em Angola.</p></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Produto</p><div className="mt-4 grid gap-3 text-sm"><a href="#produto">Plataforma</a><a href="#como-funciona">Como funciona</a><a href="#seguranca">Segurança</a></div></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Conta</p><div className="mt-4 grid gap-3 text-sm"><Link href="/login">Entrar</Link><Link href="/register">Criar conta</Link></div></div><div><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Legal</p><div className="mt-4 grid gap-3 text-sm"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link></div></div></div><div className="flex flex-col gap-2 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} Fiscalidade Digital</span><span>Angola</span></div></div></footer>
    </main>
  );
}
