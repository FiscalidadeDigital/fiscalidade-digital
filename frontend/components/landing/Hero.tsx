'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import HeroDashboard from './HeroDashboard';

import {
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* BACKGROUND */}

      <div className="absolute inset-0">

        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[180px]" />

        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[180px]" />

        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />

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

      {/* LINHAS */}

      <div className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-40" />

      <div className="absolute bottom-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40" />

      {/* PARTÍCULAS */}

      <div className="absolute top-32 left-20 w-3 h-3 rounded-full bg-blue-500 animate-pulse" />

      <div className="absolute top-60 right-40 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />

      <div className="absolute bottom-32 left-1/3 w-2 h-2 rounded-full bg-white animate-pulse" />

      <div className="relative max-w-7xl mx-auto px-6 pt-36 pb-24">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* ESQUERDA */}

          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
          >

            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 text-blue-300 mb-8">

              <Sparkles size={18} />

              Plataforma Fiscal Inteligente para Angola

            </div>

            <h1 className="text-6xl lg:text-7xl font-black text-white leading-tight">

              Modernize a

              <span className="block text-blue-500">
                Gestão Fiscal
              </span>

              da Sua Empresa

            </h1>

            <p className="text-slate-300 text-xl mt-8 leading-relaxed max-w-2xl">

              Automatize facturação,
              obrigações fiscais,
              declarações,
              impostos,
              relatórios e notificações
              numa única plataforma empresarial moderna.

            </p>

            <div className="flex flex-wrap gap-4 mt-10">

              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-semibold shadow-[0_20px_60px_rgba(37,99,235,.4)] transition-all hover:scale-105"
              >
                Registrar Empresa

                <ArrowRight size={20} />
              </Link>

              <Link
                href="/login"
                className="bg-white hover:bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105"
              >
                Iniciar Sessão
              </Link>

            </div>

            <div className="flex flex-wrap gap-10 mt-14">

              <div>
                <div className="text-4xl font-black text-white">
                  500+
                </div>

                <div className="text-slate-400">
                  Empresas
                </div>
              </div>

              <div>
                <div className="text-4xl font-black text-white">
                  25K+
                </div>

                <div className="text-slate-400">
                  Declarações
                </div>
              </div>

              <div>
                <div className="text-4xl font-black text-white">
                  98%
                </div>

                <div className="text-slate-400">
                  Conformidade
                </div>
              </div>

            </div>

          </motion.div>

          {/* DIREITA */}

          <HeroDashboard />

        </div>

      </div>

    </section>
  );
}