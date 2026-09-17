
import Link from 'next/link';

export const metadata = {
  title: 'Termos de Utilização | Fiscalidade Digital',
  description:
    'Termos de utilização da plataforma Fiscalidade Digital.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-semibold text-sky-600 hover:text-sky-700"
        >
          ← Voltar ao Fiscalidade Digital
        </Link>

        <h1 className="mb-3 text-3xl font-bold text-slate-900">
          Termos de Utilização
        </h1>

        <p className="mb-8 text-sm text-slate-500">
          Última actualização: 18 de Setembro de 2026
        </p>

        <div className="space-y-8 leading-7">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              1. Sobre a plataforma
            </h2>
            <p>
              O Fiscalidade Digital é uma plataforma tecnológica destinada
              a apoiar empresas e profissionais na organização e gestão
              de informações fiscais, contabilísticas e administrativas.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              2. Criação da conta
            </h2>
            <p>
              O utilizador deve fornecer informações verdadeiras, completas
              e actualizadas durante o registo. Cada utilizador é responsável
              pela confidencialidade das suas credenciais de acesso.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              3. Utilização responsável
            </h2>
            <p>
              É proibida a utilização da plataforma para actividades ilícitas,
              tentativas de acesso não autorizado, manipulação de dados,
              distribuição de código malicioso ou interferência no funcionamento
              do serviço.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              4. Informações fiscais
            </h2>
            <p>
              As informações apresentadas pela plataforma destinam-se a
              apoiar a organização e consulta. O utilizador deve confirmar
              os prazos e obrigações aplicáveis à sua situação junto das
              fontes oficiais e de um profissional qualificado.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              5. Planos e pagamentos
            </h2>
            <p>
              Futuramente, a plataforma poderá disponibilizar planos pagos,
              subscrições e outros serviços. As condições, preços, impostos,
              formas de pagamento, cancelamentos e reembolsos serão comunicados
              antes da contratação.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              6. Disponibilidade do serviço
            </h2>
            <p>
              Poderão ocorrer interrupções temporárias para manutenção,
              actualizações, correcções técnicas ou situações fora do
              controlo da plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              7. Protecção de dados
            </h2>
            <p>
              O tratamento de dados pessoais é realizado de acordo com a
              Política de Privacidade do Fiscalidade Digital.
            </p>

            <Link
              href="/privacy"
              className="mt-2 inline-block font-semibold text-sky-600 hover:underline"
            >
              Consultar Política de Privacidade
            </Link>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              8. Alterações aos termos
            </h2>
            <p>
              Estes termos poderão ser actualizados para reflectir alterações
              legais, técnicas ou funcionais. A versão actualizada será
              disponibilizada nesta página.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              9. Contacto
            </h2>
            <p>
              Para questões relacionadas com estes termos, o utilizador
              poderá contactar a equipa do Fiscalidade Digital através
              dos canais oficiais da plataforma.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href="/privacy"
            className="font-semibold text-sky-600 hover:underline"
          >
            Política de Privacidade →
          </Link>
        </div>
      </div>
    </main>
  );
}