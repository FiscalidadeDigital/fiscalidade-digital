'use client';

import {
  TrendingUp,
  BellRing,
  ShieldCheck,
  Receipt,
  BarChart3,
} from 'lucide-react';

export default function HeroDashboard() {
  return (
    <div className="relative">

      {/* sombra de fundo */}

      <div className="
        absolute
        inset-8
        bg-blue-200/30
        blur-3xl
        rounded-3xl
      " />

      {/* MOCKUP */}

      <div className="
        relative
        bg-white
        border
        border-slate-200
        rounded-2xl
        shadow-[0_24px_70px_rgba(15,23,42,0.12)]
        overflow-hidden
      ">

        {/* TOPBAR */}

        <div className="
          h-16
          px-6
          border-b
          border-slate-200
          flex
          items-center
          justify-between
          bg-white
        ">

          <div className="flex items-center gap-3">

            <div className="
              w-8
              h-8
              rounded-lg
              bg-blue-700
              flex
              items-center
              justify-center
              text-white
            ">
              <BarChart3 size={17} />
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900">
                Dashboard
              </div>

              <div className="text-[10px] text-slate-400">
                Visão geral
              </div>
            </div>

          </div>

          <div className="
            text-xs
            text-slate-500
            border
            border-slate-200
            rounded-md
            px-3
            py-1.5
          ">
            2026
          </div>

        </div>

        {/* CONTEÚDO */}

        <div className="p-6">

          <div className="mb-6">
            <p className="text-sm text-slate-500">
              Bom dia
            </p>

            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Situação fiscal
            </h3>
          </div>

          {/* KPIs */}

          <div className="grid grid-cols-2 gap-4">

            <div className="
              border
              border-slate-200
              rounded-xl
              p-4
            ">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Facturação
                </span>

                <Receipt
                  size={17}
                  className="text-blue-600"
                />
              </div>

              <div className="text-2xl font-bold text-slate-900 mt-3">
                12,5M
              </div>

              <div className="text-xs text-emerald-600 mt-1">
                +18,4% este período
              </div>
            </div>

            <div className="
              border
              border-slate-200
              rounded-xl
              p-4
            ">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  IVA declarado
                </span>

                <TrendingUp
                  size={17}
                  className="text-emerald-600"
                />
              </div>

              <div className="text-2xl font-bold text-slate-900 mt-3">
                1,7M
              </div>

              <div className="text-xs text-emerald-600 mt-1">
                +12,8% este período
              </div>
            </div>

            <div className="
              border
              border-slate-200
              rounded-xl
              p-4
            ">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Obrigações
                </span>

                <BellRing
                  size={17}
                  className="text-orange-500"
                />
              </div>

              <div className="text-2xl font-bold text-slate-900 mt-3">
                5
              </div>

              <div className="text-xs text-orange-600 mt-1">
                Pendentes
              </div>
            </div>

            <div className="
              border
              border-slate-200
              rounded-xl
              p-4
            ">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Conformidade
                </span>

                <ShieldCheck
                  size={17}
                  className="text-blue-600"
                />
              </div>

              <div className="text-2xl font-bold text-slate-900 mt-3">
                98%
              </div>

              <div className="text-xs text-blue-600 mt-1">
                Situação actual
              </div>
            </div>

          </div>

          {/* GRÁFICO */}

          <div className="
            mt-5
            border
            border-slate-200
            rounded-xl
            p-5
          ">

            <div className="flex items-center justify-between mb-5">

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Evolução financeira
                </h4>

                <p className="text-xs text-slate-500 mt-1">
                  Últimos seis meses
                </p>
              </div>

              <BarChart3
                size={18}
                className="text-slate-400"
              />

            </div>

            <div className="h-28 flex items-end gap-3">

              <div className="flex-1 bg-blue-100 rounded-t-md h-[38%]" />
              <div className="flex-1 bg-blue-200 rounded-t-md h-[48%]" />
              <div className="flex-1 bg-blue-300 rounded-t-md h-[55%]" />
              <div className="flex-1 bg-blue-400 rounded-t-md h-[68%]" />
              <div className="flex-1 bg-blue-500 rounded-t-md h-[62%]" />
              <div className="flex-1 bg-blue-600 rounded-t-md h-[84%]" />

            </div>

            <div className="
              mt-3
              flex
              justify-between
              text-[10px]
              text-slate-400
            ">
              <span>Jan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Abr</span>
              <span>Mai</span>
              <span>Jun</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}