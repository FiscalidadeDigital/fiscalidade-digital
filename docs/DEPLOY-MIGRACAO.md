# Deploy de migrações fiscais — revisão manual obrigatória

> Estado: preparado para revisão. Este documento **não autoriza** executar
> qualquer migração na produção. A aplicação de produção é uma acção manual do
> operador aprovado, depois de backup e validação na branch Neon.

## Migração nova nesta entrega

| Ficheiro | Alterações | Aditiva? | Reversível? |
| --- | --- | --- | --- |
| `backend/prisma/migrations/20261108090000_fiscal_enrollment_lifecycle/migration.sql` | Acrescenta `Tenant.activityStartedAt`, `Tenant.hasPriorUnregularizedObligations`, `TaxRegimeAssignment.knowledgeStatus` e `FiscalObligation.referenceYear`/índice; torna opcionais os campos de regime legado; acrescenta estados a `ObligationStatus`. | Maioritariamente sim. Acrescenta colunas, índice e valores sem apagar linhas. A remoção de `NOT NULL`/`DEFAULT` é uma alteração de compatibilidade, não uma perda de dados. | Parcial. As colunas e o índice podem ser removidos depois de validar que não são usados. Voltar a `NOT NULL` exige primeiro preencher todos os nulos. Valores de enum PostgreSQL não têm remoção simples e segura. |

### Risco especial: valores novos de enum

Os valores `FUTURE`, `DUE_SOON`, `IN_DEADLINE`, `OVERDUE`, `FULFILLED`,
`TO_DETERMINE` e `HISTORICAL_CONFIRMATION` são aditivos. Depois de usados em
linhas de produção, uma reversão de aplicação que não os compreenda pode falhar
ou interpretar mal o estado. PostgreSQL não permite um `DROP VALUE` simples
para enum; recriar o tipo em produção é uma operação de risco e não é uma
estratégia de rollback durante incidente.

## Procedimento obrigatório antes do deploy

1. **[CONFIRMAR] Backup.** Criar uma branch Neon a partir de produção,
   identificada com data, hora e ticket de release. Não usar a branch de
   produção para ensaio.
2. **[CONFIRMAR] Preparar a branch Neon.** Configurar `DATABASE_URL` somente
   para a branch de backup/ensaio e confirmar o host e o nome da branch antes
   de qualquer comando. Guardar o ID da branch Neon no registo de release.
3. **Ensaiar na branch Neon.** Executar manualmente
   `npx prisma migrate deploy` dentro de `backend/`, contra a branch Neon.
   Verificar `_prisma_migrations`, gerar o cliente, executar build e testes
   aplicáveis e rever as contagens da simulação só de leitura:
   `npm run fiscal:simulate`.
4. **Validar dados.** Confirmar que não existem obrigações antes da data de
   início declarada a ser tratadas como exigíveis, que estados novos são
   compreendidos nas APIs e que as consultas históricas continuam a abrir.
5. **[CONFIRMAR] Aplicar manualmente à produção, antes do deploy.** Com a
   janela de manutenção aprovada, criar uma nova branch/backup Neon de
   produção e executar o mesmo `npx prisma migrate deploy` num job único,
   autenticado e registado contra a **produção**. Não aplicar SQL avulso: o
   Prisma deve também registar a migração em `_prisma_migrations`.
6. **Confirmar ausência de pendências.** Antes de liberar o Render, comparar
   a lista de migrações aplicadas com o repositório. O comando de arranque
   actual do backend é `npx prisma migrate deploy && node dist/main`; após o
   passo 5 ele já não deve encontrar migrações pendentes.
7. Só então fazer o deploy do Render e observar logs, métricas e consultas de
   leitura. Nunca usar esse arranque como primeira aplicação desta migração.

## Ordem exacta de publicação

Esta ordem é obrigatória para a migração
`20261108090000_fiscal_enrollment_lifecycle`; não se executa contra uma base
remota nesta tarefa.

1. **[CONFIRMAR] Criar backup/branch Neon.** Criar uma branch Neon a partir de
   produção, guardar o ID e manter a produção inalterada.
2. **[CONFIRMAR] Ensaiar na branch.** Apontar `DATABASE_URL` exclusivamente
   para essa branch, aplicar manualmente `npx prisma migrate deploy`, confirmar
   `_prisma_migrations`, gerar o cliente, executar build e testes e correr
   apenas a simulação de leitura.
3. **Verificar compatibilidade e dados.** Antes de escrever dados novos,
   confirmar que a versão actualmente publicada (`bba7ef1`) ainda lê o
   esquema migrado. A alteração é estruturalmente aditiva/relaxante, mas essa
   versão antiga só é aceitável num ensaio de leitura contra dados antigos:
   depois da migração o `DEFAULT GERAL` de `Tenant.regime` deixa de existir e
   o onboarding antigo pode gravar/devolver `regime = NULL`. Ela também deixa
   de ser segura depois de serem gravados `regime = NULL` ou os novos valores
   de `ObligationStatus`, que o Prisma antigo não conhece. O ensaio deve,
   portanto, testar a aplicação antiga contra a branch migrada sem permitir
   escritas nem fluxos que gravem esses valores novos.
4. **[CONFIRMAR] Migrar produção manualmente, antes do Render.** Numa janela
   aprovada, repetir o comando Prisma uma vez, com credencial de produção, e
   confirmar que nenhuma migração fica pendente. Assim o arranque do Render
   não é a primeira aplicação nem tem nada para migrar.
5. **Deploy do backend no Render.** Confirmar health check, logs sem erro de
   Prisma, criação/leitura de enquadramentos e que o agendador apenas simula
   ou respeita o limite configurado.
6. **Só depois deploy do frontend no Vercel.** Se o frontend for publicado
   antes do backend, pode apresentar estados/endpoints novos que o backend
   antigo não compreende ou rejeitar uma alteração de regime. Bloquear a
   promoção do preview até o passo 5 e verificar a versão da API antes de
   liberar o Vercel.

## Reversão

1. Parar o rollout e encaminhar tráfego para a revisão de aplicação anterior
   apenas se ela continuar compatível com o esquema novo; estados de enum já
   gravados devem ser avaliados primeiro.
2. Para rollback de dados/esquema, restaurar ou promover a branch Neon criada
   no passo 1. É a reversão preferida porque preserva coerência entre enum,
   schema e dados.
3. Só com uma revisão manual aprovada, e depois de export/backup adicional,
   pode-se fazer reversão estrutural: migrar valores novos de enum para estados
   compatíveis, garantir que `Tenant.regime` e `TaxRegimeAssignment.regime`
   não têm nulos antes de reintroduzir `NOT NULL`, e só então remover as
   colunas novas. Não recriar enums na produção durante um incidente.
4. Registar a decisão, os IDs das branches Neon e a validação pós-reversão.

Não foi aplicada qualquer migração na produção por esta tarefa.

## Porta adicional para a numeração fiscal

O formato aceite pelo preflight fiscal é `Tipo Série/Sequência`, como
`FT FT2026/00001`. A emissão nova cria prospectivamente uma série anual por
tipo (`FT2026`, `NC2026` e `ND2026`), com sequência e cadeia de assinatura
separadas. Confirme essa convenção com a política de séries aprovada para cada
empresa antes da activação operacional.

Não é permitido renumerar documentos já emitidos para satisfazer esta porta.
Documentos legados com hífens continuam bloqueados na exportação até serem
tratados por um procedimento fiscalmente autorizado; a transição deve ser
prospectiva, ensaiada numa base isolada e acompanhada por validação estrutural
do ficheiro.
