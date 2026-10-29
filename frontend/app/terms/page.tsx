import Link from 'next/link';
import LegalDocumentLayout, { type LegalSection } from '@/components/legal/LegalDocumentLayout';

export const metadata = {
  title: 'Termos de Utilização | Fiscalidade Digital',
  description: 'Termos de utilização da plataforma Fiscalidade Digital.',
};

const sections: readonly LegalSection[] = [
  { id: 'sobre-a-plataforma', title: '1. Sobre a plataforma' },
  { id: 'criacao-da-conta', title: '2. Criação da conta' },
  { id: 'utilizacao-responsavel', title: '3. Utilização responsável' },
  { id: 'informacoes-fiscais', title: '4. Informações fiscais' },
  { id: 'planos-e-pagamentos', title: '5. Planos e pagamentos' },
  { id: 'disponibilidade-do-servico', title: '6. Disponibilidade do serviço' },
  { id: 'proteccao-de-dados', title: '7. Protecção de dados' },
  { id: 'alteracoes-aos-termos', title: '8. Alterações aos termos' },
  { id: 'contacto', title: '9. Contacto' },
];

export default function TermsPage() {
  return (
    <LegalDocumentLayout activeDocument="terms" title="Termos de Utilização" description="Condições para a utilização da plataforma Fiscalidade Digital." updatedAt="18 de Setembro de 2026" sections={sections}>
      <section id="sobre-a-plataforma">
        <h2 className="text-xl font-semibold text-slate-900">1. Sobre a plataforma</h2>
        <p className="mt-3">A Fiscalidade Digital é uma plataforma tecnológica destinada a apoiar empresas e profissionais na organização e gestão de informações fiscais, contabilísticas e administrativas.</p>
      </section>
      <section id="criacao-da-conta">
        <h2 className="text-xl font-semibold text-slate-900">2. Criação da conta</h2>
        <p className="mt-3">O utilizador deve fornecer informações verdadeiras, completas e actualizadas durante o registo. Cada utilizador é responsável pela confidencialidade das suas credenciais de acesso.</p>
      </section>
      <section id="utilizacao-responsavel">
        <h2 className="text-xl font-semibold text-slate-900">3. Utilização responsável</h2>
        <p className="mt-3">É proibida a utilização da plataforma para actividades ilícitas, tentativas de acesso não autorizado, manipulação de dados, distribuição de código malicioso ou interferência no funcionamento do serviço.</p>
      </section>
      <section id="informacoes-fiscais">
        <h2 className="text-xl font-semibold text-slate-900">4. Informações fiscais</h2>
        <p className="mt-3">As informações apresentadas pela plataforma destinam-se a apoiar a organização e consulta. O utilizador deve confirmar os prazos e obrigações aplicáveis à sua situação junto das fontes oficiais e de um profissional qualificado.</p>
      </section>
      <section id="planos-e-pagamentos">
        <h2 className="text-xl font-semibold text-slate-900">5. Planos e pagamentos</h2>
        <p className="mt-3">Futuramente, a plataforma poderá disponibilizar planos pagos, subscrições e outros serviços. As condições, preços, impostos, formas de pagamento, cancelamentos e reembolsos serão comunicados antes da contratação.</p>
      </section>
      <section id="disponibilidade-do-servico">
        <h2 className="text-xl font-semibold text-slate-900">6. Disponibilidade do serviço</h2>
        <p className="mt-3">Poderão ocorrer interrupções temporárias para manutenção, actualizações, correcções técnicas ou situações fora do controlo da plataforma.</p>
      </section>
      <section id="proteccao-de-dados">
        <h2 className="text-xl font-semibold text-slate-900">7. Protecção de dados</h2>
        <p className="mt-3">O tratamento de dados pessoais é realizado de acordo com a Política de Privacidade da Fiscalidade Digital.</p>
        <Link href="/privacy" className="mt-3 inline-block font-semibold text-[#0b6f93] underline-offset-4 hover:underline">Consultar Política de Privacidade</Link>
      </section>
      <section id="alteracoes-aos-termos">
        <h2 className="text-xl font-semibold text-slate-900">8. Alterações aos termos</h2>
        <p className="mt-3">Estes termos poderão ser actualizados para reflectir alterações legais, técnicas ou funcionais. A versão actualizada será disponibilizada nesta página.</p>
      </section>
      <section id="contacto">
        <h2 className="text-xl font-semibold text-slate-900">9. Contacto</h2>
        <p className="mt-3">Para questões relacionadas com estes termos, o utilizador poderá contactar a equipa da Fiscalidade Digital através dos canais oficiais da plataforma.</p>
      </section>
    </LegalDocumentLayout>
  );
}
