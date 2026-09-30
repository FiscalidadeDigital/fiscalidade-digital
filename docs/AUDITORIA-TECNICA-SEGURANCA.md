# Auditoria técnica inicial — Fiscalidade Digital Angola

**Estado:** em curso; esta matriz regista a revisão P0 iniciada em 28-09-2026. Não constitui certificação de segurança, fiscal ou jurídica.

## Preservação e âmbito

- Branch: `codex/security-auth-documents`, baseada em `cdfe345c5dff8c64ab9d0bfb759ae9869132ce23` (o mesmo commit de `main` no início).
- O backup dos 19 ficheiros locais foi verificado antes do trabalho; todos os hashes permanecem iguais. Os ficheiros auxiliares não foram executados, eliminados nem incorporados.
- A auditoria lê o checkout em `backend/` e `frontend/`. Não ligou a Neon, não consultou nem alterou dados de produção e não executou migrações.
- A aplicação Nest carrega os módulos definidos em `backend/src/app.module.ts`. Os dois módulos de notificações têm implementações distintas; `NotificationsModule` (plural) não estava ligado ao `AppModule`.

## Matriz de funcionalidade e segurança

| Funcionalidade | Implementação observada | Estado | Evidência / problema concreto | Correcção ou trabalho necessário | Teste de aceitação |
|---|---|---|---|---|---|
| Registo | `POST /auth/register` cria empresa, utilizador OWNER, preferências e sincroniza obrigações | Parcial | `AuthController`, `AuthService`; o DTO aceitava passwords de 6 caracteres e confirmações booleanas falsas | Password mínima passou a 12 caracteres; confirmações têm de ser `true`; limites por IP para registo. Rever transacção/idempotência e normalização de e-mail | DTO rejeita password curta e confirmações falsas; registos repetidos/race não criam contas ambíguas |
| Login | `POST /auth/login` verifica bcrypt e utilizador activo | Parcial | `AuthService`; sem limite de tentativas e JWT com validade de 7 dias | Limite de 10 tentativas/15 min; token de 1 hora; mensagens genéricas. Rever pesquisa global por e-mail e concorrência de registos | Tentativas acima do limite dão 429; credenciais inválidas não revelam se o e-mail existe |
| Sessão/JWT | Bearer token JWT; frontend guarda token em `localStorage` e consulta `/auth/me` | Parcial | `JwtStrategy` antes confiava em `tenantId` e `role` do token e não consultava o estado actual da conta | Estratégia consulta utilizador activo e usa tenant/função actuais da BD; validade reduzida para 1 h. Não existe refresh/revogação por password change | JWT antigo não conserva função/empresa alterada e utilizador desactivado recebe 401 |
| Limites de pedidos | Não havia throttle no módulo principal | Parcial | `AppModule`, `AuthController` | Throttler global de 120/min; registo 3/h e login 10/15 min. Armazenamento actual é em memória; requer storage partilhado e validação do proxy antes de escalar | Teste de integração confirma 429 e cabeçalhos; testar atrás do proxy real antes de produção |
| Autorização por função | Prisma define OWNER, ADMIN, ACCOUNTANT e VIEWER; várias rotas dependem apenas do guard comum | Parcial | `schema.prisma`, controllers; página de gestão de utilizadores indica que está em manutenção | `JwtAuthGuard` bloqueia mutações para VIEWER; `PATCH /company` exige OWNER/ADMIN; payroll permite OWNER/ADMIN/ACCOUNTANT criar e calcular, apenas OWNER/ADMIN aprovar e marcar como paga | Cobertura unitária do metadata de payroll; matriz granular nos outros módulos e validação HTTP ainda pendentes |
| Isolamento multiempresa — CRUD principal | Controllers autenticados passam `req.user.tenantId`; serviços de clientes, funcionários, receitas, documentos e pagamentos filtram pelo tenant em várias consultas | Parcial, revisão em curso | `client.service.ts`, `employee.service.ts`, `revenue.service.ts`, `payments.service.ts`, `history.service.ts`; há padrões de pré-leitura por tenant seguidos de mutação por ID | Continuar revisão endpoint a endpoint, incluindo relações e operações transaccionais; não confiar em IDs do frontend | Testes A/B: utilizador de tenant B não lê, altera, elimina, associa nem descarrega recursos de A |
| Notificações (módulo activo) | Controller protegido e operações por tenant | Parcial | `src/notification/notification.controller.ts` e `notification.service.ts` filtram por `tenantId` | Manter cobertura de IDOR e verificar payloads/campos devolvidos | IDs de outra empresa resultam em 404 sem mutação |
| Notificações (módulo legado) | Módulo plural não montado; tinha tenant fixo e operações por ID sem tenant | Corrigido no código, ainda não montado | `src/notifications/notifications.controller.ts` e `notifications.service.ts` | Removido tenant fixo; guard JWT, tenant actual, filtros por tenant e importação de AuthModule | Testes verificam 404 e query tenant-scoped em obter, marcar lida e eliminar |
| Documentos — upload | Multer grava ficheiros localmente, limite 10 MB; filtro MIME usava apenas MIME declarado | Parcial | `document.controller.ts`, `document.service.ts` | Nomes internos com extensão derivada do MIME; validar assinatura PDF/JPEG/PNG/WEBP; limpeza do upload se validação ou persistência falhar. Falta antivírus, quota, política de retenção e registo de auditoria | Upload MIME falso rejeitado; ficheiro inválido removido; acima de 10 MB rejeitado |
| Documentos — acesso | `/uploads` era servido por `express.static`; metadata devolvia `filePath` e URL pública | Corrigido no código, falta teste HTTP de integração | `main.ts`, `document.controller.ts`, `document.service.ts`; conteúdo agora vem de `GET /documents/:id/content` sob JWT e tenant | Removido static público; caminho canónico limitado à pasta privada; metadata omite tenant/path/url internos; frontend descarrega com bearer token | Sem token = 401; tenant diferente = 404; caminho fora da pasta = 404; utilizador autorizado recebe bytes correctos e cabeçalhos privados |
| Dados de empresa | `GET/PATCH /company`; qualquer utilizador autenticado podia alterar NIF/regime e o controller aceitava `any` | Parcial, DTO agora validado | `company.controller.ts`, `company.service.ts`, `company/dto/update-company.dto.ts` | PATCH exige OWNER/ADMIN; DTO valida formato/comprimento/campos enumerados; taxa de retenção não é alterável pela API; resposta usa selecção explícita de campos | ACCOUNTANT/VIEWER recebem 403; campos desconhecidos e valores inválidos são rejeitados; resposta não inclui JSON interno de settings |
| Produtos | CRUD JWT, filtragem de consultas por tenant | Parcial, DTO e allowlist adicionados | `product.controller.ts`, `product.service.ts`; antes aceitava `any` e espalhava o body recebido para Prisma | DTOs validam nome, descrição, preço, taxa de IVA, código, estado e stock; criação/actualização mapeiam apenas campos permitidos | Campos internos como `tenantId`/`id` não podem ser definidos; valores inválidos são rejeitados; IDs de outro tenant não podem ser actualizados |
| Facturação e compras | API de compras filtra por tenant e verifica fornecedor; página agora consome a API e fornecedores do tenant | Parcial, revisão por concluir | `purchase-invoice.controller.ts` aceitava `any`; a página guardava facturas apenas em React e inferia valores de imposto | DTOs de criação/edição e papéis explícitos; selecção de fornecedor real; IVA/retenção transcritos e obrigatórios, sem inferência de taxa; faltam validar outras associações e aritmética Float no serviço/schema | Testes unitários de papéis/DTO; falta HTTP A/B, BD isolada, duplicados concorrentes e precisão monetária |
| Funcionários e payroll | Rotas JWT; folha é lida/criada por tenant do principal e IDs de folha são pré-consultados por tenant | Parcial, revisão por concluir | `payroll.controller.ts`, `payroll.service.ts`; as rotas de estado não tinham papéis explícitos e o período do body não tinha DTO validado | Payroll agora define papéis por operação e `CreatePayrollDto` valida mês/ano; falta auditar dependentes, itens, transacções de estado e escopo HTTP A/B | Teste unitário verifica papéis, tenant do principal e validação do período; testes HTTP A/B e de serviço/BD continuam necessários |
| Motor fiscal e obrigações | Serviços usam calendários, facturas, compras, receitas e payroll; regras estão distribuídas por serviços | Parcial | `fiscal-engine/`, `obligations/`, `fiscal-calendar/`, `tax-calculator/` | Auditar isolamento e proveniência legal/regime/vigência; não alterar fórmulas sem fontes oficiais | Casos fiscais independentes por regime e período; testes de isolamento por tenant |
| Alertas, e-mail, SMS e WhatsApp | Jobs agendados e integrações configuráveis; Twilio só opera com credenciais | Parcial | `mail/alerts.service.ts`, `twilio-messaging.service.ts`; registos de entrega guardavam destinatário e corpo | Logs de aplicação agora são genéricos; novos registos persistidos mascaram e-mail/telefone e guardam apenas assunto/mensagem genéricos; rever consentimento e retenção histórica | Mocks confirmam que logs novos não contêm destinatários completos nem corpo; nenhum envio real durante testes |
| Pagamentos | Registo interno de pagamentos, sem fluxo de cobrança real observado; `updateStatus` valida tenant | Parcial | `payments.controller.ts`, `payments.service.ts` | Guard comum agora aplica política VIEWER; confirmar que nenhuma integração/cobrança real está activa e testar atomicidade | Testes de tenant/role; sem chamadas externas ou transacções reais |
| Histórico, dashboard e relatórios | Endpoints protegidos; histórico agrega modelos filtrados por tenant | Parcial, revisão de campos | `history/`, `dashboard/`, páginas `reports/` | Rever campos exportados, dados demonstrativos e escopo de cada query | Conteúdo pertence apenas ao tenant autenticado; estados vazios sem valores fictícios |
| Legislação | Endpoints GET sem JWT para consulta de biblioteca | Funcional como conteúdo público | `legislation/` | Confirmar que fontes/ficheiros expostos são apenas diplomas públicos e que path de documento é validado | Acesso público apenas a documentos do catálogo; path traversal rejeitado |
| CORS/configuração | Lista de origens explícitas e variáveis; wildcard Vercel aceitava qualquer subdomínio com prefixo do projecto | Corrigido no código | `main.ts` | Removida regra wildcard; manter origem sem `Origin` para clientes não-browser; confirmar domínios finais por configuração | Origem permitida passa; origem Vercel não listada é recusada |
| Prisma/base de dados | PostgreSQL/Prisma; migrações versionadas presentes | Parcial, sem validação contra BD | `prisma/schema.prisma`, `prisma/migrations/` | Comparar schema/migrações numa BD descartável isolada; revisar FKs e operações de cascata. Nenhuma migração executada nesta fase | `prisma validate` e migrações em BD isolada; zero operações contra Neon/produção |
| Trial e planos | Schema contém `planType`, `trialEndsAt` e estado de tenant; acesso/quotas não foram provados ponta a ponta | Parcial/incompleto | `schema.prisma`, respostas de auth | Implementar cálculo autoritativo no backend e regras aprovadas; sem cobrança, apagamento ou bloqueio destrutivo | Testes de início/fim, timezone, acesso e preservação dos dados |
| Recuperação de conta/verificação de e-mail | Não foram encontrados endpoints de verificação ou recuperação no controller activo | Inexistente | `auth.controller.ts` expõe apenas registo, login e `/me` | Desenhar tokens de uso único, expiração e entrega configurável antes de disponibilizar publicamente | Token expira, só pode ser usado uma vez e não revela existência de conta |
| Aplicação frontend | Next 14, serviços Axios com bearer em localStorage; páginas existentes para operações fiscais | Parcial | `frontend/context/AuthContext.tsx`, `frontend/services/api.ts`, `frontend/app/` | Rever XSS/CSP e sessão local; validar que formulários correspondem a DTOs e não mostram dados simulados | Build, fluxos principais e erros 401/403 apresentados sem expor dados |

