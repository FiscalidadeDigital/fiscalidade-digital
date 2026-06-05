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
    },
    {
      icon: FileText,
      title: 'Facturação',
    },
    {
      icon: Users,
      title: 'Clientes',
    },
    {
      icon: Package,
      title: 'Produtos',
    },
    {
      icon: Receipt,
      title: 'Declarações',
    },
    {
      icon: Calculator,
      title: 'Impostos',
    },
    {
      icon: Calendar,
      title: 'Calendário Fiscal',
    },
    {
      icon: Bell,
      title: 'Notificações',
    },
    {
      icon: History,
      title: 'Histórico Fiscal',
    },
    {
      icon: BarChart3,
      title: 'Relatórios',
    },
    {
      icon: Library,
      title: 'Biblioteca Fiscal',
    },
  ];

  return (
    <section
      id="modulos"
      className="py-28 bg-slate-50"
    >
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-black text-center mb-5">
          Módulos da Plataforma
        </h2>

        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-16">
          Tudo o que uma empresa precisa
          para gerir as suas obrigações fiscais
          num único sistema.
        </p>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">

          {modules.map((module, index) => {
            const Icon = module.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 border border-slate-100 hover:-translate-y-2 hover:shadow-xl transition-all"
              >
                <Icon
                  size={42}
                  className="text-blue-600 mb-4"
                />

                <h3 className="font-bold text-lg">
                  {module.title}
                </h3>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}