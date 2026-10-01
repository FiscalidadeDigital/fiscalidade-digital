'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  FileScan,
  FileText,
  LockKeyhole,
  Menu,
  ReceiptText,
  ShieldCheck,
  X,
} from 'lucide-react';

const navigation = [
  { label: 'Produto', href: '#produto' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Segurança', href: '#seguranca' },
  { label: 'FAQ', href: '#faq' },
];

const productAreas = [
  {
    title: 'Obrigações fiscais',
    detail: 'Calendário, prazos e acompanhamento das obrigações registadas para a empresa.',
    icon: CalendarDays,
  },
  {
    title: 'Facturação',
    detail: 'Gestão operacional de facturas emitidas e propostas comerciais no mesmo ambiente.',
    icon: ReceiptText,
  },
  {
    title: 'Facturas recebidas',
    detail: 'Importe documentos de fornecedores, reveja os dados e registe a informação confirmada.',
    icon: FileScan,
  },
  {
    title: 'Documentos privados',
    detail: 'Arquivo associado à empresa para manter os documentos de trabalho organizados.',
    icon: FileText,
  },
  {
    title: 'Alertas',
    detail: 'Acompanhe prazos, pendências e pontos que exigem atenção.',
    icon: Bell,
  },
  {
    title: 'Simuladores e relatórios',
    detail: 'Ferramentas disponíveis para apoiar a leitura da operação e a preparação do trabalho.',
    icon: Building2,
  },
];

const workflow = [
  ['01', 'Centralize', 'Documentos, empresas e operações num espaço de trabalho organizado.'],
  ['02', 'Acompanhe', 'Obrigações, prazos e alertas numa visão contínua da actividade.'],
  ['03', 'Reveja', 'Dados de facturas recebidas antes de os transformar em registos.'],
  ['04', 'Decida', 'Consulte o que está pendente e prepare os próximos passos.'],
];

const safeguards = [
  ['Dados separados por empresa', 'A informação é organizada por empresa para apoiar a separação das operações.'],
  ['Acesso autenticado', 'O acesso à plataforma depende de uma sessão válida.'],
  ['Documentos privados', 'Os documentos são tratados como conteúdo privado da empresa.'],
  ['Perfis e permissões', 'As operações são orientadas pelos perfis disponíveis na conta.'],
  ['Rastreabilidade', 'Registos importantes mantêm contexto para revisão operacional.'],
];

const faqs = [
  ['O que é a Fiscalidade Digital?', 'É uma plataforma para organizar facturação, documentos, obrigações e acompanhamento fiscal das empresas em Angola.'],
  ['Para quem é indicada?', 'Para empresas e equipas que precisam de reunir a informação fiscal e operacional num só ambiente de trabalho.'],
  ['Posso gerir mais de uma empresa?', 'A plataforma prevê gestão por empresa. A disponibilidade concreta depende da configuração e das permissões da sua conta.'],
  ['Os documentos ficam privados?', 'Os documentos são associados à empresa e o acesso é feito através da plataforma autenticada.'],
  ['Como funciona a importação de facturas?', 'Carregue o documento, reveja os dados extraídos quando existirem e confirme manualmente antes de registar a factura recebida.'],
  ['Posso acompanhar obrigações fiscais?', 'Sim. O módulo de obrigações permite acompanhar períodos, prazos e estados registados na plataforma.'],
];

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="Fiscalidade Digital — início">
      <img src="/logofiscalidade.png" alt="" className="h-9 w-auto" />
      <span className="hidden text-sm font-bold tracking-tight text-slate-950 sm:block">Fiscalidade Digital</span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:p-4">
      <div className="flex items-center justify-between border-b border-slate-200 px-2 pb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <span>Visão operacional</span><span className="text-sky-700">Empresa activa</span>
      </div>
      <div className="grid gap-3 pt-3 sm:grid-cols-[1.2fr_.8fr]">
        <section className="border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-950">Próximas acções</p>
          <div className="mt-4 space-y-3">
            {['Rever factura recebida', 'Confirmar informação de documento', 'Acompanhar obrigação do período'].map((item, index) => (
              <div className="flex items-start gap-3" key={item}>
                <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border text-[10px] font-bold ${index === 0 ? 'border-sky-700 bg-sky-700 text-white' : 'border-slate-300 text-slate-500'}`}>{index + 1}</span>
                <div><p className="text-xs font-medium text-slate-800">{item}</p><p className="mt-1 text-[11px] text-slate-500">Em acompanhamento</p></div>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-slate-950 p-4 text-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300">Documentos</p>
          <p className="mt-3 text-lg font-semibold">Revisão antes do registo.</p>
          <p className="mt-3 text-xs leading-5 text-slate-300">Importe uma factura, confira os dados propostos e mantenha a decisão final na sua equipa.</p>
          <div className="mt-6 border-t border-slate-700 pt-3 text-[11px] text-slate-300">Dados privados por empresa</div>
        </section>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <main className="min-h-screen bg-[#f7f8fa] font-sans text-slate-950">
      <style jsx global>{`
        @keyframes fd-landing-enter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fd-landing-enter { animation: fd-landing-enter 600ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .fd-landing-enter { animation: none; } }
      `}</style>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#f7f8fa]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
            {navigation.map((item) => <a key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-950">{item.label}</a>)}
          </nav>
          <div className="hidden items-center gap-4 lg:flex"><Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Entrar</Link><Link href="/register" className="inline-flex items-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800">Começar agora <ArrowRight className="h-4 w-4" /></Link></div>
          <button type="button" className="grid h-10 w-10 place-items-center border border-slate-300 lg:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && <nav className="border-t border-slate-200 bg-[#f7f8fa] px-5 py-5 lg:hidden" aria-label="Navegação móvel"><div className="mx-auto grid max-w-7xl gap-1">{navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="border-b border-slate-200 py-3 text-sm font-semibold text-slate-800">{item.label}</a>)}<Link href="/login" className="pt-4 text-sm font-semibold text-slate-700">Entrar</Link><Link href="/register" className="mt-3 inline-flex w-fit items-center gap-2 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Começar agora <ArrowRight className="h-4 w-4" /></Link></div></nav>}
      </header>

      <section className="border-b border-slate-200">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28">
          <div className="fd-landing-enter self-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">Fiscalidade Digital · Angola</p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">Fiscalidade empresarial, organizada num só lugar.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">Acompanhe obrigações, facturação, documentos e alertas com uma visão mais clara da operação da sua empresa.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 bg-sky-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900">Começar agora <ArrowRight className="h-4 w-4" /></Link><a href="#como-funciona" className="inline-flex items-center justify-center border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-950">Ver como funciona</a></div>
            <p className="mt-5 text-xs leading-5 text-slate-500">Pensado para a realidade fiscal das empresas em Angola.</p>
          </div>
          <div className="fd-landing-enter [animation-delay:120ms]"><ProductPreview /></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[.78fr_1.22fr] lg:px-8 lg:py-24">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">O dia a dia</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Quando tudo está disperso, os prazos deixam de estar visíveis.</h2></div>
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">{['Prazos fiscais espalhados por folhas e mensagens.', 'Documentos difíceis de localizar no momento certo.', 'Facturação separada do acompanhamento fiscal.', 'Pendências descobertas tarde demais.'].map((item) => <p key={item} className="border-t border-slate-300 pt-4 text-sm leading-6 text-slate-600">{item}</p>)}</div>
      </section>

      <section id="produto" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">Produto</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">O trabalho fiscal e operacional, na mesma conversa.</h2><p className="mt-4 text-base leading-7 text-slate-600">Uma estrutura de produto para acompanhar o que foi emitido, recebido, guardado e o que requer acção.</p></div><div className="mt-12 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-3">{productAreas.map((area) => { const Icon = area.icon; return <article key={area.title} className="min-h-52 border-b border-r border-slate-200 p-6 transition hover:bg-slate-50"><Icon className="h-5 w-5 text-sky-800" /><h3 className="mt-8 text-lg font-semibold text-slate-950">{area.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{area.detail}</p></article>; })}</div></div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">Como funciona</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Um processo claro para o trabalho que se repete todos os meses.</h2></div><ol className="border-t border-slate-300">{workflow.map(([number, title, detail]) => <li key={number} className="grid gap-3 border-b border-slate-300 py-5 sm:grid-cols-[4rem_1fr_1.3fr]"><span className="text-xs font-bold tracking-[0.12em] text-sky-800">{number}</span><h3 className="font-semibold text-slate-950">{title}</h3><p className="text-sm leading-6 text-slate-600">{detail}</p></li>)}</ol></div>
        <div className="mt-14 border-y border-slate-200 py-10 lg:mt-20"><div className="grid gap-8 md:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">Facturas recebidas</p><h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">Importe uma factura. Reveja os dados. Registe.</h3></div><div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold text-slate-700"><span className="border border-slate-300 px-2 py-4">Upload</span><span className="border border-slate-300 px-2 py-4">Extracção</span><span className="border border-slate-300 px-2 py-4">Revisão</span><span className="border border-slate-950 bg-slate-950 px-2 py-4 text-white">Confirmação</span></div></div><p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">A extracção facilita o preenchimento. A revisão humana mantém a confirmação do documento sob controlo da sua equipa.</p></div>
      </section>

      <section id="seguranca" className="bg-slate-950 text-white"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24"><div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr]"><div><ShieldCheck className="h-6 w-6 text-sky-300" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Segurança e controlo</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Uma base de trabalho feita para informação sensível.</h2><p className="mt-5 max-w-md text-base leading-7 text-slate-300">O produto organiza dados empresariais e documentos com controlo de acesso e separação por empresa.</p></div><div className="divide-y divide-slate-700 border-y border-slate-700">{safeguards.map(([title, detail]) => <div key={title} className="grid gap-3 py-5 sm:grid-cols-[1fr_1.25fr]"><h3 className="text-sm font-semibold text-white">{title}</h3><p className="text-sm leading-6 text-slate-300">{detail}</p></div>)}</div></div></div></section>

      <section id="faq" className="mx-auto max-w-4xl px-5 py-16 lg:py-24"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">FAQ</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Perguntas antes de começar.</h2></div><div className="mt-10 border-y border-slate-300">{faqs.map(([question, answer], index) => { const isOpen = index === openFaq; return <div key={question} className="border-b border-slate-300 last:border-0"><button type="button" className="flex w-full items-center justify-between gap-5 py-5 text-left" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? -1 : index)}><span className="text-sm font-semibold text-slate-900 sm:text-base">{question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && <p className="max-w-2xl pb-5 text-sm leading-6 text-slate-600">{answer}</p>}</div>; })}</div></section>

      <section className="border-y border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 py-14 sm:flex-row sm:items-end lg:px-8 lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-800">Fiscalidade Digital</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">Menos tempo à procura de informação. Mais controlo sobre a operação fiscal.</h2></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-2 bg-sky-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900">Começar agora <ArrowRight className="h-4 w-4" /></Link><Link href="/login" className="inline-flex items-center justify-center border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-950">Entrar na plataforma</Link></div></div></section>

      <footer className="mx-auto max-w-7xl px-5 py-10 lg:px-8"><div className="grid gap-9 border-b border-slate-200 pb-10 sm:grid-cols-2 lg:grid-cols-4"><div><Brand /><p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">Gestão fiscal e operacional organizada para empresas em Angola.</p></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Produto</p><div className="mt-4 grid gap-3 text-sm text-slate-600"><a href="#produto">Funcionalidades</a><a href="#como-funciona">Como funciona</a><a href="#seguranca">Segurança</a></div></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Conta</p><div className="mt-4 grid gap-3 text-sm text-slate-600"><Link href="/login">Entrar</Link><Link href="/register">Começar agora</Link></div></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Legal</p><div className="mt-4 grid gap-3 text-sm text-slate-600"><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link></div></div></div><div className="flex flex-col gap-2 pt-6 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} Fiscalidade Digital</span><span>Angola</span></div></footer>
    </main>
  );
}
