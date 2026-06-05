'use client';

import { useEffect, useState } from 'react';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    name: 'José Manuel',
    company: 'Grupo Empresarial JM',
    text: 'Reduzimos drasticamente os atrasos fiscais e hoje temos total controlo das obrigações da empresa.',
  },
  {
    name: 'Maria Fernandes',
    company: 'MF Comércio',
    text: 'A plataforma tornou os processos fiscais simples e transparentes para toda a equipa.',
  },
  {
    name: 'Carlos Alberto',
    company: 'CA Serviços',
    text: 'Hoje acompanhamos receitas, impostos e alertas em tempo real.',
  },
  {
    name: 'Ana Paula',
    company: 'AP Investimentos',
    text: 'O Fiscalidade Digital eliminou planilhas e trouxe organização financeira.',
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) =>
        prev === testimonials.length - 1
          ? 0
          : prev + 1,
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-slate-50">

      <div className="max-w-6xl mx-auto px-6">

        <div className="text-center mb-16">

          <h2 className="text-5xl font-black text-slate-900">
            O Que os Clientes Dizem
          </h2>

          <p className="text-slate-600 mt-4 text-lg">
            Empresas que modernizaram a sua gestão fiscal.
          </p>

        </div>

        <div className="relative overflow-hidden">

          <div
            className="flex transition-all duration-700"
            style={{
              transform: `translateX(-${active * 100}%)`,
            }}
          >

            {testimonials.map((item, index) => (
              <div
                key={index}
                className="min-w-full px-4"
              >

                <div className="bg-white rounded-[36px] shadow-xl p-10 text-center">

                  <Quote
                    size={50}
                    className="mx-auto text-blue-600 mb-6"
                  />

                  <div className="flex justify-center gap-1 mb-6">

                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={20}
                        className="fill-yellow-400 text-yellow-400"
                      />
                    ))}

                  </div>

                  <p className="text-2xl text-slate-700 leading-relaxed max-w-3xl mx-auto">
                    "{item.text}"
                  </p>

                  <div className="mt-8">

                    <h3 className="font-bold text-xl">
                      {item.name}
                    </h3>

                    <p className="text-slate-500">
                      {item.company}
                    </p>

                  </div>

                </div>

              </div>
            ))}

          </div>

          <div className="flex justify-center gap-3 mt-8">

            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() =>
                  setActive(index)
                }
                className={`h-3 rounded-full transition-all ${
                  active === index
                    ? 'bg-blue-600 w-10'
                    : 'bg-slate-300 w-3'
                }`}
              />
            ))}

          </div>

        </div>

      </div>

    </section>
  );
}