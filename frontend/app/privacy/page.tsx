import LegalDocumentLayout, { type LegalSection } from '@/components/legal/LegalDocumentLayout';

export const metadata = {
  title: 'Política de Privacidade | Fiscalidade Digital',
  description: 'Política de privacidade e protecção de dados da Fiscalidade Digital.',
};

const sections: readonly LegalSection[] = [
  { id: 'objectivo', title: '1. Objectivo' },
  { id: 'dados-recolhidos', title: '2. Dados recolhidos' },
  { id: 'finalidade-do-tratamento', title: '3. Finalidade do tratamento' },
  { id: 'seguranca', title: '4. Segurança' },
  { id: 'partilha-de-dados', title: '5. Partilha de dados' },
  { id: 'pagamentos-futuros', title: '6. Pagamentos futuros' },
  { id: 'direitos-dos-utilizadores', title: '7. Direitos dos utilizadores' },
  { id: 'conservacao-dos-dados', title: '8. Conservação dos dados' },
  { id: 'actualizacoes', title: '9. Actualizações' },
  { id: 'contacto', title: '10. Contacto' },
];

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout activeDocument="privacy" title="Política de Privacidade" description="Informação sobre o tratamento e a protecção de dados na plataforma." updatedAt="18 de Setembro de 2026" sections={sections}>
      <section id="objectivo">
        <h2 className="text-xl font-semibold text-slate-900">1. Objectivo</h2>
        <p className="mt-3">Esta Política de Privacidade explica como a Fiscalidade Digital poderá recolher, utilizar, armazenar e proteger os dados pessoais fornecidos pelos utilizadores.</p>
      </section>
      <section id="dados-recolhidos">
        <h2 className="text-xl font-semibold text-slate-900">2. Dados recolhidos</h2>
        <p className="mt-3">Dependendo das funcionalidades utilizadas, poderão ser recolhidos dados como nome, email, telefone, NIF, informações da empresa, dados de acesso e informações necessárias para utilização dos serviços.</p>
      </section>
      <section id="finalidade-do-tratamento">
        <h2 className="text-xl font-semibold text-slate-900">3. Finalidade do tratamento</h2>
        <p className="mt-3">Os dados poderão ser utilizados para criar e gerir contas, disponibilizar funcionalidades fiscais, prestar suporte, melhorar a segurança, comunicar alterações do serviço e cumprir obrigações legais aplicáveis.</p>
      </section>
      <section id="seguranca">
        <h2 className="text-xl font-semibold text-slate-900">4. Segurança</h2>
        <p className="mt-3">São aplicadas medidas técnicas e organizacionais destinadas a proteger os dados contra acesso não autorizado, perda, alteração ou divulgação indevida. Nenhum sistema electrónico pode garantir segurança absoluta.</p>
      </section>
      <section id="partilha-de-dados">
        <h2 className="text-xl font-semibold text-slate-900">5. Partilha de dados</h2>
        <p className="mt-3">Os dados não serão partilhados de forma incompatível com as finalidades informadas. Poderão ser utilizados prestadores tecnológicos necessários ao funcionamento da plataforma, observando as obrigações de segurança e confidencialidade aplicáveis.</p>
      </section>
      <section id="pagamentos-futuros">
        <h2 className="text-xl font-semibold text-slate-900">6. Pagamentos futuros</h2>
        <p className="mt-3">Caso sejam implementados pagamentos, determinados dados poderão ser processados por prestadores de serviços de pagamento. Os dados completos dos cartões não deverão ser armazenados directamente pela plataforma, salvo quando existir uma base legal, técnica e de segurança adequada.</p>
      </section>
      <section id="direitos-dos-utilizadores">
        <h2 className="text-xl font-semibold text-slate-900">7. Direitos dos utilizadores</h2>
        <p className="mt-3">O utilizador poderá solicitar informações sobre o tratamento dos seus dados, actualização de informações incorrectas e, quando aplicável, exercer os direitos previstos na legislação de protecção de dados em vigor.</p>
      </section>
      <section id="conservacao-dos-dados">
        <h2 className="text-xl font-semibold text-slate-900">8. Conservação dos dados</h2>
        <p className="mt-3">Os dados serão conservados durante o período necessário para cumprir as finalidades informadas, obrigações legais, resolução de conflitos e manutenção da segurança dos serviços.</p>
      </section>
      <section id="actualizacoes">
        <h2 className="text-xl font-semibold text-slate-900">9. Actualizações</h2>
        <p className="mt-3">Esta política poderá ser actualizada sempre que necessário. A data da última actualização será indicada nesta página.</p>
      </section>
      <section id="contacto">
        <h2 className="text-xl font-semibold text-slate-900">10. Contacto</h2>
        <p className="mt-3">Para questões relacionadas com privacidade e protecção de dados, o utilizador deverá utilizar os canais oficiais de contacto da Fiscalidade Digital.</p>
      </section>
    </LegalDocumentLayout>
  );
}
