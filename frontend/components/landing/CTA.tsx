'use client';

import Link from 'next/link';

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-32">

      <div className="absolute inset-0">

        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />

      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">

        <h2 className="text-6xl font-black text-white mb-8">
          Pronto para transformar
          a sua gestão fiscal?
        </h2>

        <p className="text-slate-300 text-xl mb-12">
          Junte-se às empresas que já modernizaram
          os seus processos fiscais com o
          Fiscalidade Digital.
        </p>

        <div className="flex flex-wrap justify-center gap-4">

          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl text-white font-semibold"
          >
            Registrar Empresa
          </Link>

          <Link
            href="/login"
            className="bg-white hover:bg-slate-200 px-8 py-4 rounded-2xl text-slate-900 font-semibold"
          >
            Iniciar Sessão
          </Link>

        </div>

      </div>

    </section>
  );
}