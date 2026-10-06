import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CalendarClock, Check, ShieldCheck } from 'lucide-react';
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

export default function AuthFrame({ eyebrow = 'Fiscalidade Digital', title, description, children, backHref = '/login', backLabel = 'Voltar ao início de sessão', wide = false }: AuthFrameProps) {
  return <main className="fd-auth-page min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6 sm:py-10"><div className={`mx-auto grid min-h-[calc(100vh-3rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,35,68,.10)] lg:grid-cols-[minmax(280px,.72fr)_1.28fr] ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}><aside className="hidden bg-[#102447] p-10 text-white lg:flex lg:flex-col lg:justify-between"><div><Link href="/" className="inline-flex items-center gap-3" aria-label="Fiscalidade Digital — início"><span className="rounded-lg bg-white p-1"><Image src="/logofiscalidade.png" alt="" width={150} height={44} className="h-9 w-auto object-contain" priority /></span><span className="text-sm font-extrabold">Fiscalidade Digital</span></Link><h2 className="mt-10 text-3xl font-semibold leading-tight">Gestão fiscal com mais clareza e controlo.</h2><p className="mt-4 text-sm leading-7 text-slate-300">Organize as obrigações da sua empresa, acompanhe os principais prazos fiscais e receba alertas antes dos vencimentos.</p><ul className="mt-7 space-y-3 text-sm text-slate-200"><li className="flex items-center gap-2"><Check size={16} className="text-cyan-300" />Obrigações fiscais organizadas</li><li className="flex items-center gap-2"><CalendarClock size={16} className="text-cyan-300" />Calendário e alertas fiscais</li><li className="flex items-center gap-2"><Check size={16} className="text-cyan-300" />Informação da empresa num só lugar</li></ul></div><p className="flex items-start gap-2 text-xs leading-5 text-slate-300"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />Desenvolvido para apoiar a gestão fiscal de empresas em Angola.</p></aside><section className="flex items-center p-5 sm:p-10 lg:p-14"><div className="mx-auto w-full max-w-lg"><Link href={backHref} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 underline-offset-4 hover:text-[#0b6f93] hover:underline"><ArrowLeft size={16} />{backLabel}</Link><p className="text-xs font-semibold uppercase tracking-[.12em] text-[#0b6f93]">{eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#102447]">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p><div className="mt-7">{children}</div></div></section></div></main>;
}
