# Relatório de execução — 29-09-2026

## 1. Checkout, branch e preservação

- Pasta: `C:\Users\rokhan\fiscalidade-digital`.
- Branch: `codex/security-auth-documents`.
- HEAD e `main`: `cdfe345c5dff8c64ab9d0bfb759ae9869132ce23`. Não foi criado commit; o trabalho está no working tree da branch.
- Estado medido na verificação final: 42 entradas tracked modificadas e 34 entradas untracked. Isso inclui alterações locais anteriores, 19 originais salvaguardadas e ficheiros de auditoria/código desta fase. Não se deve interpretar todo o diff como criado nesta fase.
- O manifesto `safety-backup-pre-p0-20260928/manifest.json` foi comparado novamente: 19 entradas, zero ficheiros em falta, zero divergências SHA-256. Os originais não foram apagados, limpos nem substituídos.
- A entrada tracked `tsconfig.build.tsbuildinfo` continua igual ao hash da salvaguarda. Builds posteriores usaram `incremental=false` e pasta temporária, removida após a execução.
- Não houve `reset`, `clean`, checkout destrutivo, commit, push, merge, deploy, migração ou ligação à Neon.

Os 19 originais salvaguardados são: `tsconfig.build.tsbuildinfo`; `backend/audit-before-cleanup.js`; `backend/cleanup-test-data.js`; `backend/payroll-diff.txt`; `backend/preview-cleanup.js`; cinco SQL locais de notificações/migração em `backend/prisma/`; quatro backups locais de schema Prisma; `backend/src/mail/alerts.service.before-notifications-full.ts`; dois ficheiros corrompidos de obligations; e dois backups de `payroll.service`. Os caminhos e hashes exactos mantêm-se no manifesto do backup.

## 2. Trabalho executado nesta fase

- Fechada uma falha no `POST /alerts/check`: execução manual passou a OWNER/ADMIN e só consulta obrigações do tenant obtido do JWT. O scheduler interno continua a processar todos os tenants.
- Removida a atribuição automática de retenção de 6,5% no registo com base no tipo societário. Regime e tipo usam os campos obrigatórios do DTO; não se deduz retenção sem enquadramento validado.
- O registo agora grava `createdAt` como início do trial e `trialEndsAt` configurável por `TRIAL_DURATION_DAYS` (7 dias por omissão; duração inteira positiva validada). A autorização pós-trial continua por implementar; não foi activado bloqueio.
- Adicionado teste de regressão ao registo, configuração Jest (`test/jest.config.json`) e scripts `test`/`test:security`. As dependências Jest/ts-jest foram declaradas no package e lockfile.
- Corrigido o setup de seis specs unitários com mocks explícitos para as dependências Nest e acrescentado teste de construção do controller activo de fornecedores. A suite global passou sem remover ou desactivar testes. O ficheiro `supplier.controller.spec.ts` contém ainda uma cópia antiga da classe de produção; foi mantido para preservar o conteúdo existente e continua a ser dívida de duplicação.
- Payroll: criação e cálculo agora exigem OWNER/ADMIN/ACCOUNTANT; aprovação e marcação manual de pagamento exigem OWNER/ADMIN. As consultas continuam limitadas ao tenant do principal autenticado. Novo DTO valida mês/ano e testes cobrem papéis, origem do tenant e limites do período. A marcação `PAID` continua a ser confirmação manual sem prova de liquidação externa.
- Facturas de compra: a página saiu do armazenamento React local e usa a API de compras/fornecedores. DTOs limitam entrada; fornecedor vem da lista do tenant e a autorização por operação é explícita. IVA e retenção são montantes obrigatórios da factura fonte, sem cálculo presumido de taxa; o backend/schema ainda usam `Float`/`number` e não têm precisão monetária validada. Removido o botão de anexos sem implementação.
- A matriz de funções aplicada a payroll e compras é provisória e conservadora; a política geral de permissões ainda requer validação do proprietário e testes HTTP por tenant/papel.
- O Jest passou a carregar `reflect-metadata` no setup, necessário para avaliar DTOs com decoradores.
- Aplicado `npm audit fix --omit=dev` sem `--force`; dependências dentro da gama compatível foram actualizadas. O relatório residual continuou a falhar, como esperado, por avisos que exigem major ou não têm correcção. `npm install --include=dev` repôs as ferramentas de desenvolvimento que a opção `--omit=dev` havia removido do `node_modules`.
- Criados/actualizados: [auditoria técnica](AUDITORIA-TECNICA-SEGURANCA.md), [auditoria fiscal](AUDITORIA-FISCAL-ANGOLA.md), [fluxo operacional](FLUXO-OPERACIONAL.md) e [documentos/quotas/subscrições](DOCUMENTOS-QUOTAS-SUBSCRICOES.md).