## Alterações P0 feitas nesta fase

- Removido o servidor estático público de `backend/uploads`.
- Adicionado endpoint autenticado de conteúdo documental, com filtro de tenant, validação de caminho real e cabeçalhos `private, no-store`, `nosniff` e CSP sandbox.
- Respostas de documentos deixaram de devolver caminho, URL pública e tenant interno; conteúdo no frontend usa Axios com bearer token.
- Upload valida assinaturas simples de PDF/JPEG/PNG/WEBP, fixa a extensão pelo MIME declarado e limpa ficheiro inválido ou órfão.
- JWT usa tenant/função actuais do utilizador activo na BD, expira em uma hora; VIEWER é só leitura e alteração de empresa exige OWNER/ADMIN.
- Aplicados limites de pedidos globais e limites mais estritos a registo/login; CORS deixou de aceitar wildcard Vercel.
- Removidos destinatários e detalhes de empresa/obrigação de logs directos de auth, payroll, alertas e Twilio; novas linhas de log de entrega guardam apenas destinatário mascarado e conteúdo genérico.
- `PATCH /company` usa DTO validado, bloqueia alterações de retenção e evita devolver `settings` interno.
- Corrigida a implementação de notificações não montada para também aplicar tenant e autenticação, eliminando o tenant hard-coded.

