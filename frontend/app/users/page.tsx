'use client';

import {
  Clock,
  Construction,
  ShieldCheck,
  Users,
  UserRoundPlus,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function UsersPage() {
  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-[1400px]">

        {/* CABEÇALHO */}

        <section className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeecff] text-[#5146e5]">
              <Users size={21} />
            </div>

            <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#5146e5]">
              Gestão da Empresa
            </span>
          </div>

          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#101b3d] sm:text-[34px]">
            Utilizadores
          </h1>

          <p className="mt-2 max-w-[700px] text-[14px] leading-6 text-[#7180a2]">
            Gere os utilizadores da tua empresa e organiza
            os acessos à plataforma Fiscalidade Digital.
          </p>
        </section>

        {/* CONTEÚDO PRINCIPAL */}

        <section className="relative overflow-hidden rounded-3xl border border-[#e5e8f1] bg-white shadow-[0_8px_35px_rgba(35,45,90,0.05)]">

          {/* DECORAÇÕES */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#eeecff] opacity-70 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#e5f6ff] opacity-60 blur-3xl" />

          <div className="relative px-5 py-12 sm:px-10 sm:py-16 lg:px-20 lg:py-20">

            {/* ÍCONE PRINCIPAL */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#eeecff] text-[#5146e5] shadow-sm sm:h-24 sm:w-24">
              <Construction
                size={42}
                strokeWidth={1.6}
              />
            </div>

            {/* MENSAGEM */}

            <div className="mx-auto mt-7 max-w-[680px] text-center">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#f0dca5] bg-[#fff9e8] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-[#a87916]">
                <Clock size={13} />
                Em manutenção
              </div>

              <h2 className="text-[24px] font-bold tracking-[-0.02em] text-[#101b3d] sm:text-[30px]">
                Gestão de utilizadores em breve
              </h2>

              <p className="mt-4 text-[13px] leading-7 text-[#7180a2] sm:text-[14px]">
                Estamos a preparar uma área completa para
                permitir que a tua empresa adicione e gira
                os seus utilizadores dentro da Fiscalidade
                Digital.
              </p>

              <p className="mt-3 text-[13px] leading-7 text-[#7180a2] sm:text-[14px]">
                Em breve, poderás convidar funcionários,
                contabilistas e colaboradores, definir
                permissões e controlar o acesso aos
                diferentes módulos do sistema.
              </p>

            </div>

            {/* FUNCIONALIDADES FUTURAS */}

            <div className="mx-auto mt-10 grid max-w-[850px] grid-cols-1 gap-4 md:grid-cols-3">

              <div className="rounded-2xl border border-[#e9ebf3] bg-[#fafbfe] p-5 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#eeecff] text-[#5146e5]">
                  <UserRoundPlus size={19} />
                </div>

                <h3 className="mt-4 text-[13px] font-bold text-[#253453]">
                  Adicionar utilizadores
                </h3>

                <p className="mt-2 text-[11px] leading-5 text-[#8490aa]">
                  Convide membros da sua empresa para
                  utilizarem a plataforma.
                </p>

              </div>

              <div className="rounded-2xl border border-[#e9ebf3] bg-[#fafbfe] p-5 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f8f0] text-[#15945b]">
                  <ShieldCheck size={19} />
                </div>

                <h3 className="mt-4 text-[13px] font-bold text-[#253453]">
                  Permissões de acesso
                </h3>

                <p className="mt-2 text-[11px] leading-5 text-[#8490aa]">
                  Defina o nível de acesso de cada
                  utilizador aos módulos do sistema.
                </p>

              </div>

              <div className="rounded-2xl border border-[#e9ebf3] bg-[#fafbfe] p-5 text-center">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f3ff] text-[#2876d2]">
                  <Users size={19} />
                </div>

                <h3 className="mt-4 text-[13px] font-bold text-[#253453]">
                  Gestão da equipa
                </h3>

                <p className="mt-2 text-[11px] leading-5 text-[#8490aa]">
                  Consulte, actualize e controle os
                  membros associados à sua empresa.
                </p>

              </div>

            </div>

            {/* AVISO */}

            <div className="mx-auto mt-10 flex max-w-[600px] items-center justify-center gap-2 rounded-xl border border-[#e5e8f1] bg-white px-5 py-4 text-center">

              <Clock
                size={16}
                className="shrink-0 text-[#8a96ad]"
              />

              <p className="text-[11px] font-medium text-[#7180a2]">
                Esta funcionalidade estará disponível brevemente.
              </p>

            </div>

          </div>

        </section>

        {/* NOTA DE SEGURANÇA */}

        <section className="mt-6 rounded-2xl border border-[#e5e8f1] bg-[#f8f9fd] p-5 sm:p-6">

          <div className="flex items-start gap-3">

            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#5146e5] shadow-sm">
              <ShieldCheck size={16} />
            </div>

            <div>
              <h3 className="text-[12px] font-bold text-[#253453]">
                Gestão segura de acessos
              </h3>

              <p className="mt-1 text-[11px] leading-5 text-[#8490aa]">
                Cada utilizador estará associado à sua
                empresa. As permissões serão controladas
                de forma segura para proteger os dados
                empresariais.
              </p>
            </div>

          </div>

        </section>

      </main>
    </DashboardLayout>
  );
}