## 3. Validações e comandos

| Comando e ambiente | Resultado | Observação |
|---|---|---|
| `npm test` em `backend/` (após payroll e facturas de compra) | Exit 0; 23 suites e 44 testes passaram | Suite unitária sem PostgreSQL/HTTP E2E. Uma execução anterior tinha 7 suites falhadas; essa falha levou à correcção dos mocks/teste e não é o resultado final. |
| `npm test -- --runTestsByPath src/purchase-invoice/purchase-invoice.controller.spec.ts src/payroll/payroll.controller.spec.ts` em `backend/` | Exit 0; 2 suites, 8 testes passaram | Testes unitários de papéis, tenant do principal e validação de entrada; não executa HTTP ou BD. |
| `npm run test:security` em `backend/` (inclui payroll e compras) | Exit 0; 9 suites e 30 testes passaram | Testes unitários com Prisma mockado; não iniciam HTTP nem PostgreSQL. Incluem tenant/guard de alertas, documentos, JWT, registo, trial e políticas de payroll/compras. |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json` em `backend/` | Exit 0 | Verificação TypeScript sem escrever artefactos de build. |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false -p tsconfig.json` em `frontend/` | Exit 0 | Verificação TypeScript sem escrever artefactos de build. |
| `node node_modules/@nestjs/cli/bin/nest.js build --path .codex-payroll-validation.json` em `backend/` | Exit 0 | Config temporária estende `tsconfig.build.json`, desactiva incremental e escreve em `.codex-payroll-validation-output`; ambos removidos depois. Não executa `prisma generate` nem valida BD. |
| `node node_modules/prisma/build/index.js validate` em `backend/` | Exit 0; schema válido | Prisma leu configuração local, mas não abriu conexão. Aviso: `package.json#prisma` está depreciado e é sobreposto por `prisma.config.ts`. |
| `npm run build` no clone temporário do frontend, após a alteração final | Exit 0; Next.js 14.1.0, lint/tipos e 37 páginas estáticas | A tentativa em sandbox falhou com `spawn EPERM`; escalada no clone temporário passou. O clone foi removido e o `.next` do checkout não foi tocado. Uma tentativa `--dist-dir` anterior falhou porque Next 14 tratou o valor como directório de projecto. |
| `npm run lint` em `backend/` | Exit 1; 9.494 problemas: 9.376 erros, 118 avisos; 8.622 erros potencialmente autofixáveis | Prettier domina, mas existem avisos de segurança de tipos. Não se fez autofix em massa. |
| `npm audit --omit=dev --audit-level=low` em `backend/` | Exit 1; 19 vulnerabilidades runtime: 1 baixa, 7 moderadas, 10 altas, 1 crítica | Inclui Nest/platform-express, body-parser/Multer, nodemailer, bcrypt/tar, Prisma/deepmerge, lodash, uuid e `xlsx`. A auditoria aponta mudanças major para parte das correcções e nenhuma correcção para `xlsx`. |
| `npm audit fix --omit=dev` em `backend/` | Exit 1; alterou 5 pacotes, adicionou 1 e removeu 2; sobraram 19 vulnerabilidades runtime | Não usou `--force`; não mudou deliberadamente versões major. O comando removeu dependências de desenvolvimento do `node_modules`, que foram depois repostas por `npm install --include=dev`. |
| `npm install --include=dev` em `backend/` | Exit 0; adicionou 566 pacotes, mudou 1 e auditou 863; reportou 37 problemas totais (4 baixos, 14 moderados, 18 altos, 1 crítico) | Houve avisos de versões antigas de `glob` e aviso EPERM de limpeza em `node_modules`. Build e testes dirigidos passaram depois da reposição. |
| `git diff --check` no checkout | Exit 0 | Apenas avisos de conversão LF/CRLF do Git; sem erro de whitespace no diff verificado. |
| Verificação SHA-256 do manifesto | Exit 0; 19/19 iguais | Não revela nem imprime conteúdo dos ficheiros. |

