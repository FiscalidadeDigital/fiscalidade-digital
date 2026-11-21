# Fiscalidade Digital — Auditoria de Facturação

## Estado inicial

- Início da missão: 20-11-2026 (Africa/Luanda).
- Worktree de trabalho: `C:\Users\rokhan\fiscalidade-digital\.tmp\fiscal-publication-20261119`.
- Branch: `codex/fiscal-publication-20261119`.
- Referência inicial: `3cf02e2` (igual à referência local de `origin/main`).
- O worktree principal `codex/fiscal-flow-safety` contém alterações não publicadas de outro trabalho e não será alterado por esta missão.
- Não foi executada qualquer migração, escrita remota ou alteração de documentos existentes.

## Diagnóstico concluído

O levantamento foi feito antes de qualquer alteração. Foram confirmados os seguintes defeitos:

1. Uma nota de crédito parcial bloqueia todas as notas de crédito seguintes, em vez de controlar o saldo por linha.
2. Uma nota de débito não permite indicar a correcção de preço/valor e podia ser repetida sem controlo acumulado.
3. A ligação entre uma nota e a linha de origem não era persistida, impedindo histórico completo, limites acumulados e protecção fiável contra pedidos repetidos.
4. A confirmação automática das notas não deixava registo de auditoria; a factura de origem também não apresentava o respectivo histórico de notas.
5. Alguns totais de relatórios e histórico podiam excluir notas ou incluir documentos anulados.
6. O PDF podia ultrapassar a área reservada quando as observações ou descrições eram extensas.
7. O isolamento por empresa e as permissões das rotas de facturação foram revistos e mantêm-se aplicados.

As regras fiscais que não podem ser confirmadas com os dados existentes não serão presumidas. As correcções limitam-se a preservar a factura de origem, manter os impostos já calculados na origem e impedir valores/quantidades além do saldo documentado.

## Correcções já presentes na referência inicial

- Validação automática antes da emissão de notas e bloqueio de facturas antigas sem linhas registadas.
- Recuperação defensiva da lista quando a contagem de documentos diverge da apresentação.

## Correcções implementadas

- Adicionada uma migração somente aditiva para guardar a operação da nota, a validação automática e a linha de origem. Não há alteração, recálculo ou remoção de documentos históricos.
- Notas de crédito agora permitem várias rectificações parciais até ao saldo por linha; quantidade e valor acumulados acima do documento de origem são bloqueados dentro da mesma transacção.
- Notas de débito agora recebem o valor adicional por unidade, ficam ligadas à factura e linha de origem e são protegidas contra repetição por duplo clique ou falha de comunicação.
- A emissão da nota grava a validação automática e a auditoria na mesma operação. O pagamento e o cancelamento também mantêm o respectivo registo de auditoria na mesma operação.
- Facturas de origem mostram as notas relacionadas; documentos históricos sem linhas continuam protegidos e pedem recuperação do documento de origem, sem edição da factura emitida.
- Relatórios, histórico, painel e motor fiscal passam a tratar crédito como redução, débito como acréscimo e documentos anulados fora dos totais monetários.
- A data de vencimento pode ser indicada na emissão, é preservada na conversão de Pro Forma e aparece no PDF.
- O PDF foi reforçado para descrições e observações extensas, sem sobrepor totais ou rodapé.
- A exportação SAF-T permanece bloqueada enquanto não existir confirmação oficial de certificação; uma configuração local não é apresentada como prova de disponibilidade externa.

## Testes da missão

- Validação do schema Prisma: aprovada em 21-11-2026, com URL local fictícia e sem ligação à base de dados.
- TypeScript direccionado do backend (facturas, pagamentos, motor fiscal e painel): aprovado.
- Facturas, notas e PDF: 33 verificações aprovadas; a verificação posterior da emissão e auditoria automática totalizou 19 verificações aprovadas.
- Pagamentos: 5 verificações aprovadas, incluindo repetição segura, concorrência e limite de saldo.
- Histórico e motor fiscal: 7 verificações aprovadas.
- SAF-T: 6 verificações aprovadas.
- TypeScript do frontend: aprovado.
- Interface de facturas e relatórios: 10 verificações aprovadas.
- A integração HTTP com base de dados não foi executada: não existe `DATABASE_URL` de teste no worktree e o serviço local de base de dados não está disponível. Nenhuma base remota foi usada.
- Build do frontend: aprovado.
- Compilação do backend: aprovada. O comando completo ficou bloqueado na obtenção de um componente Prisma indisponível no ambiente local, antes da compilação; por isso não é marcado como aprovado na íntegra.

## Actualização de validação final

- Build do frontend: aprovado em 21-11-2026.
- Compilação do backend: aprovada em 21-11-2026.
- O comando completo do backend ficou dependente de descarregar um componente local do Prisma, indisponível neste ambiente; a compilação do serviço foi executada directamente e terminou sem erros.
- A verificação completa de lint excedeu o limite local de 60 segundos antes de devolver um resultado; não é marcada como aprovada.
- A integração HTTP com base de dados continua pendente apenas por não existir uma base de dados de teste local disponível. Nenhuma base de dados remota foi usada.

## Estado do Git e deploy

- Commit local preparado: `1dc01e8` (`fix(fiscal): strengthen invoice adjustments`).
- A pré-publicação autorizada será solicitada a partir da branch `codex/fiscal-publication-20261119` após esta validação final.
- A migração não foi aplicada a qualquer base de dados.
- Produção exige nova autorização explícita para este conjunto de alterações e confirmação do plano de reversão.
