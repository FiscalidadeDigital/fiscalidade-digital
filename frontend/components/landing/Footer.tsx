'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">

        <div className="
          grid
          md:grid-cols-[1.5fr_1fr_1fr_1fr]
          gap-10
        ">

          {/* MARCA */}

          <div>

            <div className="flex items-center gap-3">

              <div className="w-10 h-10">
                <img
                  src="/logofiscalidade.png"
                  alt="Fiscalidade Digital"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="font-bold">
                Fiscalidade Digital
              </div>

            </div>

            <p className="
              text-sm
              leading-6
              text-slate-400
              max-w-sm
              mt-4
            ">
              Plataforma de gestão e acompanhamento
              fiscal para empresas em Angola.
            </p>

          </div>

          {/* PRODUTO */}

          <div>

            <h4 className="text-sm font-semibold mb-4">
              Produto
            </h4>

            <div className="space-y-3 text-sm text-slate-400">

              <a href="#beneficios" className="block hover:text-white">
                Benefícios
              </a>

              <a href="#modulos" className="block hover:text-white">
                Módulos
              </a>

              <a href="#faq" className="block hover:text-white">
                Perguntas frequentes
              </a>

            </div>

          </div>

          {/* EMPRESA */}

          <div>

            <h4 className="text-sm font-semibold mb-4">
              Empresa
            </h4>

            <div className="space-y-3 text-sm text-slate-400">

              <a href="#sobre" className="block hover:text-white">
                Sobre
              </a>

              <a href="#" className="block hover:text-white">
                Contactos
              </a>

            </div>

          </div>

          {/* CONTA */}

          <div>

            <h4 className="text-sm font-semibold mb-4">
              Conta
            </h4>

            <div className="space-y-3 text-sm">

              <Link
                href="/login"
                className="block text-slate-400 hover:text-white"
              >
                Iniciar sessão
              </Link>

              <Link
                href="/register"
                className="block text-slate-400 hover:text-white"
              >
                Criar conta
              </Link>

            </div>

          </div>

        </div>

        <div className="
          mt-12
          pt-6
          border-t
          border-slate-800
          flex
          flex-col
          sm:flex-row
          justify-between
          gap-3
          text-xs
          text-slate-500
        ">
          <span>
            © 2026 Fiscalidade Digital
          </span>

          <span>
            Gestão fiscal empresarial
          </span>
        </div>

      </div>

    </footer>
  );
}