## 4. Matriz de estado por domínio

| Domínio | Estado desta auditoria |
|---|---|
| Autenticação e isolamento multiempresa | Melhorias e testes unitários presentes; a revisão endpoint a endpoint e testes HTTP A/B estão incompletos. |
| Uploads/documentos | Rota estática pública removida em alteração anterior, metadata sanitizada e download autenticado; o provider continua local. Quota transaccional, antivírus e teste HTTP ainda não existem. |
| IVA, IRT, II, IP, IS, IAC, IEC e retenções | Fórmulas/campos existem em partes do sistema, mas não há cálculo fiscal declarado validado nesta ronda. Ver matriz e fontes em `AUDITORIA-FISCAL-ANGOLA.md`. |
| Payroll/INSS | Payroll existe e usa alguns campos Decimal, mas converte para `number`; escalões IRT fixos, base legal e contribuição patronal carecem de confirmação e testes completos. As operações de criação/cálculo e aprovação/pagamento agora têm papéis distintos; falta HTTP/BD A/B. |
| Facturas de compra | A página usa agora API/fornecedores reais; DTO e papéis adicionados. Montantes de IVA/retenção são transcritos e obrigatórios. Aritmética usa `number`/`Float`, sem validação decimal; anexos não ligados. |
| Trial/subscrição | Novos registos preenchem `createdAt`/`trialEndsAt` com duração configurável; empresas anteriores podem ter `trialEndsAt` nulo, não há guard de expiração nem checkout confirmado. |
| Alertas | Manual tenant-scoped e com perfil exigido; envio real, retries e idempotência concorrente não foram testados. |
| Base de dados/E2E | Schema validado; sem PostgreSQL descartável identificado, não foram executados integração, HTTP E2E nem migrações. |
| Dependências | Avisos runtime altos/críticos permanecem; não declarar pronto para produção. |

## 5. Riscos/bloqueios para disponibilização

1. Permanecem 19 vulnerabilidades no grafo de runtime, incluindo uma crítica; algumas correcções exigem avaliar mudanças major e a dependência `xlsx` não tem patch reportado.
2. Não existe prova de isolamento A/B via HTTP e BD de teste, nem teste de integração dos fluxos completos.
3. A precisão monetária não é ponta a ponta; várias entidades usam `Float` e regras fiscais não têm versionamento temporal efectivo em todos os motores.
4. A matriz legal tem itens sem diploma consolidado/artigos/tabela oficial conferidos; os cálculos devem continuar identificados como não validados.
5. Armazenamento local não satisfaz quota nem provider privado de produção. Trial/subscrição não é aplicado pelo servidor.
6. Lint permanece com mais de 9 mil erros; a maioria é formatação herdada. Deve ser separado em mudanças pequenas para preservar o diff existente.

**Conclusão desta fase:** foram feitas correcções localizadas de segurança, testes dirigidos e documentação. O objectivo total do pedido permanece em curso e o estado não é adequado a disponibilização pública. Todas as alterações continuam apenas no working tree de `codex/security-auth-documents`; não houve acção em produção. A revisão global, correcções restantes e qualquer commit/publicação dependem da próxima fase e da autorização aplicável.

## 6. Continuação P0 — migrations e HTTP Employees

