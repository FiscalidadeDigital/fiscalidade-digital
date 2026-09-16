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
      className="py-24 lg:py-28 bg-slate-50 border-y border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* TEXTO */}

          <div>

            <div className="
              inline-flex
              px-3
              py-1.5
              rounded-md
              bg-white
              border
              border-slate-200
              text-blue-700
              text-xs
              font-semibold
              mb-5
            ">
              Sobre a plataforma
            </div>

            <h2 className="
              text-3xl
              sm:text-4xl
              font-bold
              tracking-tight
              text-slate-950
              leading-tight
            ">
              Uma forma mais simples de acompanhar a fiscalidade da sua empresa.
            </h2>

            <p className="
              mt-6
              text-lg
              leading-8
              text-slate-600
            ">
              O Fiscalidade Digital reúne num único espaço
              as principais informações e tarefas relacionadas
              com a gestão fiscal da empresa.
            </p>

            <p className="
              mt-4
              text-base
              leading-7
              text-slate-600
            ">
              Em vez de procurar informação em vários lugares,
              a equipa pode acompanhar obrigações, documentos,
              pagamentos e prazos a partir de uma única plataforma.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-5">

              <Feature
                icon={ShieldCheck}
                title="Maior controlo"
                text="Tenha uma visão mais clara da situação fiscal."
                color="text-blue-700"
              />

              <Feature
                icon={BellRing}
                title="Alertas"
                text="Acompanhe prazos e obrigações importantes."
                color="text-orange-600"
              />

              <Feature
                icon={Clock3}
                title="Mais organização"
                text="Reduza tarefas dispersas e trabalho repetitivo."
                color="text-emerald-600"
              />

              <Feature
                icon={TrendingUp}
                title="Melhor acompanhamento"
                text="Consulte indicadores para apoiar decisões."
                color="text-purple-600"
              />

            </div>

          </div>

          {/* BLOCO VISUAL */}

          <div className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            p-6
            lg:p-8
            shadow-sm
          ">

            <div className="flex items-center justify-between mb-7">

              <div>
                <p className="text-xs text-slate-500">
                  Visão geral
                </p>

                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Estado da empresa
                </h3>
              </div>

              <span className="
                px-2.5
                py-1
                rounded-md
                bg-emerald-50
                text-emerald-700
                text-xs
                font-semibold
              ">
                Regular
              </span>

            </div>

            <div className="space-y-5">

              <Progress
                title="Obrigações acompanhadas"
                value="86%"
                width="86%"
              />

              <Progress
                title="Documentos organizados"
                value="74%"
                width="74%"
              />

              <Progress
                title="Pagamentos em dia"
                value="92%"
                width="92%"
              />

            </div>

            <div className="
              mt-8
              pt-6
              border-t
              border-slate-200
              grid
              grid-cols-3
              gap-4
            ">

              <Metric
                value="12"
                label="Obrigações"
              />

              <Metric
                value="28"
                label="Documentos"
              />

              <Metric
                value="04"
                label="Alertas"
              />

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
  color,
}: {
  icon: any;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon
        size={20}
        className={`${color} shrink-0 mt-0.5`}
      />

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="text-sm text-slate-500 mt-1 leading-6">
          {text}
        </p>
      </div>
    </div>
  );
}

function Progress({
  title,
  value,
  width,
}: {
  title: string;
  value: string;
  width: string;
}) {
  return (
    <div>

      <div className="flex justify-between mb-2">
        <span className="text-sm text-slate-600">
          {title}
        </span>

        <span className="text-sm font-semibold text-slate-900">
          {value}
        </span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width }}
        />
      </div>

    </div>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <div className="text-xl font-bold text-slate-900">
        {value}
      </div>

      <div className="text-xs text-slate-500 mt-1">
        {label}
      </div>
    </div>
  );
}