## Limitações e próximos passos P0

1. Completar auditoria de autorização e isolamento por endpoint, em especial payroll, obrigações, fiscal engine, compras e exportações.
2. Formalizar e aplicar matriz granular de permissões por módulo. Payroll já reserva aprovação/pagamento a OWNER/ADMIN; noutros módulos ACCOUNTANT ainda pode alterar rotas de negócio. A política geral continua sujeita a validação do proprietário.
3. Limite em memória não coordena múltiplas instâncias; `req.ip` tem de ser confirmado atrás do proxy real e migrado para storage partilhado antes de escalar.
4. Sessões no `localStorage` permanecem expostas a XSS; não há refresh/revogação de sessão por mudança de password, recuperação ou verificação de e-mail.
5. Upload ainda usa disco local sem quota, verificação antivírus, política de retenção ou trilho de auditoria; assinatura de cabeçalho não substitui análise completa de ficheiro.
6. Não foram consultadas fontes legais nesta auditoria P0 e não foi validada qualquer regra fiscal.
7. Testes HTTP de integração com autenticação/BD isolada ainda são necessários; as suites unitárias não iniciam a aplicação Nest nem PostgreSQL.

## Validação registada

- `npm run build` em `backend/`: passou numa configuração temporária não incremental, para não reescrever o `tsconfig.build.tsbuildinfo` local preexistente.
- `npm run build` em `frontend/`: passou; compilação, lint/verificação de tipos e geração de 37 páginas estáticas.
- Testes unitários de segurança documental/JWT/funções/notificações: 4 suites, 12 testes passaram; incluem caminho fora da pasta privada, rejeição de MIME falso, tenant/função actuais da BD e escopo de notificações.
- `npm run lint` em `backend/`: falhou (9.177 erros e 126 avisos no relatório completo); predominam violações de Prettier em ficheiros do checkout e há também diagnósticos de tipos inseguros. Não foi executado autofix para evitar reformatar em massa o trabalho existente. A lint dirigida aos ficheiros tocados também não passa; os erros dirigidos totalizaram 2.003 e 35 avisos, pelo que requer triagem ficheiro a ficheiro.
- Nenhum deploy, push, merge, commit, migração ou acesso a dados de produção foi realizado.

## Actualização da auditoria — 29-09-2026

Esta secção substitui os números de validação acima para o estado de código desta data. As entradas anteriores ficam como histórico, não como resultado actual.

### Novas conclusões e correcções

