import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
      <div className={`mx-auto grid min-h-[calc(100dvh-2rem)] overflow-hidden border border-[var(--fd-border)] bg-white xl:grid-cols-[minmax(340px,.78fr)_1.22fr] ${wide ? 'max-w-6xl' : 'max-w-[1120px]'}`}>
        <aside aria-label="Sobre a Fiscalidade Digital" className="hidden border-r border-[var(--fd-border)] bg-[var(--fd-surface-muted)] px-10 py-12 xl:flex xl:flex-col">
          <Link href="/" className="inline-flex w-fit" aria-label="Fiscalidade Digital - início">
            <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={162} height={48} className="h-10 w-auto object-contain" priority />
          </Link>
          <div className="mt-auto border-y border-[var(--fd-border)] py-8">
            <p className="text-sm font-medium text-fd-accent">Fiscalidade Digital</p>
            <h2 className="mt-4 max-w-sm text-[2rem] font-bold leading-tight text-[var(--fd-text-primary)]">Prazos fiscais sob controlo. Empresa organizada.</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--fd-text-secondary)]">Acompanhe a informação essencial da empresa num espaço de trabalho claro.</p>
          </div>
          <p className="mt-7 text-xs leading-5 text-[var(--fd-text-secondary)]">Feito para apoiar empresas em Angola.</p>
        </aside>

        <section className="flex items-center p-5 sm:p-9 xl:p-12">
          <div className="mx-auto w-full max-w-lg">
            <Link href="/" className="mb-8 inline-flex xl:hidden" aria-label="Fiscalidade Digital - início">
              <Image src="/logofiscalidade.png" alt="Fiscalidade Digital" width={162} height={48} className="h-8 w-auto object-contain" priority />
            </Link>
            <Link href={backHref} className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--fd-text-secondary)] underline-offset-4 hover:text-fd-accent hover:underline">
              <ArrowLeft size={16} />
              {backLabel}
            </Link>
            <p className="text-sm font-medium text-fd-accent">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-normal text-[var(--fd-text-primary)]">{title}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--fd-text-secondary)]">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
