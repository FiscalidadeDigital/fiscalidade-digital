import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CalendarClock, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthFrameProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  wide?: boolean;
};

export default function AuthFrame({
  eyebrow = 'Fiscalidade Digital',
  title,
  description,
  children,
  backHref = '/login',
  backLabel = 'Voltar ao início de sessão',
  wide = false,
}: AuthFrameProps) {
  return (
    <main className="fd-auth-page min-h-[100dvh] bg-[var(--fd-page)] p-4 text-[var(--fd-text-primary)] sm:p-6 lg:p-8">
      <div className={`mx-auto grid min-h-[calc(100dvh-2rem)] overflow-hidden rounded-fd-card-large border border-[var(--fd-border)] bg-white shadow-[0_24px_70px_rgba(15,35,68,.10)] xl:grid-cols-[minmax(390px,.82fr)_1.18fr] ${wide ? 'max-w-6xl' : 'max-w-[1180px]'}`}>
        <aside aria-label="Sobre a Fiscalidade Digital" className="hidden bg-fd-primary p-10 text-white xl:flex xl:flex-col xl:justify-between">
          <div>
            <Link href="/" className="inline-flex rounded-fd-field bg-white px-3 py-2 shadow-sm" aria-label="Fiscalidade Digital — início">
              <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={162} height={48} className="h-10 w-auto object-contain" priority />
            </Link>
            <h2 className="mt-12 max-w-md text-[2rem] font-semibold leading-tight tracking-tight">Prazos fiscais sob controlo. Empresa organizada.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-200">Acompanhe a informação essencial da empresa num espaço de trabalho claro e preparado para o dia a dia.</p>
            <div className="fd-auth-demo-card mt-9 max-w-sm rounded-fd-card border border-white/15 bg-white/10 p-4 shadow-[0_16px_34px_rgba(4,17,38,.2)]">
              <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-cyan-200">Exemplo fictício</p>
              <div className="mt-3 flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-fd-field bg-white/10 text-cyan-200"><CalendarClock size={19} /></span>
                <div>
                  <p className="text-sm font-semibold text-white">Prazo fiscal de demonstração</p>
                  <p className="mt-1 text-xs leading-5 text-slate-200">Declaração de exemplo — 15 de abril</p>
                </div>
              </div>
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-200"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />Desenvolvido para apoiar empresas em Angola.</p>
        </aside>
        <section className="flex items-center p-5 sm:p-9 xl:p-12">
          <div className="mx-auto w-full max-w-lg">
            <Link href="/" className="mb-6 inline-flex min-h-11 items-center rounded-fd-field border border-[var(--fd-border)] bg-white px-3 py-2 shadow-sm xl:hidden" aria-label="Fiscalidade Digital — início">
              <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={162} height={48} className="h-8 w-auto object-contain" priority />
            </Link>
            <Link href={backHref} className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--fd-text-secondary)] underline-offset-4 hover:text-fd-accent hover:underline"><ArrowLeft size={16} />{backLabel}</Link>
            <p className="text-xs font-semibold uppercase tracking-[.12em] text-fd-accent">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--fd-text-primary)]">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--fd-text-secondary)]">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
