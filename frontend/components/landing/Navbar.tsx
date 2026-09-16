'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`
        fixed
        top-0
        left-0
        right-0
        z-50
        transition-all
        duration-300
        ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm'
            : 'bg-white border-b border-slate-100'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="h-[76px] flex items-center justify-between">

          {/* LOGO */}

          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
          >
            <div className="w-11 h-11 flex items-center justify-center">
              <img
                src="/logofiscalidade.png"
                alt="Fiscalidade Digital"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-[17px] font-bold tracking-tight text-slate-900">
                Fiscalidade Digital
              </div>

              <div className="text-[11px] text-slate-500 mt-0.5">
                Gestão fiscal empresarial
              </div>
            </div>
          </Link>

          {/* NAVEGAÇÃO */}

          <nav className="hidden lg:flex items-center gap-8">
            <a
              href="#sobre"
              className="text-sm text-slate-600 hover:text-blue-700 transition-colors"
            >
              Sobre
            </a>

            <a
              href="#beneficios"
              className="text-sm text-slate-600 hover:text-blue-700 transition-colors"
            >
              Benefícios
            </a>

            <a
              href="#modulos"
              className="text-sm text-slate-600 hover:text-blue-700 transition-colors"
            >
              Módulos
            </a>

            <a
              href="#faq"
              className="text-sm text-slate-600 hover:text-blue-700 transition-colors"
            >
              Perguntas
            </a>
          </nav>

          {/* AÇÕES */}

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="
                px-4
                py-2.5
                text-sm
                font-medium
                text-slate-700
                hover:text-blue-700
                transition-colors
              "
            >
              Iniciar sessão
            </Link>

            <Link
              href="/register"
              className="
                px-5
                py-2.5
                rounded-lg
                bg-blue-700
                text-white
                text-sm
                font-semibold
                hover:bg-blue-800
                transition-colors
              "
            >
              Criar conta
            </Link>
          </div>

          {/* MOBILE */}

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-slate-700"
            aria-label="Abrir menu"
          >
            {mobileOpen ? (
              <X size={25} />
            ) : (
              <Menu size={25} />
            )}
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}

      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-6 py-6 flex flex-col gap-5">

            <a
              href="#sobre"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700"
            >
              Sobre
            </a>

            <a
              href="#beneficios"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700"
            >
              Benefícios
            </a>

            <a
              href="#modulos"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700"
            >
              Módulos
            </a>

            <a
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="text-slate-700"
            >
              Perguntas
            </a>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">

              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="text-center py-3 text-slate-700 font-medium"
              >
                Iniciar sessão
              </Link>

              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="text-center py-3 rounded-lg bg-blue-700 text-white font-semibold"
              >
                Criar conta
              </Link>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}