- A rota autenticada `POST /alerts/check` executava anteriormente uma verificação global, apesar de ser chamada manualmente por utilizador. Agora exige OWNER/ADMIN, obtém o tenant do JWT e a query manual filtra `FiscalObligation.tenantId`. O job agendado continua global por ser execução interna. Teste unitário verifica o filtro, mas não foi testada uma chamada HTTP com duas empresas reais.
- No registo, `AuthService` inferia retenção de 6,5% a partir de `companyType` e tinha defaults para regime/tipo. Isso confundia forma jurídica com tratamento fiscal. O registo agora usa os campos obrigatórios fornecidos pelo DTO e não atribui retenção automática; a regra de retenção continua por validar noutros fluxos.
- A análise fiscal identificou tabelas fixas de IVA, II, retenções e IRT sem prova suficiente de regime/vigência consolidada. O inventário e fontes consultadas estão em [AUDITORIA-FISCAL-ANGOLA.md](AUDITORIA-FISCAL-ANGOLA.md). Nenhum cálculo é declarado validado.
- A análise comercial confirmou que existem `Tenant.status`, `planType`, `trialEndsAt` e `Subscription`. O registo agora preenche fim configurável do trial para novas empresas; não há guard de expiração nem backfill definido para empresas existentes. `Document.size` é armazenado em bytes e agregado em leitura, mas não há quota. Detalhes em [DOCUMENTOS-QUOTAS-SUBSCRICOES.md](DOCUMENTOS-QUOTAS-SUBSCRICOES.md).
- Foi criada uma descrição do fluxo real e das integrações ausentes em [FLUXO-OPERACIONAL.md](FLUXO-OPERACIONAL.md).
- A execução global encontrou scaffolds `should be defined` sem providers e uma suite vazia. Foram acrescentados providers de teste e uma verificação de construção do controller activo de fornecedores; não se removeram suites nem asserções.

### Matriz de estado actual

| Módulo | Implementação actual | Problemas confirmados | Alterações nesta fase | Estado / testes necessários |
|---|---|---|---|---|
| Registo/autenticação | Tenant + OWNER, bcrypt, JWT e consulta actual do utilizador | Sem recuperação/verificação/refresh; provisionamento e sincronização ainda não têm prova de transacção global; expirado ainda não é aplicado | Removida inferência automática de 6,5%; início usa `createdAt`; fim usa `TRIAL_DURATION_DAYS` | Parcial; testes de política, depois fluxo HTTP e acesso expirado em BD isolada |
| Autorização/multiempresa | Maioria dos controllers operacionais usa JWT e tenant; guard bloqueia escrita VIEWER | Política de ACCOUNTANT/Admin não é granular em todos os módulos; não existe teste E2E A/B de ponta a ponta | Endpoint manual de alertas filtra tenant/OWNER/ADMIN; payroll reserva aprovação e pagamento a OWNER/ADMIN | Parcial; matriz por endpoint/papel e chamadas HTTP A/B continuam pendentes |
| Alertas/notificações | Scheduler interno e APIs tenant-scoped | Idempotência sob concorrência e confirmação de entrega não demonstradas; `SENT` significa aceitação do fornecedor | Escopo manual por tenant e perfil; teste de query | Parcial; testes de canal com mocks e integração HTTP pendentes |
| Documentos | Pasta privada local, JWT, filtro tenant, assinatura simples, limite de 10 MiB | Sem quota, antivírus, storage de produção validado ou autorização HTTP testada | Nenhuma alteração nesta ronda ao storage | Parcial; E2E de acesso directo e concorrência pendentes |
| Fiscal/payroll | Fórmulas locais, enums e regras Prisma versionáveis | Tabelas fixas, períodos, precisão Float/number e regras legais sem validação completa | Inventário fiscal oficial; removido default de retenção no registo e inferência fiscal na criação de compras | Não validado; ver relatório fiscal e casos independentes pendentes |
| Trial/subscrição | Campos de plano/trial e modelo Subscription | Não existe guard expirado nem checkout/eventos validados; tenants antigos podem ter `trialEndsAt` nulo | Novos registos calculam fim configurável com 7 dias por omissão; sem cobrança ou bloqueio activos | Parcial; requer backfill/política aprovada, guard e testes isolados |
| Facturas de compra | API tenant-scoped e página frontend ligada à API | `Float` no schema e `number` no serviço; anexos não ligados; testes HTTP A/B pendentes | Página já não mostra registos apenas locais; DTOs obrigatórios e montantes fiscais não inferidos no fluxo de criação | Parcial; testes unitários passaram; integração, BD isolada e precisão decimal pendentes |

### Atualização — autorização da folha salarial

- `POST /payroll` e `POST /payroll/:id/calculate` exigem OWNER, ADMIN ou ACCOUNTANT. `POST /payroll/:id/approve` e `POST /payroll/:id/pay` exigem OWNER ou ADMIN. GET continua disponível para utilizadores autenticados do tenant; os dados do tenant vêm do principal JWT pelo decorator `CurrentUser`.
- `CreatePayrollDto` converte e valida mês inteiro entre 1 e 12 e ano entre 2000 e 2100; o serviço mantém validação defensiva do período.
- A separação de funções aplicada a payroll e compras é uma política técnica conservadora; ainda precisa de validação do proprietário do produto e de uma matriz uniforme para os restantes módulos.
- O teste unitário `src/payroll/payroll.controller.spec.ts` verifica metadata de papéis, passagem do tenant autenticado e validação do DTO. Não executa guard em HTTP nem confirma acesso A/B numa BD.
- A acção `pay` continua a registar confirmação manual de pagamento após aprovação. Não existe comprovativo bancário ou integração de pagamento verificada; a marcação não prova liquidação externa.

