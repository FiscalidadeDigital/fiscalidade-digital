'use client';

import {
  Building2,
  FileText,
  ShieldCheck,
  Clock3,
} from 'lucide-react';

export default function Stats() {
  const stats = [
    {
      icon: Building2,
      value: '1',
      suffix: ' plataforma',
      label: 'Para centralizar a gestão fiscal',
    },
    {
      icon: FileText,
      value: 'Vários',
      suffix: '',
      label: 'Processos reunidos num só lugar',
    },
    {
      icon: ShieldCheck,
      value: 'Maior',
      suffix: '',
      label: 'Controlo sobre obrigações e prazos',
    },
    {
      icon: Clock3,
      value: '24/7',
      suffix: '',
      label: 'Acesso online à informação da empresa',
    },
  ];

  return (
    <section className="py-24 lg:py-28 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <div className="max-w-3xl mb-12">

          <span className="text-sm font-semibold text-blue-600">
            Em resumo
          </span>

          <h2 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Mais controlo, menos informação dispersa
          </h2>

          <p className="mt-4 text-lg text-slate-600">
            Uma plataforma pensada para simplificar o trabalho
            diário de quem gere uma empresa.
          </p>

        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-7
                "
              >

                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center">
                  <Icon size={21} />
                </div>

                <div className="mt-6">

                  <div className="text-2xl font-bold text-slate-900">
                    {item.value}
                    {item.suffix && (
                      <span className="ml-1 text-base font-semibold text-slate-500">
                        {item.suffix}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.label}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </section>
  );
}