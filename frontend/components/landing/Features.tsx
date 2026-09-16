'use client';

import {
  ShieldCheck,
  Bell,
  TrendingUp,
  Users,
  Globe,
  Briefcase,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Segurança',
    description:
      'Mantenha a informação da empresa organizada e protegida.',
  },
  {
    icon: Bell,
    title: 'Alertas de prazos',
    description:
      'Acompanhe obrigações e receba avisos sobre datas importantes.',
  },
  {
    icon: TrendingUp,
    title: 'Indicadores',
    description:
      'Consulte informação resumida para acompanhar o negócio.',
  },
  {
    icon: Users,
    title: 'Trabalho em equipa',
    description:
      'Centralize a informação que a sua equipa precisa no dia a dia.',
  },
  {
    icon: Globe,
    title: 'Acesso online',
    description:
      'Consulte a plataforma a partir do computador onde estiver.',
  },
  {
    icon: Briefcase,
    title: 'Gestão centralizada',
    description:
      'Documentos, obrigações e informação fiscal num único lugar.',
  },
];

export default function Features() {
  return (
    <section
      id="beneficios"
      className="py-24 lg:py-28 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        <div className="max-w-2xl mb-12">

          <div className="
            text-xs
            font-semibold
            text-blue-700
            uppercase
            tracking-wide
            mb-3
          ">
            Benefícios
          </div>

          <h2 className="
            text-3xl
            sm:text-4xl
            font-bold
            tracking-tight
            text-slate-950
          ">
            Ferramentas pensadas para o trabalho fiscal do dia a dia.
          </h2>

          <p className="
            mt-4
            text-lg
            text-slate-600
            leading-7
          ">
            Menos informação espalhada e mais visibilidade
            sobre aquilo que precisa de ser tratado.
          </p>

        </div>

        <div className="
          grid
          md:grid-cols-2
          lg:grid-cols-3
          gap-px
          bg-slate-200
          border
          border-slate-200
          rounded-2xl
          overflow-hidden
        ">

          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="
                  bg-white
                  p-7
                  hover:bg-slate-50
                  transition-colors
                "
              >

                <div className="
                  w-10
                  h-10
                  rounded-lg
                  bg-blue-50
                  text-blue-700
                  flex
                  items-center
                  justify-center
                  mb-5
                ">
                  <Icon size={20} />
                </div>

                <h3 className="font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="
                  text-sm
                  text-slate-500
                  leading-6
                  mt-2
                ">
                  {item.description}
                </p>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}