### Actualização — facturas de compra

- `frontend/app/purchase-invoices/page.tsx` deixou de manter uma lista simulada: carrega `GET /purchase-invoice` e `GET /suppliers`, associa o fornecedor real e cria por `POST /purchase-invoice`. Tem estados de carregamento, erro e ausência de registos.
- O controller extrai o tenant através de `CurrentUser`; criar/editar exige OWNER/ADMIN/ACCOUNTANT; marcar como paga, cancelar ou remover exige OWNER/ADMIN. O serviço confirma que o fornecedor pertence ao tenant.
- DTOs validam datas, texto, números não negativos e itens aninhados. IVA e retenção são obrigatórios na criação e transcritos da factura. Foram removidas deste fluxo as inferências de IVA de 14% por regime e de retenção por configuração. Ao editar sem estes campos, os montantes documentais actuais são preservados.
- O botão sem implementação de anexar PDF foi removido. A ligação de facturas aos documentos continua por integrar. Serviço e schema ainda usam `number`/`Float` em totais e itens; não há precisão monetária ponta a ponta nem validação fiscal.
- `src/purchase-invoice/purchase-invoice.controller.spec.ts` cobre papéis, tenant do principal e DTOs; são testes unitários, sem HTTP ou PostgreSQL.

### Verificações efectivamente executadas

| Comando/ambiente | Resultado real | Limites |
|---|---|---|
| Execução global Jest anterior, antes do teste de registo | Exit 1; 20 suites, 13 passaram, 7 falharam; 27 testes, 21 passaram e 6 falharam | Histórico; supersedido pela execução `npm test` na secção de revalidação |
| `node node_modules/@nestjs/cli/bin/nest.js build --path .codex-tsconfig-validation.json` com `outDir` temporário, depois removido | Exit 0 | Compilação Nest/TypeScript; não executou `prisma generate`, HTTP E2E ou base de dados. `dist` e `tsbuildinfo` preexistentes não foram substituídos |
| `npx prisma validate` (backend) | Exit 0; schema Prisma válido | Não liga à base de dados e não valida histórico de migrações contra uma BD descartável |
| Build Next anterior em `frontend/` | Exit 0; Next 14.1.0, lint/tipos e 37 páginas estáticas | Histórico anterior à ligação da página de compras à API; substituído pela verificação final no clone temporário descrita abaixo |
| `npm run lint` (backend) | Exit 1; 9.308 problemas: 9.182 erros e 126 avisos | Maioria é Prettier; há também `any`/regras de tipo. Não foi feito autofix em massa |
| `npm install --save-dev --package-lock-only jest@30.4.2 ts-jest@29.4.11 @types/jest@30.0.0` (backend) | Exit 0; lock actualizado sem alterar versões já travadas; instalador reportou 39 vulnerabilidades: 4 baixas, 14 moderadas, 20 altas e 1 crítica | Não foi executado `npm audit` com análise por dependência e não foi aplicado `npm audit fix`; lockfile foi reserializado e precisa de revisão do diff |
| Comparação SHA-256 do manifesto de backup local | 19 entradas; zero ausentes e zero divergências | Só verifica igualdade dos 19 caminhos salvaguardados, não conteúdo de outros ficheiros locais ignorados |

### Preservação e limites de segurança

- Branch confirmada: `codex/security-auth-documents`; HEAD continua `cdfe345c5dff8c64ab9d0bfb759ae9869132ce23`, igual a `main` no início. Não foi criado commit nem houve push, merge ou deploy.
- As 19 entradas originais do backup continuam com os hashes registados. `.env` existe no backend; uploads, storage e backups locais também existem. Não foram apresentados valores de segredos nem lidos documentos de clientes. `node_modules`, `dist` e `.next` são artefactos locais presentes; os scripts de limpeza/backup untracked não foram executados.
- Não foi configurada nem identificada uma base de dados descartável isolada; não foi aberta conexão Prisma, não se executaram migrações e não se tocou na Neon.
- A instalação de dependências reportou vulnerabilidades sem identificar se afectam runtime; falta revisão de `npm audit` e decisão de actualização sem breaking changes.
- A revisão completa de cada endpoint, import/export, payroll, compras, fiscal engine, schemas/migrações e fluxos frontend permanece por concluir. Este estado não permite declarar o sistema seguro, conforme fiscalmente ou pronto para público.

### Revalidação depois da actualização de dependências