### Resultado implementado

- Criada infraestrutura de integração que deriva uma ligação de teste a partir da configuração local, mas recusa host remoto e nome de base sem `test`.
- Corrigido o BOM que impedia PostgreSQL de interpretar a migration dos canais de notificação.
- Adicionadas migrations idempotentes para `FiscalAlert` e para as estruturas Employee/Payroll que existiam no schema sem histórico reproduzível.
- Validado o percurso completo de 18 migrations sobre uma base PostgreSQL 18 vazia e local.
- Adicionados testes HTTP A/B para Employees com JWT real, Prisma e fixtures próprias.

### Execuções e códigos de saída

| Execução | Ambiente | Resultado |
|---|---|---|
| Primeira migration após criar a base | PostgreSQL local isolado | Exit 1: BOM em `notification_channels` (`P3018`) |
| Segunda migration após remover BOM | PostgreSQL local isolado | Exit 1: `FiscalAlert` ausente no histórico (`P3018`) |
| Histórico com reparação de `FiscalAlert` | PostgreSQL local isolado | Exit 0: 17 migrations; drift posterior revelou Employee/Payroll ausentes |
| Histórico final desde base vazia | PostgreSQL local isolado | Exit 0: 18 migrations aplicadas |
| Comparação base migrada → schema | PostgreSQL local isolado, apenas leitura | Exit 0: `No difference detected` |
| Primeira suite HTTP Employees | PostgreSQL local isolado | Exit 1: timeout de setup; nenhum resultado funcional declarado |
| Suite HTTP Employees repetida | PostgreSQL local isolado | Exit 0: 1 suite/4 testes |
| `npm test` | Backend, mocks/fixtures locais | Exit 0: 25 suites/60 testes |
| `npm run test:security` | Backend, sem fornecedores externos | Exit 0: 9 suites/30 testes |
| TypeScript backend | Local, sem emissão | Exit 0 |
| Prisma validate | Local, sem escrita na BD | Exit 0 |
| Build backend | Local | Exit 0 |
| `git diff --check` | Working tree | Exit 0; avisos LF/CRLF |

### Limites desta evidência

- Não houve ligação à Neon, dados reais, migração de produção, envio de mensagens, pagamento, commit, push, merge ou deploy.
- A BD local contém apenas fixtures sintéticas, removidas no final da suite.
- A prova A/B ainda não abrange todos os módulos nem concorrência.
- As migrations novas são defensivas para estruturas já existentes, mas exigem revisão do estado real e backup antes de futura aplicação em produção.

## 7. Continuação P0 — integridade relacional, facturação e produtos

### Código e migrations

- `Client` e `Supplier`: DTOs de create/update/search, PATCH parcial, papéis explícitos, escopo do tenant e bloqueio 409 quando existem facturas relacionadas.
- `PurchaseInvoice`: relações Prisma e FKs PostgreSQL adicionadas para fornecedor e itens; delete do documento pai foi verificado com cascata dos itens.
- `Invoice`: DTO reforçado, RBAC explícito, numeração transaccional sob advisory lock por tenant/ano e transições de estado condicionais para impedir pagar e cancelar simultaneamente.
- `Product`: payload tipado, pesquisa limitada, PATCH parcial com limpeza explícita de descrição/código, RBAC e bloqueio de delete quando há item documental relacionado.
- Frontend: tipos concretos para clientes/facturas, remoção do fallback fiscal de 14%, totais sem documentos cancelados, acções por papel e redirect das rotas legadas `/invoice` para `/invoices`.

### PostgreSQL e HTTP

