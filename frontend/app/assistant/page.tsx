import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

const topics = [
  {
    title: 'IVA',
    description:
      'Conheça conceitos, documentos e fontes a confirmar antes de tratar o imposto.',
    icon: ReceiptText,
  },
  {
    title: 'IRT',
    description:
      'Organize a leitura sobre rendimentos do trabalho e factos associados à folha salarial.',
    icon: Users,
  },
  {
    title: 'Imposto Industrial',
    description:
      'Consulte enquadramentos, matéria colectável e obrigações com apoio de fontes disponíveis.',
    icon: Landmark,
  },
  {
    title: 'Facturação',
    description:
      'Explore requisitos documentais e referências relacionadas com documentos comerciais.',
    icon: FileText,
  },
  {
    title: 'Obrigações fiscais',
    description:
      'Acompanhe enquadramentos, obrigações e prazos confirmados no sistema.',
    icon: ShieldCheck,
    href: '/obligations',
  },
  {
    title: 'Calendário fiscal',
    description:
      'Veja datas disponíveis sem inferir prazos ainda não confirmados oficialmente.',
    icon: CalendarDays,
    href: '/calendar',
  },
];

export default function EducationFiscalPage() {
  return (
    <DashboardLayout>
      <main className="fd-workspace-page mx-auto w-full max-w-6xl space-y-7">
        <header className="rounded-2xl border border-slate-200 bg-white px-5 py-6 sm:px-7">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e8f6fa] text-[#0b6f93]">
              <BookOpen size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#0b6f93]">
                Conhecimento
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#102447] sm:text-3xl">
                Educação Fiscal
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Um ponto de partida para compreender temas fiscais e consultar
                fontes disponíveis na plataforma.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl bg-[#102447] px-5 py-6 text-white sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-cyan-200">
            Assistente Fiscal
          </p>
          <h2 className="mt-2 text-xl font-semibold">
            Pergunte sobre temas gerais ou sobre a sua empresa.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Use o Assistente Fiscal no canto inferior direito. Perguntas gerais
            podem recorrer a fontes oficiais; perguntas sobre a empresa usam
            apenas os dados da sua empresa a que tem acesso.
          </p>
          <Link
            href="/fiscal-situation"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white"
          >
            Consultar situação fiscal da empresa <ArrowRight size={16} />
          </Link>
        </section>

        <section aria-labelledby="education-topics">
          <div className="mb-4">
            <h2
              id="education-topics"
              className="text-xl font-semibold text-[#102447]"
            >
              Percursos de aprendizagem
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Use o Assistente Fiscal para questões sobre IVA, IRT, INSS e
              Imposto Industrial; as referências verificáveis são mostradas na
              resposta.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => {
              const Icon = topic.icon;
              return (
                <article
                  key={topic.title}
                  className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-[#0b6f93]">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-5 font-semibold text-[#102447]">
                    {topic.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    {topic.description}
                  </p>
                  {topic.href ? (
                    <Link
                      href={topic.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0b6f93] hover:underline"
                    >
                      Consultar no sistema <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <p className="mt-5 text-sm font-semibold text-[#0b6f93]">
                      Pergunte ao Assistente Fiscal
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5">
          <h2 className="font-semibold text-amber-950">
            Confirmação antes de decidir
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Estes conteúdos apoiam a organização e a pesquisa. Confirme sempre
            a legislação aplicável, o enquadramento da empresa e a validação
            profissional antes de executar uma obrigação fiscal.
          </p>
        </section>
      </main>
    </DashboardLayout>
  );
}