- `npm audit fix --omit=dev` (sem `--force`) actualizou dependências dentro dos intervalos compatíveis, adicionou 1, removeu 2 e mudou 5; concluiu com exit 1 porque permanecem 19 avisos runtime (1 baixo, 7 moderados, 10 altos e 1 crítico). Entre as dependências ainda reportadas estão Nest 10/platform-express, body-parser/Multer, nodemailer, bcrypt/tar e `xlsx`; o relatório indica mudanças major para algumas e nenhuma correcção para `xlsx`.
- Como `--omit=dev` removeu ferramentas locais de desenvolvimento, foi executado `npm install --include=dev` para as repor. Terminou com exit 0, adicionou 566 pacotes e auditou 863; reportou 37 avisos no grafo completo (4 baixos, 14 moderados, 18 altos e 1 crítico). Houve um aviso de limpeza EPERM de directório em `node_modules`; o CLI Nest ficou disponível e o build/testes posteriores passaram. A auditoria de dependências não está encerrada.
- Após a reposição e a política de trial: `npm run test:security` terminou com exit 0, 7 suites/22 testes; o build Nest com configuração temporária `outDir` terminou com exit 0; `node node_modules/prisma/build/index.js validate` terminou com exit 0 e schema válido (schema sem alterações nesta etapa).
- A lint global mais recente terminou com exit 1: 9.494 problemas (9.376 erros, 118 avisos; 8.622 potencialmente corrigíveis por autofix). Prettier domina o conjunto; não foi aplicado autofix em massa.
- O build frontend registado foi `npm run build` (não foi usado `--dist-dir`): exit 0, Next 14.1.0 e 37 páginas estáticas. Esse build precedeu apenas mudanças backend; os ficheiros frontend não foram alterados depois dele.
- `npm test` depois da correcção dos scaffolds e adição da política de trial terminou com exit 0: 22 suites e 37 testes passaram. Esta suite continua unitária; não substitui os testes HTTP/BD isolada.
- Nesta continuação, `npm test -- --runTestsByPath src/payroll/payroll.controller.spec.ts` terminou com exit 0: 1 suite/4 testes. A primeira execução terminou com exit 1 porque o Jest não carregava `reflect-metadata`; a configuração foi corrigida com `setupFiles` e o comando foi repetido.
- Após incluir o teste de payroll, `npm test` terminou com exit 0: 23 suites/41 testes passaram. `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json` terminou com exit 0, sem escrever artefactos de build.
- Depois da integração da factura de compra, `npm test -- --runTestsByPath src/purchase-invoice/purchase-invoice.controller.spec.ts src/payroll/payroll.controller.spec.ts` terminou com exit 0: 2 suites/8 testes; `npm run test:security` terminou com exit 0: 9 suites/30 testes; a execução global posterior `npm test` terminou com exit 0: 23 suites/44 testes.
- Verificações TypeScript sem emissão terminaram com exit 0: backend `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json`; frontend `node node_modules/typescript/bin/tsc --noEmit --incremental false -p tsconfig.json`.
- Build Nest `node node_modules/@nestjs/cli/bin/nest.js build --path .codex-payroll-validation.json` terminou com exit 0, com `outDir` temporário posteriormente removido; não substituiu `dist`/`tsbuildinfo`.
- Build Next: tentativa `npm run build -- --dist-dir .codex-next-validation-output` terminou com exit 1, pois o CLI tratou o argumento como directório de projecto. Build no clone temporário terminou com exit 1 no sandbox (`spawn EPERM` ao criar workers); a repetição escalada no clone, depois da última alteração frontend, terminou com exit 0, passou lint/tipos e gerou 37 páginas. O clone foi removido; o `.next` original não foi alterado.
- A primeira simulação `npm audit fix --dry-run --omit=dev` foi interrompida após espera prolongada sem resultado legível. Não foi considerada validação.

## Actualização P0 — PostgreSQL isolado e Employees HTTP (29-09-2026)

Esta secção substitui as afirmações anteriores de que não existia PostgreSQL descartável ou prova HTTP para Employees. O âmbito continua limitado: os restantes módulos ainda não têm cobertura A/B equivalente.

### Base de dados e migrations

- Foi criada a base local isolada `fiscalidade_codex_test_20260929` no PostgreSQL 18 em `localhost`. O runner recusa hosts não locais e nomes de base sem o marcador `test`.
- A primeira execução real do histórico encontrou BOM UTF-8 em `20260922184000_notification_channels/migration.sql`, causando `P3018`/erro de sintaxe no PostgreSQL. O BOM foi removido; nenhuma instrução SQL foi alterada.
- Depois disso, `20260922230000_notification_delivery_fields` falhou porque `FiscalAlert` existia no schema e em ambientes sincronizados, mas não tinha `CREATE TABLE` no histórico. Foi acrescentada uma migration reparadora idempotente antes da alteração dos canais.
- A comparação entre a base migrada e `schema.prisma` detectou ainda cinco tabelas, dois enums, `Legislation.subject` e a transição `Tenant.employees` → `employeeCount` sem migration. Foi criada uma migration idempotente para Employee/Payroll. A coluna histórica é renomeada, preservando o valor, quando `employeeCount` ainda não existe.
- Uma base vazia recebeu as 18 migrations com exit 0. `prisma migrate diff --exit-code` entre essa base e `schema.prisma` terminou com exit 0 e `No difference detected`.
- Estas migrations não foram executadas na Neon nem em qualquer base remota. Antes de produção ainda é obrigatório validar o estado real, backups e plano de rollback.

### Employees e isolamento multiempresa

- O teste HTTP usa Nest, Passport/JWT real, Prisma e PostgreSQL. Cria Tenant A, Tenant B, OWNERs e VIEWER com fixtures próprias.
- Tenant B recebe 404 ao tentar GET, PATCH, DELETE, criar/consultar salário e criar/consultar dependente do empregado de Tenant A. A verificação directa confirma zero mutação no registo de A.
- VIEWER recebe 403 ao consultar dados pessoais de empregados e pedidos sem token recebem 401.
- PATCH com apenas `jobTitle` preserva nome, NIF, telefone e e-mail; `email: null` faz limpeza explícita. Nome composto só por espaços recebe 400.
- Salário e dependente são criados pelo tenant proprietário. A eliminação por OWNER remove o empregado e as relações por cascata na base de teste.

