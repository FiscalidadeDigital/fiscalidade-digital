'use client';

import Link from 'next/link';

import {
  Calculator,
  CalendarPlus,
  Upload,
  FileText,
  ArrowUpRight,
} from 'lucide-react';

export default function QuickActions() {
  return (
    <section
      className="
        rounded-2xl
        border
        border-[#e5e9f2]
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-200
        hover:shadow-md
      "
    >
      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2
            className="
              text-[16px]
              font-bold
              tracking-tight
              text-[#111b3b]
            "
          >
            Ações Rápidas
          </h2>

          <p
            className="
              mt-1
              text-[11px]
              text-[#7b87a1]
            "
          >
            Aceda rapidamente às principais funções
          </p>
        </div>

        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-[#f0edff]
            text-[#5146e5]
          "
        >
          <ArrowUpRight
            size={18}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* =====================================================
          AÇÕES
      ===================================================== */}

      <div className="grid grid-cols-2 gap-3">

        {/* ===================================================
            SIMULAR IMPOSTOS
            IMPORTANTE:
            Vai para /simulator
            NÃO vai para /calculator
        =================================================== */}

        <Link
          href="/simulator"
          className="
            group
            flex
            min-h-[112px]
            flex-col
            justify-between
            rounded-2xl
            border
            border-[#ddd8ff]
            bg-[#faf9ff]
            p-4
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:border-[#b9b0ff]
            hover:bg-[#f5f3ff]
            hover:shadow-md
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#eeebff]
              text-[#5146e5]
              transition-transform
              duration-200
              group-hover:scale-105
            "
          >
            <Calculator
              size={19}
              strokeWidth={2}
            />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <span
              className="
                text-[11px]
                font-bold
                text-[#17213f]
              "
            >
              Simular Impostos
            </span>

            <ArrowUpRight
              size={14}
              className="
                text-[#8b82ed]
                transition-transform
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />
          </div>
        </Link>

        {/* ===================================================
            NOVA OBRIGAÇÃO
        =================================================== */}

        <Link
          href="/obligations"
          className="
            group
            flex
            min-h-[112px]
            flex-col
            justify-between
            rounded-2xl
            border
            border-[#ccefe0]
            bg-[#f7fffb]
            p-4
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:border-[#a7e5cd]
            hover:bg-[#effcf6]
            hover:shadow-md
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#e9faf2]
              text-[#059669]
              transition-transform
              duration-200
              group-hover:scale-105
            "
          >
            <CalendarPlus
              size={19}
              strokeWidth={2}
            />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <span
              className="
                text-[11px]
                font-bold
                text-[#17213f]
              "
            >
              Nova Obrigação
            </span>

            <ArrowUpRight
              size={14}
              className="
                text-[#34a978]
                transition-transform
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />
          </div>
        </Link>

        {/* ===================================================
            ENVIAR DOCUMENTO
        =================================================== */}

        <Link
          href="/documents"
          className="
            group
            flex
            min-h-[112px]
            flex-col
            justify-between
            rounded-2xl
            border
            border-[#ffe1c8]
            bg-[#fffaf5]
            p-4
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:border-[#ffc99f]
            hover:bg-[#fff6ed]
            hover:shadow-md
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#fff0df]
              text-[#ea580c]
              transition-transform
              duration-200
              group-hover:scale-105
            "
          >
            <Upload
              size={19}
              strokeWidth={2}
            />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <span
              className="
                text-[11px]
                font-bold
                text-[#17213f]
              "
            >
              Enviar Documento
            </span>

            <ArrowUpRight
              size={14}
              className="
                text-[#f28a4b]
                transition-transform
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />
          </div>
        </Link>

        {/* ===================================================
            GERAR RELATÓRIO
        =================================================== */}

        <Link
          href="/reports"
          className="
            group
            flex
            min-h-[112px]
            flex-col
            justify-between
            rounded-2xl
            border
            border-[#d8e5ff]
            bg-[#f7faff]
            p-4
            transition-all
            duration-200
            hover:-translate-y-0.5
            hover:border-[#b9d0ff]
            hover:bg-[#f0f6ff]
            hover:shadow-md
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-[#eaf2ff]
              text-[#2563eb]
              transition-transform
              duration-200
              group-hover:scale-105
            "
          >
            <FileText
              size={19}
              strokeWidth={2}
            />
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <span
              className="
                text-[11px]
                font-bold
                text-[#17213f]
              "
            >
              Gerar Relatório
            </span>

            <ArrowUpRight
              size={14}
              className="
                text-[#4d82e8]
                transition-transform
                group-hover:translate-x-0.5
                group-hover:-translate-y-0.5
              "
            />
          </div>
        </Link>

      </div>
    </section>
  );
}