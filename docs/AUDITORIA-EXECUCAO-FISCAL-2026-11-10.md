# Registo de execução fiscal — 2026-11-10

## Salvaguarda inicial

- Ramo de trabalho: `codex/fiscal-flow-safety`.
- HEAD inicial: `6862ef111987047ad9f8d02ca8c22bb17c823884` (`fix(fiscal): require classified IVA invoices`).
- Referência local `origin/main`: `5c9a198ee7d4d8a7d259af5fcb58bd3ffeab0480`; não foi actualizada por rede nesta execução.
- O hotfix `bba7ef1` existe e é ancestral de `HEAD` (verificação `git merge-base --is-ancestor` com saída 0).
- Não havia merge em curso nem ficheiros staged.
- O diretório de trabalho já continha alterações não commitadas em 20 ficheiros de fiscalidade, faturação, SAF-T e frontend, mais a pasta não rastreada `favicon/`. Foram tratadas como trabalho pré-existente e não serão incluídas nem modificadas por esta execução.

## Checkpoint de preservação

Antes de qualquer alteração nova foi registado o inventário do diff existente por `git diff --numstat`. Os ficheiros pré-existentes permanecem fora do escopo desta intervenção; qualquer ficheiro novo ou modificado abaixo será identificado explicitamente.

## Escopo desta execução

1. Confirmar o caminho actual de faturação e o suporte seguro para notas de crédito e débito.
2. Eliminar linguagem destinada ao cliente que revele detalhes internos ou fornecedores de serviços de inteligência artificial.
3. Validar apenas os testes directamente afectados antes dos portões finais, sem repetir suítes já evidenciadas.

## Evidências e resultados

### Reprodução inicial

- O modelo e os endpoints suportavam apenas factura (FT) e Pro Forma; não existia emissão de nota de crédito (NC) nem de nota de débito (ND).
- O PDF fixava o rótulo FT/Factura para qualquer documento.
- A transição de pagamento de uma Pro Forma ocorria antes da validação que a deveria bloquear; trata-se de defeito de consistência a corrigir junto do novo fluxo.
- A resposta do assistente e alguns contratos de importação podiam transportar detalhes internos para o navegador. A correcção limitará a superfície pública sem ler, escrever ou revelar credenciais.

### Linha de base de testes

| Comando | Limite | Resultado observado |
| --- | ---: | --- |
| `npx jest --config test/jest.config.json --runInBand src/invoice/invoice.service.spec.ts` | 60 s | excedeu o limite sem produzir resultado; ainda por diagnosticar, não classificado como aprovado |

### Ambiente local

- PostgreSQL local está disponível. O executor de integração usa uma base de testes isolada e aplica migrações; será executado uma única vez, depois dos testes unitários afectados.
- Não foram consultados nem impressos valores de ficheiros de ambiente ou credenciais.

## Execução de 11 de Novembro de 2026

### Alterações realizadas

- Foram adicionadas notas de crédito e débito a partir de uma FT normal do
  mesmo tenant. A origem não é alterada; linhas, taxas e valores fiscais são
  preservados e a quantidade de ajuste é limitada ao documento de origem.
- NC/ND têm séries e cadeia fiscal próprias, não são pagáveis directamente e
  ficam separadas de receitas/recebimentos no dashboard, histórico e regras
  fiscais. O PDF apresenta o tipo correcto e a referência de origem.
- A exportação fiscal trata NC como débito e FT/ND como crédito por linha,
  exige referência e motivo curto para ajustes e bloqueia números legados que
  não respeitam `Tipo Série/Sequência`. Não houve renumeração nem alteração
  retroactiva de documentos.
- As mensagens apresentadas ao cliente foram tornadas neutras quanto a detalhes
  internos de configuração; a indisponibilidade do Assistente Fiscal mantém
  uma resposta orientada ao utilizador.

### Validação executada

| Verificação | Resultado |
| --- | --- |
| `backend`: verificação de tipos | aprovada (95,9 s) |
| `frontend`: verificação de tipos | aprovada novamente após as últimas salvaguardas de apresentação (48,6 s) |
| apresentação do Assistente Fiscal | 5 de 5 verificações aprovadas |
| testes dirigidos de factura, PDF, motor fiscal, acompanhamento fiscal e Assistente Fiscal | 59 aprovações na primeira bateria; a falha de texto foi corrigida e o teste isolado do Assistente Fiscal aprovou 26 de 26 |
| validação da exportação fiscal | 4 de 4 testes aprovados com o validador local autorizado; não foi feita chamada externa |

