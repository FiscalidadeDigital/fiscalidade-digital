'use client';

import {
  ShieldCheck,
  Clock3,
  TrendingUp,
  BellRing,
} from 'lucide-react';

export default function About() {
  return (
    <section
      id="sobre"
      className="py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* ESQUERDA */}

          <div>

            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium mb-6">
              Sobre a Plataforma
            </div>

            <h2 className="text-5xl font-black text-slate-900 leading-tight">
              Fiscalidade Inteligente para Empresas Modernas
            </h2>

            <p className="text-xl text-slate-600 mt-8 leading-relaxed">
              O Fiscalidade Digital foi criado para ajudar
              empresas angolanas a automatizar processos fiscais,
              reduzir riscos, evitar multas e tomar decisões
              financeiras com mais segurança.
            </p>

            <div className="mt-10 space-y-5">

              <div className="flex items-center gap-4">
                <ShieldCheck className="text-green-600" />
                <span>
                  Conformidade fiscal automatizada
                </span>
              </div>

              <div className="flex items-center gap-4">
                <BellRing className="text-orange-500" />
                <span>
                  Alertas inteligentes de obrigações
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Clock3 className="text-blue-600" />
                <span>
                  Redução significativa do trabalho manual
                </span>
              </div>

              <div className="flex items-center gap-4">
                <TrendingUp className="text-purple-600" />
                <span>
                  Maior controlo financeiro e fiscal
                </span>
              </div>

            </div>

          </div>

          {/* DIREITA */}

          <div>

            <div className="bg-slate-950 rounded-[32px] p-8 text-white shadow-2xl">

              <div className="flex justify-between mb-8">

                <div>
                  <div className="text-slate-400">
                    Receita Anual
                  </div>

                  <div className="text-4xl font-black">
                    48.7M AOA
                  </div>
                </div>

                <div className="text-green-400 font-bold">
                  +27%
                </div>

              </div>

              <div className="space-y-5">

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Conformidade Fiscal</span>
                    <span>98%</span>
                  </div>

                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[98%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Automatização</span>
                    <span>91%</span>
                  </div>

                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[91%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>Eficiência Operacional</span>
                    <span>95%</span>
                  </div>

                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[95%]" />
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}