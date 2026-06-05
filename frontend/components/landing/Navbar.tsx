'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  Building2,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(
        window.scrollY > 30,
      );
    };

    window.addEventListener(
      'scroll',
      handleScroll,
    );

    return () =>
      window.removeEventListener(
        'scroll',
        handleScroll,
      );
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
        duration-500
        ${
          scrolled
            ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-2xl'
            : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="h-20 flex items-center justify-between">

          <Link
            href="/"
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Building2
                className="text-white"
                size={24}
              />
            </div>

            <div>

              <h1 className="text-white font-bold text-xl">
                Fiscalidade Digital
              </h1>

              <p className="text-slate-400 text-xs">
                Plataforma Fiscal Inteligente
              </p>

            </div>

          </Link>

          {/* DESKTOP */}

          <nav className="hidden lg:flex items-center gap-10">

            <a
              href="#sobre"
              className="text-slate-300 hover:text-white transition"
            >
              Sobre
            </a>

            <a
              href="#modulos"
              className="text-slate-300 hover:text-white transition"
            >
              Módulos
            </a>

            <a
              href="#impacto"
              className="text-slate-300 hover:text-white transition"
            >
              Impacto
            </a>

            <a
              href="#faq"
              className="text-slate-300 hover:text-white transition"
            >
              FAQ
            </a>

          </nav>

          {/* CTA */}

          <div className="hidden lg:flex gap-3">

            <Link
              href="/login"
              className="
                px-5
                py-3
                rounded-xl
                border
                border-white/20
                text-white
                hover:bg-white/10
                transition
              "
            >
              Iniciar Sessão
            </Link>

            <Link
              href="/register"
              className="
                px-5
                py-3
                rounded-xl
                bg-blue-600
                hover:bg-blue-700
                text-white
                transition
                shadow-xl
                shadow-blue-600/30
              "
            >
              Registrar Empresa
            </Link>

          </div>

          {/* MOBILE */}

          <button
            className="lg:hidden text-white"
            onClick={() =>
              setMobileOpen(
                !mobileOpen,
              )
            }
          >
            {mobileOpen ? (
              <X size={28} />
            ) : (
              <Menu size={28} />
            )}
          </button>

        </div>

      </div>

      {/* MOBILE MENU */}

      {mobileOpen && (
        <div className="lg:hidden bg-slate-950 border-t border-white/10 p-6">

          <div className="flex flex-col gap-5">

            <a
              href="#sobre"
              className="text-slate-300"
            >
              Sobre
            </a>

            <a
              href="#modulos"
              className="text-slate-300"
            >
              Módulos
            </a>

            <a
              href="#impacto"
              className="text-slate-300"
            >
              Impacto
            </a>

            <a
              href="#faq"
              className="text-slate-300"
            >
              FAQ
            </a>

            <Link
              href="/login"
              className="text-white"
            >
              Iniciar Sessão
            </Link>

            <Link
              href="/register"
              className="
                bg-blue-600
                text-center
                py-3
                rounded-xl
                text-white
              "
            >
              Registrar Empresa
            </Link>

          </div>

        </div>
      )}
    </header>
  );
}