### Evidência executada nesta actualização

| Comando | Resultado real |
|---|---|
| `npm run test:integration:local -- employee-tenant.integration-spec.ts` | Primeira execução: exit 1 por timeout de 5 s no `beforeAll`; depois de configurar 30 s e limpeza de fixtures reservadas, exit 0, 1 suite/4 testes |
| `prisma migrate deploy` numa base vazia | Duas execuções iniciais expuseram BOM e ausência de `FiscalAlert`; execução final: exit 0, 18/18 migrations aplicadas |
| `prisma migrate diff --from-url <base-local-test> --to-schema-datamodel prisma/schema.prisma --exit-code` | Exit 0; nenhuma diferença |
| `npm test` | Exit 0; 25 suites/60 testes |
| `npm run test:security` | Exit 0; 9 suites/30 testes |
| `tsc --noEmit --incremental false` | Exit 0 |
| `prisma validate` | Exit 0 |
| `npm run build` | Exit 0; Prisma Client gerado e Nest compilado |
| `git diff --check` | Exit 0; apenas avisos LF/CRLF |

### Riscos ainda abertos

- A cobertura PostgreSQL/HTTP A/B existe apenas para Employees; documentos, compras, facturação, payroll, obrigações e exportações continuam pendentes.
- `dependentCount` ainda pode ser fornecido manualmente e também é incrementado quando se adiciona um dependente fiscal. É necessário definir uma única fonte de verdade e criar operações de edição/remoção consistentes.
- O backend bloqueia VIEWER em Employees, mas o frontend ainda deve esconder ou explicar essa área para evitar uma experiência baseada em respostas 403.
- O runner aplica migrations e executa testes, mas pressupõe que a base local isolada já foi criada. Não cria, elimina ou recria bases automaticamente.
- O teste de cascata não cobre empregados já referenciados por `PayrollItem`, cuja FK usa `RESTRICT`; a política de arquivo/eliminação para histórico salarial ainda precisa de definição.

## Actualização P0 — clientes, fornecedores, facturação e produtos (29-09-2026)

Esta secção substitui os números de migrations e de integração da secção anterior. O âmbito continua limitado aos módulos e cenários indicados; não constitui validação integral do produto.

### Integridade da base de dados

- Foi adicionada a migration `20260923010000_purchase_invoice_relations`, que cria de forma idempotente as FKs de `PurchaseInvoice.supplierId` e `PurchaseInvoiceItem.purchaseInvoiceId`. A primeira usa `RESTRICT`; a segunda usa `CASCADE`.
- O schema Prisma passou a representar as relações Supplier → PurchaseInvoice e PurchaseInvoice → PurchaseInvoiceItem que antes existiam apenas como IDs escalares.
- Uma base PostgreSQL 18 local, vazia e com nome explicitamente marcado para testes recebeu as 19 migrations desde zero. O comando terminou com exit 0.
- A comparação da base migrada com `prisma/schema.prisma` terminou com exit 0 e `No difference detected`.
- Nenhuma `DATABASE_URL` remota foi usada. O runner recusa hosts que não sejam loopback e nomes de base sem `test`.

### Matriz de endpoints cobertos por HTTP real

| Módulo/operação | Autenticação e função | Isolamento/validação | Evidência actual |
|---|---|---|---|
| Employees — CRUD, salários e dependentes | OWNER autorizado; VIEWER e ausência de token rejeitados | Tenant B recebe 404; PATCH preserva campos omitidos; `null` explícito limpa campo; delete faz cascata em salários/dependentes | Suite PostgreSQL/HTTP aprovada |
| Clients — CRUD/pesquisa | VIEWER lê e não escreve | Mass assignment rejeitado; PATCH parcial; Tenant B recebe 404; cliente com factura não é eliminado | Suite PostgreSQL/HTTP aprovada |
| Suppliers — CRUD/pesquisa | VIEWER lê e não escreve | Tenant B recebe 404; fornecedor com compra não é eliminado; FK e cascata de itens verificadas | Suite PostgreSQL/HTTP aprovada |
| Facturas emitidas — criar/listar/estado/PDF | OWNER/ADMIN/ACCOUNTANT escrevem; VIEWER só lê; cancelar reservado a OWNER/ADMIN | Cliente/produto de outro tenant é 404; payload não aceita tenant; catálogo é novamente lido no backend; duas emissões simultâneas recebem números únicos consecutivos; pagar/cancelar concorrentes produzem uma única transição terminal; PDF cross-tenant é 404 | Suite PostgreSQL/HTTP aprovada |
| Produtos — CRUD/pesquisa | OWNER/ADMIN/ACCOUNTANT escrevem; VIEWER só lê; delete reservado a OWNER/ADMIN | Mass assignment e nome vazio rejeitados; PATCH preserva omitidos e permite limpar campos anuláveis; Tenant B recebe 404; produto referenciado não é eliminado | Suite PostgreSQL/HTTP aprovada |

### Alterações de segurança e consistência

