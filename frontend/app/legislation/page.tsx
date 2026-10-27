import { redirect } from 'next/navigation';

/**
 * A pesquisa documental continua disponível ao Assistente Fiscal. Esta rota é
 * mantida apenas para que links antigos não deixem uma página órfã.
 */
export default function LegislationRedirectPage() {
  redirect('/assistant');
}
