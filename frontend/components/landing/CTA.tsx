'use client';

import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">

      <div className="max-w-5xl mx-auto px-6">

        <div className="
          bg-blue-700
          rounded-2xl
          px-8
          py-12
          lg:px-14
          lg:py-14
          text-center
        ">

          <h2 className="
            text-3xl
            sm:text-4xl
            font-bold
            text-white
          ">
            Comece a organizar a gestão fiscal da sua empresa.
          </h2>

          <p className="
            mt-4
            text-blue-100
            max-w-2xl
            mx-auto
            leading-7
          ">
            Crie a sua conta e tenha uma visão mais organizada
            das obrigações e informações fiscais da empresa.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">

            <Link
              href="/register"
              className="
                px-6
                py-3
                rounded-lg
                bg-white
                text-blue-700
                font-semibold
                hover:bg-blue-50
                transition
              "
            >
              Criar conta
            </Link>

            <Link
              href="/login"
              className="
                px-6
                py-3
                rounded-lg
                border
                border-blue-400
                text-white
                font-semibold
                hover:bg-blue-600
                transition
              "
            >
              Iniciar sessão
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}