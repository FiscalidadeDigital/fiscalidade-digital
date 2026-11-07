'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header
      className="
        sticky
        top-0
        z-50
        w-full
        bg-white/95
        backdrop-blur-xl
        border-b
        border-slate-200
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          h-20
          px-6
          lg:px-8
          flex
          items-center
          justify-between
        "
      >

        {/* =========================================
            LOGO
        ========================================== */}

        <Link
          href="/"
          className="
            flex
            items-center
            gap-3
            shrink-0
          "
        >

          <div
            className="
              relative
              w-12
              h-12
              flex
              items-center
              justify-center
            "
          >
            <Image
              src="/logofiscalidade.png"
              alt="Fiscalidade Digital"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="hidden sm:block">

            <h1
              className="
                text-lg
                font-black
                tracking-tight
                text-slate-900
              "
            >
              Fiscalidade Digital
            </h1>

            <p
              className="
                text-[11px]
                text-slate-500
                mt-0.5
              "
            >
              Sistema Inteligente de Gestão Fiscal
            </p>

          </div>

        </Link>

        {/* =========================================
            NAVEGAÇÃO
        ========================================== */}

        <nav
          className="
            hidden
            lg:flex
            items-center
            gap-8
          "
        >

          <a
            href="#sobre"
            className="
              text-sm
              font-medium
              text-slate-600
              hover:text-fd-accent
              transition-colors
            "
          >
            Sobre
          </a>

          <a
            href="#funcionalidades"
            className="
              text-sm
              font-medium
              text-slate-600
              hover:text-fd-accent
              transition-colors
            "
          >
            Funcionalidades
          </a>

          <a
            href="#modulos"
            className="
              text-sm
              font-medium
              text-slate-600
              hover:text-fd-accent
              transition-colors
            "
          >
            Módulos
          </a>

          <a
            href="#faq"
            className="
              text-sm
              font-medium
              text-slate-600
              hover:text-fd-accent
              transition-colors
            "
          >
            FAQ
          </a>

        </nav>

        {/* =========================================
            AÇÕES
        ========================================== */}

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <Link
            href="/login"
            className="
              hidden
              sm:inline-flex
              items-center
              justify-center
              px-4
              py-2.5
              rounded-xl
              text-sm
              font-semibold
              text-slate-700
              hover:text-fd-accent
              hover:bg-slate-50
              transition-all
            "
          >
            Iniciar Sessão
          </Link>

          <Link
            href="/register"
            className="
              inline-flex
              items-center
              justify-center
              px-5
              py-2.5
              rounded-xl
              bg-fd-primary
              text-white
              text-sm
              font-semibold
              shadow-lg
              shadow-indigo-600/20
              hover:bg-fd-primary-hover
              hover:-translate-y-0.5
              transition-all
            "
          >
            Criar Conta
          </Link>

        </div>

      </div>
    </header>
  );
}