'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PremiumCTA() {
  return (
    <section className="relative overflow-hidden py-36 bg-slate-950 text-white">

      {/* BACKGROUND */}

      <div className="absolute inset-0">

        <div className="absolute -top-40 left-0 w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-[180px]" />

        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-cyan-500/20 rounded-full blur-[180px]" />

        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2" />

      </div>

      {/* GRID */}

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-12 lg:p-20">

          <div className="text-center">

            <span className="inline-flex px-5 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-semibold">
              Plataforma Fiscal Inteligente
            </span>

            <h2 className="mt-8 text-5xl lg:text-7xl font-black leading-tight">

              Transforme a Gestão Fiscal
              <span className="block text-blue-500">
                da Sua Empresa
              </span>

            </h2>

            <p className="mt-8 text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">

              Automatize obrigações fiscais,
              acompanhe impostos em tempo real,
              elimine processos manuais
              e tenha controlo total da sua empresa
              numa única plataforma moderna.

            </p>

            {/* STATS */}

            <div className="grid md:grid-cols-3 gap-8 mt-14">

              <div>

                <div className="text-5xl font-black text-blue-400">
                  500+
                </div>

                <div className="text-slate-400 mt-2">
                  Empresas
                </div>

              </div>

              <div>

                <div className="text-5xl font-black text-green-400">
                  25K+
                </div>

                <div className="text-slate-400 mt-2">
                  Declarações
                </div>

              </div>

              <div>

                <div className="text-5xl font-black text-orange-400">
                  98%
                </div>

                <div className="text-slate-400 mt-2">
                  Conformidade
                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="flex flex-wrap justify-center gap-5 mt-14">

              <Link
                href="/register"
                className="
                  px-10
                  py-5
                  rounded-2xl
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  font-bold
                  text-lg
                  shadow-[0_20px_60px_rgba(37,99,235,.45)]
                  hover:scale-105
                  transition-all
                "
              >
                Registrar Empresa
              </Link>

              <Link
                href="/login"
                className="
                  px-10
                  py-5
                  rounded-2xl
                  bg-white
                  text-slate-900
                  font-bold
                  text-lg
                  flex
                  items-center
                  gap-3
                  hover:scale-105
                  transition-all
                "
              >
                Iniciar Sessão

                <ArrowRight size={20} />
              </Link>

            </div>

            <p className="mt-8 text-slate-400 text-sm">
              Sem instalação • Acesso online • Seguro • Escalável
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}