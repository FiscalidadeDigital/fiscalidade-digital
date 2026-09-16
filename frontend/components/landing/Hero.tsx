'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import HeroDashboard from './HeroDashboard';

import {
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function Hero() {
  return (
    <section
      className="
        relative
        overflow-hidden
        bg-slate-50
        border-b
        border-slate-200
      "
    >

      {/* =========================================
          FUNDO
      ========================================== */}

      <div
        className="
          absolute
          inset-0
          pointer-events-none
          overflow-hidden
        "
      >

        {/* brilho azul muito discreto */}
        <div
          className="
            absolute
            -top-48
            -left-48
            w-[650px]
            h-[650px]
            rounded-full
            bg-blue-100/50
            blur-3xl
          "
        />

        <div
          className="
            absolute
            top-1/3
            right-[-250px]
            w-[600px]
            h-[600px]
            rounded-full
            bg-indigo-100/40
            blur-3xl
          "
        />

      </div>

      {/* =========================================
          CONTEÚDO
      ========================================== */}

      <div
        className="
          relative
          max-w-7xl
          mx-auto
          px-6
          lg:px-8
          pt-32
          lg:pt-40
          pb-20
          lg:pb-28
        "
      >

        <div
          className="
            grid
            lg:grid-cols-[0.9fr_1.1fr]
            gap-14
            lg:gap-20
            items-center
          "
        >

          {/* =====================================
              ESQUERDA
          ====================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              ease: 'easeOut',
            }}
          >

            {/* PEQUENO LABEL */}

            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-blue-200
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-blue-700
                shadow-sm
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-blue-600
                "
              />

              Gestão fiscal para empresas angolanas
            </div>

            {/* TÍTULO */}

            <h1
              className="
                mt-7
                text-5xl
                sm:text-6xl
                lg:text-[64px]
                font-bold
                tracking-tight
                leading-[1.05]
                text-slate-950
              "
            >
              A sua gestão fiscal,
              <span
                className="
                  block
                  text-blue-600
                "
              >
                num só lugar.
              </span>
            </h1>

            {/* DESCRIÇÃO */}

            <p
              className="
                mt-7
                max-w-xl
                text-lg
                lg:text-xl
                leading-8
                text-slate-600
              "
            >
              Simplifique a facturação, acompanhe as
              obrigações fiscais e tenha uma visão clara
              da situação da sua empresa.
            </p>

            {/* BOTÕES */}

            <div
              className="
                mt-9
                flex
                flex-wrap
                items-center
                gap-3
              "
            >

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
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  hover:bg-blue-700
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
                  border-slate-300
                  bg-white
                  px-6
                  py-3.5
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-50
                  transition-colors
                "
              >
                Iniciar sessão
              </Link>

            </div>

            {/* CONFIANÇA */}

            <div
              className="
                mt-8
                flex
                flex-wrap
                gap-x-6
                gap-y-3
                text-sm
                text-slate-500
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <CheckCircle2
                  size={17}
                  className="text-emerald-600"
                />

                Gestão centralizada
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <CheckCircle2
                  size={17}
                  className="text-emerald-600"
                />

                Alertas de prazos
              </div>

            </div>

          </motion.div>

          {/* =====================================
              DIREITA — DASHBOARD
          ====================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: 30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.15,
              ease: 'easeOut',
            }}
            className="
              relative
              lg:pl-4
            "
          >

            <div
              className="
                absolute
                -inset-6
                rounded-[32px]
                bg-blue-100/40
                blur-2xl
                pointer-events-none
              "
            />

            <div
              className="
                relative
              "
            >
              <HeroDashboard />
            </div>

          </motion.div>

        </div>

      </div>

    </section>
  );
}