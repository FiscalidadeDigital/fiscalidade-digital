'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Bell,
  Calculator,
  FileText,
  Users,
  Receipt,
  BookOpen,
  ShieldAlert,
  Settings,
  Bot,
} from 'lucide-react';

const links = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Empresa',
    href: '/company',
    icon: Building2,
  },
  {
    title: 'Calendário Fiscal',
    href: '/calendar',
    icon: CalendarDays,
  },
  {
    title: 'Obrigações',
    href: '/obligations',
    icon: ShieldAlert,
  },
  {
    title: 'Facturação',
    href: '/invoice',
    icon: Receipt,
  },
  {
    title: 'Clientes',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Simulador Fiscal',
    href: '/calculator',
    icon: Calculator,
  },
  {
    title: 'Biblioteca Fiscal',
    href: '/library',
    icon: BookOpen,
  },
  {
    title: 'Relatórios',
    href: '/reports',
    icon: FileText,
  },
  {
    title: 'Alertas',
    href: '/notifications',
    icon: Bell,
  },
  {
    title: 'Assistente IA',
    href: '/ai',
    icon: Bot,
  },
  {
    title: 'Definições',
    href: '/settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#07122e] text-white flex flex-col">

      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">
          Fiscalidade Digital
        </h1>

        <p className="text-slate-400 text-sm mt-1">
          Plataforma Fiscal Inteligente
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">

        {links.map((link) => {
          const active =
            pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
              flex
              items-center
              gap-3
              p-3
              rounded-xl
              transition
              ${
                active
                  ? 'bg-blue-600'
                  : 'hover:bg-slate-800'
              }
            `}
            >
              <link.icon size={18} />
              <span>{link.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}