| Comando/execução | Ambiente | Resultado |
|---|---|---|
| Recriação controlada de `fiscalidade_codex_test_20260929` | PostgreSQL 18 em loopback; base vazia | Exit 0; contagem inicial de tabelas públicas = 0 |
| `npm run test:integration:local -- employee-tenant.integration-spec.ts` após base vazia | PostgreSQL local isolado | Exit 0; 19 migrations aplicadas desde zero; 1 suite/8 testes naquele ponto |
| `prisma migrate diff ... --exit-code` | Leitura da mesma base local | Exit 0; `No difference detected` |
| Primeira execução após testes de facturação | Local | Exit 1 antes de executar testes: `toHaveSize` indisponível para `Set` nos tipos Jest |
| Execução final após Facturação e Produtos | PostgreSQL local isolado | Exit 0; 1 suite/12 testes |

Os 12 testes finais cobrem Employees, Clients, Suppliers, Facturas e Produtos, incluindo JWT, papéis, Tenant A/B, payload desconhecido, PATCH parcial, referências/FKs, cascata, numeração concorrente e corrida de estado. As fixtures são sintéticas e eliminadas pela suite através da cascata do tenant.

### Gates finais desta continuação

| Gate | Resultado |
|---|---|
| Backend TypeScript `--noEmit --incremental false` | Exit 0 |
| Frontend TypeScript `--noEmit --incremental false` | Exit 0 |
| `npm test -- --runInBand` | Exit 0; 25 suites/60 testes |
| `npm run test:security -- --runInBand` | Exit 0; 9 suites/30 testes |
| `npm run build` backend | Exit 0; uma tentativa anterior falhou transitoriamente com `ENOTEMPTY` em `dist/src` |
| Build frontend com `NEXT_DIST_DIR=.tmp/next-build` | Exit 0; Next 14.1.0, 37 páginas estáticas. A tentativa normal na sandbox falhou `EPERM`; uma tentativa fora da sandbox no `.next` partilhado expirou devido ao servidor `next dev` activo; os dois processos órfãos confirmados desse build foram terminados |
| Lint dirigido de Facturação e Produtos sem diagnósticos Prettier | Zero erros/avisos de outras regras |

O build frontend usa um `distDir` configurável para não interromper o servidor de desenvolvimento activo. O directório de validação fica sob `frontend/.tmp`, já ignorado pelo Git. O ajuste automático que o Next fez em `frontend/tsconfig.json` foi removido; o ficheiro voltou exactamente ao conteúdo anterior ao build.

### Limites

- Não houve ligação ou escrita na Neon/produção, acesso a dados de clientes, migração remota, fornecedor externo, commit, push, merge ou deploy.
- As fórmulas fiscais e os campos `Float` não foram alterados nesta continuação e permanecem sem validação legal/decimal suficiente.
- As migrations foram provadas numa base vazia. A aplicação futura sobre qualquer base persistente exige backup, inspecção de drift e plano de rollback próprios desse ambiente.

## Continuação de 30-09-2026 — Facturação e Decimal

- Criada a migration aditiva `20260930110000_decimal_money_foundation`; aplicada apenas em `fiscalidade_codex_test_20260929` no PostgreSQL local. Não foi aplicada à base local principal nem à Neon.
- Produtos, facturas e linhas receberam colunas `Decimal`; os campos `Float` permanecem e são escritos em paralelo por compatibilidade.
- O backend resolve produtos no catálogo do tenant, rejeita IDs de outro tenant e persiste nome, unidade, preço e totais autoritativos. Montantes exactos são usados nos resumos, estatísticas e PDF.
- A política actual de IVA foi centralizada com referência à Lei n.º 14/23. A taxa geral continua marcada como pressuposto pendente de classificação fiscal por linha; o regime simplificado não liquida 14% na factura e recebe a menção obrigatória.
- O frontend de emissão passou a usar catálogo pesquisável, clientes reais, linhas catalogadas/livres, validação e estados acessíveis. Não usa `alert()`/`confirm()` e não apresenta o documento como certificado ou submetido à AGT.
- Testes unitários dirigidos antes da última centralização: 5 suites/9 testes. O teste HTTP final: 1 suite/12 testes, cobrindo Decimal/Float, catálogo do tenant, rejeição cross-tenant, PDF privado, numeração e estados. Os gates foram repetidos após as alterações finais e estão registados no checkpoint correspondente.
