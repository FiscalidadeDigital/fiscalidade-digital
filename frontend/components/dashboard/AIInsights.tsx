'use client';

import { motion } from 'framer-motion';

import {
  Bot,
  TrendingUp,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function AIInsights() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.5,
      }}
      className="
        relative
        overflow-hidden
        rounded-3xl
        bg-gradient-to-br
        from-blue-700
        via-blue-600
        to-cyan-500
        p-6
        text-white
        shadow-2xl
      "
    >
      <div
        className="
          absolute
          top-0
          right-0
          w-40
          h-40
          rounded-full
          bg-white/10
          blur-3xl
        "
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="
              w-14
              h-14
              rounded-2xl
              bg-white/20
              flex
              items-center
              justify-center
            "
          >
            <Bot size={30} />
          </div>

          <div>
            <h3 className="font-bold text-xl">
              Fiscal AI Copilot
            </h3>

            <p className="text-blue-100 text-sm">
              Inteligência fiscal em tempo real
            </p>
          </div>
        </div>

        <div className="space-y-3">

          <div className="flex gap-3 items-start">
            <AlertTriangle
              size={18}
              className="mt-1 text-yellow-300"
            />

            <div>
              <p className="font-medium">
                IVA vence em 3 dias
              </p>

              <p className="text-xs text-blue-100">
                Recomenda-se preparar a declaração.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <FileText
              size={18}
              className="mt-1 text-orange-300"
            />

            <div>
              <p className="font-medium">
                2 facturas pendentes
              </p>

              <p className="text-xs text-blue-100">
                Valor total: 650.000 AOA
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <TrendingUp
              size={18}
              className="mt-1 text-green-300"
            />

            <div>
              <p className="font-medium">
                Crescimento de 18%
              </p>

              <p className="text-xs text-blue-100">
                Comparado ao mês anterior.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle2
              size={18}
              className="mt-1 text-emerald-300"
            />

            <div>
              <p className="font-medium">
                Compliance Fiscal: 95%
              </p>

              <p className="text-xs text-blue-100">
                Empresa em conformidade.
              </p>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">

          <button
            className="
              bg-white
              text-blue-700
              font-semibold
              py-3
              rounded-xl
              hover:scale-105
              transition
            "
          >
            Gerar Relatório
          </button>

          <button
            className="
              bg-white/15
              backdrop-blur
              border
              border-white/20
              py-3
              rounded-xl
              font-semibold
              hover:bg-white/20
              transition
            "
          >
            Analisar Empresa
          </button>

        </div>

        <div
          className="
            mt-5
            flex
            items-center
            gap-2
            text-xs
            text-blue-100
          "
        >
          <Sparkles size={14} />
          Insights actualizados automaticamente
        </div>
      </div>
    </motion.div>
  );
}