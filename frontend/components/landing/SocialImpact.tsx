'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PremiumCTA() {
  return (
    <section className="py-24 lg:py-28 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-slate-900
            px-7
            py-14
            lg:px-16
            lg:py-16
          "
        >

          {/* detalhe discreto */}

          <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl" />

          <div className="relative max-w-3xl">

            <span className="text-sm font-semibold text-blue-300">
              Fiscalidade Digital
            </span>

            <h2 className="mt-4 text-4xl lg:text-5xl font-bold leading-tight text-white">
              Tenha a gestão fiscal da sua empresa num só lugar.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Organize facturação, obrigações, impostos e relatórios
              sem depender de informação espalhada por diferentes ferramentas.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="/register"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-6
                  py-3.5
                  font-semibold
                  text-white
                  hover:bg-blue-500
                  transition-colors
                "
              >
                Criar conta
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/login"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/15
                  px-6
                  py-3.5
                  font-semibold
                  text-white
                  hover:bg-white/10
                  transition-colors
                "
              >
                Iniciar sessão
              </Link>

            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <span>Acesso online</span>
              <span>•</span>
              <span>Gestão centralizada</span>
              <span>•</span>
              <span>Para empresas</span>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}