'use client';

import {
  Building2,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import {
  clearAdminToken,
  getPlatformAdmin,
  PlatformAdmin,
} from '@/services/admin-api';

const navigation = [
  { href: '/admin/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Empresas', icon: Building2 },
  { href: '/admin/audit', label: 'Auditoria', icon: ListChecks },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getPlatformAdmin()
      .then((currentAdmin) => {
        if (!active) return;
        if (currentAdmin.mustChangePassword) {
          router.replace('/admin/login');
          return;
        }
        setAdmin(currentAdmin);
      })
      .catch(() => {
        if (active) {
          setError('A sessão administrativa expirou.');
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  function logout() {
    clearAdminToken();
    router.replace('/admin/login');
  }

  if (!admin && !error) {
    return (
      <main className="fd-theme-scope flex min-h-screen items-center justify-center bg-[var(--fd-background)] text-[var(--fd-text-primary)]">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" aria-label="A validar sessão administrativa" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="fd-theme-scope flex min-h-screen items-center justify-center bg-[var(--fd-background)] px-5 text-[var(--fd-text-primary)]">
        <section className="w-full max-w-md rounded-2xl border border-[var(--fd-border)] bg-[var(--fd-surface)] p-7 shadow-sm">
          <ShieldCheck className="h-7 w-7 text-rose-600" />
          <h1 className="mt-5 text-xl font-semibold">Sessão terminada</h1>
          <p className="mt-2 text-sm text-[var(--fd-text-secondary)]">{error}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-sky-200"
          >
            Voltar ao acesso administrativo
          </button>
        </section>
      </main>
    );
  }

  return (
    <div className="fd-theme-scope min-h-screen bg-[var(--fd-background)] text-[var(--fd-text-primary)] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-slate-800 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-6 lg:py-7">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Fiscalidade Digital</span>
              <span className="block text-[11px] text-slate-400">Administração SaaS</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            aria-label="Terminar sessão"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-4 pb-4 lg:block lg:space-y-1 lg:px-3 lg:pb-0" aria-label="Administração da plataforma">
          {navigation.map(({ href, label, icon: Icon }) => {
            const selected = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={selected ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-sky-500/15 text-sky-200'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-white/10 px-6 py-5 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:block">
          <p className="truncate text-xs font-medium text-slate-200">{admin?.name}</p>
          <p className="mt-1 truncate text-[11px] text-slate-500">Super Admin</p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 flex w-full items-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Terminar sessão
          </button>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
