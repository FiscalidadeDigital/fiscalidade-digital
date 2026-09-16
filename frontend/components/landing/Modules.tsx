'use client';

import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Receipt,
  Bell,
  Calendar,
  Calculator,
  History,
  BarChart3,
  Library,
} from 'lucide-react';

export default function Modules() {
  const modules = [
    {
      icon: LayoutDashboard,
      title: 'Dashboard Executivo',
      description: 'Visão geral da situação fiscal e financeira da empresa.',
    },
    {
      icon: FileText,
      title: 'Facturação',
      description: 'Emita e acompanhe documentos de facturação.',
    },
    {
      icon: Users,
      title: 'Clientes',
      description: 'Mantenha os dados dos seus clientes organizados.',
    },
    {
      icon: Package,
      title: 'Produtos',
      description: 'Controle produtos, serviços e respectivos dados.',
    },
    {
      icon: Receipt,
      title: 'Declarações',
      description: 'Organize as suas declarações e obrigações fiscais.',
    },
    {
      icon: Calculator,
      title: 'Impostos',
      description: 'Acompanhe impostos e valores a liquidar.',
    },
    {
      icon: Calendar,
      title: 'Calendário Fiscal',
      description: 'Consulte prazos e compromissos fiscais.',
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Receba avisos sobre tarefas e prazos importantes.',
    },
    {
      icon: History,
      title: 'Histórico Fiscal',
      description: 'Consulte o histórico das operações da empresa.',
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
      description: 'Tenha informação organizada para apoiar decisões.',
    },
    {
      icon: Library,
      title: 'Biblioteca Fiscal',
      description: 'Consulte conteúdos e referências fiscais.',
    },
  ];

  return (
    <section
      id="modulos"
      className="py-24 lg:py-28 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Cabeçalho */}

        <div className="max-w-3xl mb-14">

          <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Plataforma
          </span>

          <h2 className="mt-5 text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Tudo o que precisa para organizar a gestão fiscal
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Uma plataforma centralizada para acompanhar facturação,
            impostos, declarações, clientes e obrigações da sua empresa.
          </p>

        </div>

        {/* Módulos */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

          {modules.map((module, index) => {
            const Icon = module.icon;

            return (
              <div
                key={index}
                className="
                  group
                  bg-white
                  border
                  border-slate-200
                  rounded-2xl
                  p-6
                  transition-all
                  duration-200
                  hover:border-blue-200
                  hover:shadow-md
                "
              >

                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-blue-50
                    text-blue-600
                    flex
                    items-center
                    justify-center
                    mb-5
                    group-hover:bg-blue-600
                    group-hover:text-white
                    transition-colors
                  "
                >
                  <Icon size={22} strokeWidth={2} />
                </div>

                <h3 className="text-lg font-semibold text-slate-900">
                  {module.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {module.description}
                </p>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}