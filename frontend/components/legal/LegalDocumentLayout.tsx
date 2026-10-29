import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export type LegalSection = {
  id: string;
  title: string;
};

type LegalDocumentLayoutProps = {
  activeDocument: 'terms' | 'privacy';
  title: string;
  description: string;
  updatedAt: string;
  sections: readonly LegalSection[];
  children: ReactNode;
};

function DocumentLinks({ activeDocument }: Pick<LegalDocumentLayoutProps, 'activeDocument'>) {
  return (
    <nav aria-label="Documentos legais" className="flex items-center gap-4 text-sm font-semibold">
      <Link href="/terms" aria-current={activeDocument === 'terms' ? 'page' : undefined} className={`transition hover:text-cyan-800 ${activeDocument === 'terms' ? 'text-[#102447] underline decoration-cyan-500 decoration-2 underline-offset-4' : 'text-slate-600'}`}>Termos</Link>
      <Link href="/privacy" aria-current={activeDocument === 'privacy' ? 'page' : undefined} className={`transition hover:text-cyan-800 ${activeDocument === 'privacy' ? 'text-[#102447] underline decoration-cyan-500 decoration-2 underline-offset-4' : 'text-slate-600'}`}>Privacidade</Link>
    </nav>
  );
}

function Contents({ sections, className = '' }: { sections: readonly LegalSection[]; className?: string }) {
  return (
    <nav aria-label="Índice do documento" className={className}>
      <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Neste documento</p>
      <ol className="mt-4 space-y-2 text-sm leading-5">
        {sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="block rounded-md px-2 py-1.5 text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">{section.title}</a></li>)}
      </ol>
    </nav>
  );
}

export default function LegalDocumentLayout({ activeDocument, title, description, updatedAt, sections, children }: LegalDocumentLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5 py-4 lg:px-8">
          <Link href="/" className="inline-flex rounded-lg bg-white p-1" aria-label="Fiscalidade Digital — voltar ao site">
            <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={162} height={48} className="h-9 w-auto object-contain" priority />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <DocumentLinks activeDocument={activeDocument} />
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <Link href="/" className="hidden text-sm font-semibold text-slate-600 transition hover:text-cyan-800 sm:inline">Voltar ao site</Link>
            <Link href="/register" className="rounded-lg bg-[#102447] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#17365f]">Criar conta</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:py-14 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-800">Fiscalidade Digital</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-.035em] text-[#102447] sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
          <p className="mt-5 text-sm text-slate-500">Última actualização: {updatedAt}</p>
        </div>

        <details className="mt-8 rounded-xl border border-slate-200 bg-white p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-bold text-[#102447]">Ver índice do documento</summary>
          <Contents sections={sections} className="mt-4" />
        </details>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block"><Contents sections={sections} className="sticky top-8" /></aside>
          <article className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,35,68,.05)] sm:p-10">
            <div className="space-y-10 text-[0.98rem] leading-7 text-slate-700">{children}</div>
          </article>
        </div>

        <footer className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-200 pt-6 text-sm font-semibold">
          <Link href="/" className="text-[#0b6f93] underline-offset-4 hover:underline">Voltar ao site</Link>
          <Link href="/register" className="text-[#0b6f93] underline-offset-4 hover:underline">Criar conta</Link>
          <Link href={activeDocument === 'terms' ? '/privacy' : '/terms'} className="text-[#0b6f93] underline-offset-4 hover:underline">{activeDocument === 'terms' ? 'Política de Privacidade' : 'Termos de Utilização'}</Link>
        </footer>
      </div>
    </main>
  );
}
