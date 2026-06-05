'use client';

import {
  ShieldCheck,
  Bell,
  TrendingUp,
  Users,
  Globe,
  Briefcase,
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Segurança Avançada',
      description:
        'Protecção de dados com padrões modernos de segurança.',
    },
    {
      icon: Bell,
      title: 'Alertas Inteligentes',
      description:
        'Receba notificações antes dos prazos fiscais.',
    },
    {
      icon: TrendingUp,
      title: 'Maior Produtividade',
      description:
        'Automatize processos e reduza trabalho manual.',
    },
    {
      icon: Users,
      title: 'Escalável',
      description:
        'Adequado para PME e grandes empresas.',
    },
    {
      icon: Globe,
      title: 'Acesso Online',
      description:
        'Aceda ao sistema em qualquer lugar.',
    },
    {
      icon: Briefcase,
      title: 'Gestão Completa',
      description:
        'Tudo centralizado numa única plataforma.',
    },
  ];

  return (
    <section
      id="beneficios"
      className="py-32 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-black text-center mb-5">
          Por que aderir ao sistema?
        </h2>

        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-16">
          Desenvolvido para simplificar a gestão fiscal
          e financeira das empresas angolanas.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all"
              >
                <Icon
                  size={42}
                  className="text-blue-600 mb-5"
                />

                <h3 className="text-xl font-bold mb-3">
                  {item.title}
                </h3>

                <p className="text-slate-600">
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