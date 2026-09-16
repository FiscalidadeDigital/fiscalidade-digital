'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  ShieldCheck,
  Receipt,
  Users,
  Calculator,
  Library,
  FileText,
  Bell,
  Settings,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Empresa',
    href: '/company',
    icon: Building2,
  },
  {
    label: 'Calendário Fiscal',
    href: '/calendario',
    icon: CalendarDays,
  },
  {
    label: 'Obrigações',
    href: '/obrigacoes',
    icon: ShieldCheck,
  },
  {
    label: 'Facturação',
    href: '/facturacao',
    icon: Receipt,
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    label: 'Simulador Fiscal',
    href: '/simulador',
    icon: Calculator,
  },
  {
    label: 'Biblioteca Fiscal',
    href: '/biblioteca',
    icon: Library,
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: FileText,
  },
  {
    label: 'Alertas',
    href: '/alertas',
    icon: Bell,
  },
  {
    label: 'Definições',
    href: '/definicoes',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed
        left-0
        top-0
        z-50
        h-screen
        w-[300px]
        bg-[#07132f]
        text-white
        flex
        flex-col
      "
    >

      {/* LOGO */}
      <div className="h-[120px] px-6 flex items-center border-b border-white/10">

        <div className="flex items-center gap-4">

          <div
            className="
              w-12
              h-12
              rounded-2xl
              bg-white
              flex
              items-center
              justify-center
              shadow-lg
            "
          >
            <div className="text-blue-600 font-black text-lg">
              FD
            </div>
          </div>

          <div>
            <h1 className="text-xl font-black tracking-tight">
              Fiscalidade Digital
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Plataforma Fiscal Inteligente
            </p>
          </div>

        </div>

      </div>

      {/* MENU */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">

        <div className="space-y-2">

          {menuItems.map((item) => {

            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group
                  flex
                  items-center
                  gap-4
                  px-5
                  py-4
                  rounded-2xl
                  transition-all
                  duration-200
                  ${
                    active
                      ? `
                        bg-blue-600
                        text-white
                        shadow-lg
                        shadow-blue-900/30
                      `
                      : `
                        text-slate-300
                        hover:bg-white/10
                        hover:text-white
                      `
                  }
                `}
              >

                <Icon
                  size={21}
                  strokeWidth={1.8}
                  className={
                    active
                      ? 'text-white'
                      : 'text-slate-300 group-hover:text-white'
                  }
                />

                <span className="text-[15px] font-medium">
                  {item.label}
                </span>

              </Link>
            );

          })}

        </div>

      </nav>

      {/* EMPRESA / UTILIZADOR */}
      <div className="p-4 border-t border-white/10">

        <div
          className="
            rounded-2xl
            bg-white/5
            px-4
            py-4
            flex
            items-center
            justify-between
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-10
                h-10
                rounded-full
                bg-indigo-600
                flex
                items-center
                justify-center
                font-bold
              "
            >
              E
            </div>

            <div>

              <p className="font-semibold text-sm">
                Edgar&Filhos
              </p>

              <p className="text-xs text-slate-400">
                NIF: 5000123
              </p>

            </div>

          </div>

          <span className="text-slate-400">
            ⌄
          </span>

        </div>

      </div>

    </aside>
  );
}