### Limite conhecido e decisão pendente

Os documentos existentes com numeração legada com hífen não são libertados para
exportação fiscal. O bloqueio é intencional, pois o validador estrutural exige
`Tipo Série/Sequência`. Antes de qualquer disponibilização operacional é
necessária uma decisão formal de série/numeração e uma migração prospectiva;
esta execução não afirma certificação, homologação nem submissão a entidade
externa.

## Continuidade de 19 de Novembro de 2026

### Salvaguardas adicionais

- A apresentação de estados electrónicos, ficheiros SAF-T, compras e do
  Assistente Fiscal passou a usar mensagens operacionais, sem devolver ao
  navegador códigos, respostas de erro ou detalhes internos recebidos do
  serviço.
- A resposta e os avisos do Assistente Fiscal têm agora uma camada de
  normalização pública; conteúdo que contenha nomenclatura interna é substituído
  por uma mensagem neutra.
- A emissão concorrente de notas de crédito e débito passou a serializar a
  série fiscal por empresa, tipo de documento e ano. Isto impede que duas
  notas de origens distintas disputem o mesmo número ou elo de assinatura.

### Validação desta continuidade

| Verificação | Resultado |
| --- | --- |
| `backend`: `tsc --noEmit` | aprovada (33,6 s) |
| `frontend`: `tsc --noEmit` | aprovada (33,9 s) |
| apresentação protegida do Assistente Fiscal | 5 de 5 verificações aprovadas |
| serviço do Assistente Fiscal | 27 de 27 testes aprovados; respostas com nomenclatura interna não são expostas |
| ciclo HTTP de NC/ND numa base PostgreSQL local de teste | 2 de 2 testes aprovados: acesso por tenant, valores preservados, bloqueio de pagamento, prevenção de duplicado e emissão concorrente |
| `git diff --check` | a executar antes da entrega; apenas avisos de normalização de fim de linha observados anteriormente |

O primeiro ensaio do novo ciclo HTTP revelou somente que a API representa a taxa
decimal como texto. A asserção foi corrigida para comparar o valor fiscal, sem
alterar a API, e a repetição única do cenário foi aprovada. Nenhuma migração foi
aplicada fora da base local identificada explicitamente como base de testes.

### Correcções e validação final de 19 de Novembro de 2026

- A emissão prospectiva passou a criar números no formato `Tipo Série/Sequência`:
  `FT FT2026/00001`, `NC NC2026/00001` e `ND ND2026/00001`. Cada tipo mantém
  a sua própria série anual, sequência e cadeia de assinatura. Documentos
  históricos não foram renumerados nem alterados.
- Facturas e ajustes no regime simplificado preservam a classificação fiscal
  `IVA`/`OUT`, a isenção `M00`, o valor de imposto zero e a menção obrigatória
  do regime no documento. A informação é preservada tanto na emissão como na
  exportação estrutural.
- O cenário HTTP passou a cobrir três casos isolados: NC/ND no regime geral,
  NC no regime simplificado e emissão concorrente de ND em séries distintas.

| Verificação final | Resultado |
| --- | --- |
| `backend`: `tsc --noEmit` | aprovada (42,1 s) |
| serviço de facturação | 11 de 11 testes aprovados |
| ciclo HTTP de NC/ND na base PostgreSQL local de teste | 3 de 3 testes aprovados |
| exportação fiscal e validação estrutural local | 4 de 4 testes aprovados |
| `frontend`: `tsc --noEmit` após a revisão de apresentação | aprovada (16,5 s) |
| compilação de produção do frontend | aprovada; as rotas de NC e ND foram incluídas |

O verificador de estilo dirigido continua a revelar dívida histórica de estilo e
tipagem em ficheiros já existentes; não foi feita uma reformatação ampla nem se
alteraram comportamentos fora do escopo fiscal. A verificação de espaços e
marcadores de conflito é executada antes da publicação da revisão.

### Condições para publicação em produção

- A promoção deve partir de uma revisão que integre o ramo principal actual e
  contenha apenas alterações revistas. Esta árvore de trabalho já possuía
  alterações pendentes que não podem ser incluídas por adição global.
- Mantém-se o bloqueio de exportação para documentos com numeração legada até à
  validação do procedimento fiscalmente autorizado aplicável a esses
  documentos. Libertá-los sem esse procedimento poderia produzir um ficheiro
  fiscal estruturalmente inválido.
- A migração de produção continua a exigir cópia de segurança, ensaio em base
  separada, janela aprovada e verificação pós-publicação, conforme
  `DEPLOY-MIGRACAO.md`.
