'use client';

import {
  Building2,
  Users,
  ShieldCheck,
  Landmark,
} from 'lucide-react';

export default function SocialImpact() {
  return (
    <section className="py-32 bg-slate-50">

      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-20">

          <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium">
            Responsabilidade Social
          </span>

          <h2 className="text-5xl font-black mt-6">
            Impacto Positivo na Economia
          </h2>

          <p className="text-xl text-slate-600 max-w-4xl mx-auto mt-6">
            Empresas mais organizadas geram mais empregos,
            pagam impostos correctamente e ajudam no
            crescimento sustentável de Angola.
          </p>

        </div>

        <div className="grid md:grid-cols-4 gap-8">

          <div className="bg-white rounded-3xl p-8 shadow-sm">

            <Building2
              size={48}
              className="text-blue-600 mb-5"
            />

            <h3 className="font-bold text-xl mb-3">
              Empresas
            </h3>

            <p className="text-slate-600">
              Maior organização e conformidade fiscal.
            </p>

          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm">

            <Users
              size={48}
              className="text-green-600 mb-5"
            />

            <h3 className="font-bold text-xl mb-3">
              Trabalhadores
            </h3>

            <p className="text-slate-600">
              Mais estabilidade e transparência.
            </p>

          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm">

            <ShieldCheck
              size={48}
              className="text-orange-500 mb-5"
            />

            <h3 className="font-bold text-xl mb-3">
              Conformidade
            </h3>

            <p className="text-slate-600">
              Redução de riscos e penalizações.
            </p>

          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm">

            <Landmark
              size={48}
              className="text-purple-600 mb-5"
            />

            <h3 className="font-bold text-xl mb-3">
              Estado
            </h3>

            <p className="text-slate-600">
              Maior arrecadação e controlo fiscal.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}