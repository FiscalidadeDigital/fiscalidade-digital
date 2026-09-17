
import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade | Fiscalidade Digital',
  description:
    'Política de privacidade e protecção de dados do Fiscalidade Digital.',
};

export default function PrivacyPage() {
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
          Política de Privacidade
        </h1>

        <p className="mb-8 text-sm text-slate-500">
          Última actualização: 18 de Setembro de 2026
        </p>

        <div className="space-y-8 leading-7">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              1. Objectivo
            </h2>
            <p>
              Esta Política de Privacidade explica como o Fiscalidade Digital
              poderá recolher, utilizar, armazenar e proteger os dados pessoais
              fornecidos pelos utilizadores.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              2. Dados recolhidos
            </h2>
            <p>
              Dependendo das funcionalidades utilizadas, poderão ser recolhidos
              dados como nome, email, telefone, NIF, informações da empresa,
              dados de acesso e informações necessárias para utilização
              dos serviços.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              3. Finalidade do tratamento
            </h2>
            <p>
              Os dados poderão ser utilizados para criar e gerir contas,
              disponibilizar funcionalidades fiscais, prestar suporte,
              melhorar a segurança, comunicar alterações do serviço e cumprir
              obrigações legais aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              4. Segurança
            </h2>
            <p>
              São aplicadas medidas técnicas e organizacionais destinadas
              a proteger os dados contra acesso não autorizado, perda,
              alteração ou divulgação indevida. Nenhum sistema electrónico
              pode garantir segurança absoluta.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              5. Partilha de dados
            </h2>
            <p>
              Os dados não serão partilhados de forma incompatível com as
              finalidades informadas. Poderão ser utilizados prestadores
              tecnológicos necessários ao funcionamento da plataforma,
              observando as obrigações de segurança e confidencialidade
              aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              6. Pagamentos futuros
            </h2>
            <p>
              Caso sejam implementados pagamentos, determinados dados poderão
              ser processados por prestadores de serviços de pagamento.
              Os dados completos dos cartões não deverão ser armazenados
              directamente pela plataforma, salvo quando existir uma base
              legal, técnica e de segurança adequada.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              7. Direitos dos utilizadores
            </h2>
            <p>
              O utilizador poderá solicitar informações sobre o tratamento
              dos seus dados, actualização de informações incorrectas e,
              quando aplicável, exercer os direitos previstos na legislação
              de protecção de dados em vigor.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              8. Conservação dos dados
            </h2>
            <p>
              Os dados serão conservados durante o período necessário para
              cumprir as finalidades informadas, obrigações legais, resolução
              de conflitos e manutenção da segurança dos serviços.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              9. Actualizações
            </h2>
            <p>
              Esta política poderá ser actualizada sempre que necessário.
              A data da última actualização será indicada nesta página.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-slate-900">
              10. Contacto
            </h2>
            <p>
              Para questões relacionadas com privacidade e protecção de dados,
              o utilizador deverá utilizar os canais oficiais de contacto
              do Fiscalidade Digital.
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <Link
            href="/terms"
            className="font-semibold text-sky-600 hover:underline"
          >
            ← Termos de Utilização
          </Link>
        </div>
      </div>
    </main>
  );
}