'use client';

import { motion } from 'framer-motion';

import {
  TrendingUp,
  DollarSign,
  BellRing,
  ShieldCheck,
  Receipt,
  BarChart3,
} from 'lucide-react';

export default function HeroDashboard() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -15, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="relative"
    >
      {/* Glow */}

      <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-[40px]" />

      {/* Main Card */}

      <div
        className="
          relative
          bg-white
          rounded-[40px]
          border
          border-slate-100
          shadow-[0_40px_120px_rgba(0,0,0,0.25)]
          p-8
        "
      >
        {/* Header */}

        <div className="flex items-center justify-between mb-8">

          <div>

            <h3 className="text-3xl font-black text-slate-900">
              Dashboard Executivo
            </h3>

            <p className="text-slate-500">
              Fiscalidade Digital
            </p>

          </div>

          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
            <BarChart3 size={28} />
          </div>

        </div>

        {/* KPI Cards */}

        <div className="grid grid-cols-2 gap-5 mb-8">

          <div className="bg-blue-50 rounded-3xl p-5 hover:scale-105 transition-all">

            <DollarSign
              size={28}
              className="text-blue-600 mb-3"
            />

            <div className="text-slate-500 text-sm">
              Facturação
            </div>

            <div className="text-3xl font-black text-blue-700">
              12.5M
            </div>

            <div className="text-green-600 text-sm mt-2">
              +18.4%
            </div>

          </div>

          <div className="bg-green-50 rounded-3xl p-5 hover:scale-105 transition-all">

            <TrendingUp
              size={28}
              className="text-green-600 mb-3"
            />

            <div className="text-slate-500 text-sm">
              IVA Declarado
            </div>

            <div className="text-3xl font-black text-green-700">
              1.7M
            </div>

            <div className="text-green-600 text-sm mt-2">
              +12.8%
            </div>

          </div>

          <div className="bg-orange-50 rounded-3xl p-5 hover:scale-105 transition-all">

            <BellRing
              size={28}
              className="text-orange-600 mb-3"
            />

            <div className="text-slate-500 text-sm">
              Obrigações
            </div>

            <div className="text-3xl font-black text-orange-700">
              5
            </div>

            <div className="text-orange-600 text-sm mt-2">
              Pendentes
            </div>

          </div>

          <div className="bg-red-50 rounded-3xl p-5 hover:scale-105 transition-all">

            <ShieldCheck
              size={28}
              className="text-red-600 mb-3"
            />

            <div className="text-slate-500 text-sm">
              Alertas
            </div>

            <div className="text-3xl font-black text-red-700">
              2
            </div>

            <div className="text-red-600 text-sm mt-2">
              Urgentes
            </div>

          </div>

        </div>

        {/* Fake Graph */}

        <div className="bg-slate-50 rounded-3xl p-6">

          <div className="flex justify-between mb-6">

            <div>

              <h4 className="font-bold text-slate-900">
                Evolução Financeira
              </h4>

              <p className="text-slate-500 text-sm">
                Últimos 6 meses
              </p>

            </div>

            <Receipt
              className="text-blue-600"
              size={22}
            />

          </div>

          <div className="flex items-end gap-3 h-40">

            <div className="bg-blue-200 rounded-t-xl h-16 flex-1" />
            <div className="bg-blue-300 rounded-t-xl h-20 flex-1" />
            <div className="bg-blue-400 rounded-t-xl h-24 flex-1" />
            <div className="bg-blue-500 rounded-t-xl h-32 flex-1" />
            <div className="bg-blue-600 rounded-t-xl h-28 flex-1" />
            <div className="bg-blue-700 rounded-t-xl h-40 flex-1" />

          </div>

        </div>

      </div>

      {/* Floating Card 1 */}

      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="
          absolute
          -left-12
          top-20
          bg-white
          rounded-2xl
          shadow-xl
          px-5
          py-4
          hidden
          lg:block
        "
      >
        <div className="text-xs text-slate-500">
          Receita Mensal
        </div>

        <div className="font-black text-green-600 text-xl">
          +32%
        </div>
      </motion.div>

      {/* Floating Card 2 */}

      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
        className="
          absolute
          -right-10
          bottom-24
          bg-white
          rounded-2xl
          shadow-xl
          px-5
          py-4
          hidden
          lg:block
        "
      >
        <div className="text-xs text-slate-500">
          Conformidade Fiscal
        </div>

        <div className="font-black text-blue-600 text-xl">
          98%
        </div>
      </motion.div>

    </motion.div>
  );
}