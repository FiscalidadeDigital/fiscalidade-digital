'use client';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">

      <div className="max-w-7xl mx-auto px-6 py-16">

        <div className="grid md:grid-cols-4 gap-10">

          <div>

            <h3 className="font-bold text-xl mb-4">
              Fiscalidade Digital
            </h3>

            <p className="text-slate-400">
              Plataforma inteligente para gestão fiscal empresarial em Angola.
            </p>

          </div>

          <div>

            <h4 className="font-semibold mb-4">
              Produto
            </h4>

            <ul className="space-y-2 text-slate-400">
              <li>Facturação</li>
              <li>Declarações</li>
              <li>Relatórios</li>
            </ul>

          </div>

          <div>

            <h4 className="font-semibold mb-4">
              Empresa
            </h4>

            <ul className="space-y-2 text-slate-400">
              <li>Sobre</li>
              <li>Parceiros</li>
              <li>Contactos</li>
            </ul>

          </div>

          <div>

            <h4 className="font-semibold mb-4">
              Legal
            </h4>

            <ul className="space-y-2 text-slate-400">
              <li>Privacidade</li>
              <li>Termos</li>
              <li>Cookies</li>
            </ul>

          </div>

        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">
          © 2026 Fiscalidade Digital. Todos os direitos reservados.
        </div>

      </div>

    </footer>
  );
}