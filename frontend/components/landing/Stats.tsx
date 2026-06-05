'use client';

import { useEffect, useState } from 'react';

import {
  Building2,
  FileText,
  ShieldCheck,
  Clock3,
} from 'lucide-react';

function Counter({
  target,
}: {
  target: number;
}) {
  const [count, setCount] =
    useState(0);

  useEffect(() => {
    let start = 0;

    const duration = 2500;

    const increment =
      target /
      (duration / 20);

    const timer =
      setInterval(() => {
        start += increment;

        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(
            Math.floor(start),
          );
        }
      }, 20);

    return () =>
      clearInterval(timer);
  }, [target]);

  return (
    <>
      {count.toLocaleString()}
    </>
  );
}

export default function Stats() {
  const stats = [
    {
      icon: Building2,
      target: 500,
      suffix: '+',
      label: 'Empresas',
      color:
        'from-blue-500 to-blue-700',
    },

    {
      icon: FileText,
      target: 25000,
      suffix: '+',
      label: 'Declarações',
      color:
        'from-green-500 to-green-700',
    },

    {
      icon: ShieldCheck,
      target: 98,
      suffix: '%',
      label:
        'Conformidade Fiscal',
      color:
        'from-orange-500 to-orange-700',
    },

    {
      icon: Clock3,
      target: 24,
      suffix: '/7',
      label:
        'Disponibilidade',
      color:
        'from-red-500 to-red-700',
    },
  ];

  return (
    <section className="relative py-32 bg-white overflow-hidden">

      <div className="absolute top-0 left-0 w-full h-full">

        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50" />

        <div className="absolute bottom-20 right-20 w-72 h-72 bg-cyan-100 rounded-full blur-3xl opacity-50" />

      </div>

      <div className="relative max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <h2 className="text-5xl font-black text-slate-900">
            Resultados que Inspiram Confiança
          </h2>

          <p className="text-slate-600 text-xl mt-4">
            Empresas organizadas.
            Processos automatizados.
            Crescimento sustentável.
          </p>

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          {stats.map(
            (item, index) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={index}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-[32px]
                    bg-white
                    border
                    border-slate-200
                    p-8
                    hover:-translate-y-3
                    hover:shadow-2xl
                    transition-all
                    duration-500
                  "
                >

                  <div
                    className={`
                      absolute
                      inset-x-0
                      top-0
                      h-1
                      bg-gradient-to-r
                      ${item.color}
                    `}
                  />

                  <div className="flex justify-center mb-6">

                    <div
                      className={`
                        w-20
                        h-20
                        rounded-3xl
                        flex
                        items-center
                        justify-center
                        bg-gradient-to-r
                        ${item.color}
                        text-white
                        shadow-xl
                      `}
                    >
                      <Icon size={38} />
                    </div>

                  </div>

                  <div className="text-center">

                    <h3 className="text-5xl font-black text-slate-900">

                      <Counter
                        target={
                          item.target
                        }
                      />

                      {item.suffix}

                    </h3>

                    <p className="mt-4 text-slate-600 text-lg">
                      {item.label}
                    </p>

                  </div>

                </div>
              );
            },
          )}

        </div>

      </div>

    </section>
  );
}