- Clientes, fornecedores, produtos e facturas usam payload autenticado tipado e papéis explícitos no controller.
- DTOs aplicam allowlist, limites de comprimento, precisão máxima da entrada numérica e limites de pesquisa. IDs de tenant enviados no body são rejeitados pelo `ValidationPipe` global.
- Deletes de clientes, fornecedores e produtos verificam referências documentais e devolvem 409 em vez de propagar erro de FK ou apagar histórico relacionado.
- A numeração `FT-ano-sequência` é calculada dentro da mesma transacção da criação, sob advisory lock PostgreSQL por tenant/ano. Isto remove a janela de corrida observada no padrão anterior de procurar máximo e tentar novamente fora de lock.
- As transições PENDING → PAID/CANCELLED usam `updateMany` condicionado ao estado actual e ao tenant. Uma corrida pagar/cancelar deixa apenas um estado terminal.
- O frontend canónico de facturas é `/invoices`. `/invoice` e `/invoice/new` redireccionam no servidor; VIEWER deixa de ver acções de escrita. A listagem deixou de inferir IVA de 14% quando o campo não existe e a criação deixou de mostrar uma prévia fiscal universal de 14%.

### Evidência de validação desta actualização

| Comando | Resultado real |
|---|---|
| `npm run test:integration:local -- employee-tenant.integration-spec.ts` | Uma execução falhou antes dos testes por matcher Jest incompatível; depois da correcção, execução final exit 0: 1 suite/12 testes |
| `npm test -- --runInBand` | Exit 0: 25 suites/60 testes |
| `npm run test:security -- --runInBand` | Exit 0: 9 suites/30 testes |
| TypeScript backend e frontend sem emissão | Exit 0 em ambos |
| `npm run build` no backend | Primeira tentativa da ronda falhou com `ENOTEMPTY` no output; repetição e execução final terminaram com exit 0 |
| `NEXT_DIST_DIR=.tmp/next-build npm run build` no frontend | Execução em sandbox falhou `spawn EPERM`; execução fora da sandbox, isolada do servidor dev activo, terminou com exit 0 e 37 páginas estáticas |
| Lint dirigido dos ficheiros de produção de Facturação e Produtos, excluindo Prettier | Zero erros e zero avisos de outras regras |

### Riscos ainda abertos

- Facturas e produtos passaram a ter colunas `Decimal` aditivas e escrita dupla; os `Float` continuam para compatibilidade e outras entidades monetárias ainda dependem deles. A remoção futura exige inventário dos consumidores e migração controlada.
- A regra de IVA das facturas foi centralizada com fonte e versão. A taxa geral de 14% e o tratamento documental do regime simplificado foram confirmados na Lei n.º 14/23; natureza da operação, isenções, taxas reduzidas, Cabinda, retenções e períodos históricos ainda exigem classificação e motor fiscal completo.
- A numeração ainda não modela série nem tipo documental. O lock torna a sequência existente concorrente, mas não satisfaz sozinho todos os requisitos legais de facturação.
- A prova HTTP ainda não cobre payroll, documentos com ficheiro real, obrigações, notificações, exports, quotas ou compras completas.
- A configuração Prisma duplicada em `package.json#prisma` e `prisma.config.ts` produz aviso de depreciação.

## Actualização de 30-09-2026 — fundação monetária de Facturação

- A migration aditiva `20260930110000_decimal_money_foundation` acrescenta montantes `Decimal(20,2)` e quantidades/stock `Decimal(20,4)`, preenche-os a partir dos campos legados e não remove colunas.
- A criação de facturas grava `Decimal` e `Float` na mesma transacção. O catálogo activo é consultado por `tenantId`; nome, unidade e preço de um produto catalogado são obtidos no servidor.
- Listagens, estatísticas e PDF preferem os campos exactos. As respostas mantêm os campos numéricos legados durante a transição.
- O formulário canónico usa clientes e produtos reais, pesquisa do catálogo, linhas livres, validação, estados de erro/sucesso e pré-visualização explicitamente não fiscal. As rotas antigas apenas redireccionam.
- O PDF exige JWT/RBAC e escopo do tenant, contém aviso de documento interno e inclui a menção do regime simplificado quando aplicável.
- A migration foi aplicada exclusivamente a `localhost:5432/fiscalidade_codex_test_20260929`; a base local principal e a Neon não foram alteradas nesta execução.
- Evidência dirigida: TypeScript backend/frontend passou; schema Prisma válido; 6 suites/12 testes unitários dirigidos após a regra central; 1 suite/12 testes HTTP na base isolada; `git diff --check` sem erros.
# Actualização de 29-09-2026 — administração da plataforma e SAF-T contabilístico

- Foi criada autenticação administrativa separada das contas empresariais: entidade, segredo JWT, token, guard e log de auditoria próprios.
- O bootstrap só existe como comando local, exige variáveis de ambiente, recusa criar uma segunda conta e força mudança da credencial temporária.
- Cinco falhas de login bloqueiam temporariamente a conta; mensagens de erro não confirmam a existência do email.
- O dashboard administrativo exige que a palavra-passe temporária já tenha sido substituída e devolve apenas métricas agregadas.
- Um token empresarial foi recusado numa chamada HTTP real à rota administrativa; a mudança de palavra-passe invalidou o token administrativo anterior.
- Foi acrescentado um diagnóstico tenant scoped de preparação SAF-T contabilístico. A exportação XML está desactivada porque faltam plano de contas, razão, lançamentos de partidas dobradas, precisão monetária adequada e artefacto oficial XML/XSD validado.
- A migration aditiva foi aplicada somente à base PostgreSQL local de testes. Não houve acesso ou escrita na Neon/produção.
