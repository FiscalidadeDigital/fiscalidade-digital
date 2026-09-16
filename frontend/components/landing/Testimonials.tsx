'use client';

import {
  CheckCircle2,
  FileText,
  CalendarCheck,
  BarChart3,
} from 'lucide-react';

const items = [
  {
    icon: FileText,
    title: 'Documentação organizada',
    text: 'Tenha os principais documentos e processos fiscais reunidos num ambiente centralizado.',
  },
  {
    icon: CalendarCheck,
    title: 'Prazos acompanhados',
    text: 'Consulte as obrigações e compromissos que precisam da sua atenção.',
  },
  {
    icon: BarChart3,
    title: 'Informação para decidir',
    text: 'Acompanhe indicadores e relatórios que ajudam a compreender a situação da empresa.',
  },
  {
    icon: CheckCircle2,
    title: 'Mais confiança no dia a dia',
    text: 'Reduza tarefas repetitivas e tenha uma visão mais clara dos processos fiscais.',
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 lg:py-28 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-14 items-start">

          {/* Texto */}

          <div>

            <span className="text-sm font-semibold text-blue-600">
              Experiência de utilização
            </span>

            <h2 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Uma plataforma pensada para o trabalho real
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              A gestão fiscal não precisa de estar espalhada por
              folhas de cálculo, documentos e diferentes ferramentas.
            </p>

            <div className="mt-7 flex items-start gap-3">

              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <p className="text-sm leading-6 text-slate-600">
                Informação centralizada para facilitar o acompanhamento
                das actividades fiscais da empresa.
              </p>

            </div>

          </div>

          {/* Cards */}

          <div className="grid sm:grid-cols-2 gap-4">

            {items.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={index}
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-6
                  "
                >

                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-5 font-semibold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.text}
                  </p>

                </div>
              );
            })}

          </div>

        </div>

      </div>

    </section>
  );
}