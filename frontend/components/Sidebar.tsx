'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { motion } from 'framer-motion';

import {
  LayoutDashboard,
  FileText,
  Bell,
  CalendarDays,
  Calculator,
  History,
  Settings,
  Building2,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Obrigações',
      href: '/obligations',
      icon: FileText,
    },
    {
      name: 'Notificações',
      href: '/notifications',
      icon: Bell,
    },
    {
      name: 'Calendário Fiscal',
      href: '/calendar',
      icon: CalendarDays,
    },
    {
      name: 'Calculadora Fiscal',
      href: '/calculator',
      icon: Calculator,
    },
    {
      name: 'Histórico Fiscal',
      href: '/history',
      icon: History,
    },
    {
      name: 'Empresa',
      href: '/company',
      icon: Building2,
    },
    {
      name: 'Definições',
      href: '/settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      className="
        w-72
        min-h-screen
        bg-slate-950
        border-r
        border-slate-800
        shadow-2xl
      "
    >
      {/* LOGO */}

      <div className="p-6 border-b border-slate-800">

        <motion.div
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
          }}
          className="flex items-center gap-4"
        >
          <div
            className="
              w-14
              h-14
              rounded-2xl
              bg-gradient-to-r
              from-blue-600
              to-cyan-500
              flex
              items-center
              justify-center
              shadow-lg
            "
          >
            <Building2 size={28} />
          </div>

          <div>

            <h1 className="font-bold text-xl text-white">
              Fiscalidade Digital
            </h1>

            <p className="text-slate-400 text-sm">
              Plataforma Fiscal Angola
            </p>

          </div>

        </motion.div>

      </div>

      {/* MENU */}

      <nav className="p-4 space-y-2">

        {menu.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
            >
              <motion.div
                whileHover={{
                  x: 6,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className={`
                  flex
                  items-center
                  gap-4
                  px-4
                  py-3
                  rounded-2xl
                  transition-all
                  duration-300
                  group

                  ${
                    active
                      ? `
                        bg-gradient-to-r
                        from-blue-600
                        to-blue-500
                        text-white
                        shadow-lg
                        shadow-blue-900/40
                      `
                      : `
                        text-slate-300
                        hover:bg-slate-900
                        hover:text-white
                      `
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    transition-all
                    duration-300

                    ${
                      active
                        ? 'scale-110'
                        : 'group-hover:scale-110'
                    }
                  `}
                />

                <span className="font-medium">
                  {item.name}
                </span>

                {active && (
                  <div
                    className="
                      ml-auto
                      w-2
                      h-2
                      rounded-full
                      bg-white
                    "
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

      </nav>

      {/* FOOTER */}

      <div className="absolute bottom-6 left-6 right-6">

        <div
          className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-4
          "
        >
          <div className="text-xs text-slate-400">
            Fiscalidade Digital
          </div>

          <div className="text-sm font-semibold text-white mt-1">
            SaaS Fiscal Inteligente
          </div>

          <div className="text-xs text-slate-500 mt-2">
            Versão 1.0
          </div>
        </div>

      </div>

    </aside>
  );
}