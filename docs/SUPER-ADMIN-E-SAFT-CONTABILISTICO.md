# Super Admin e preparação SAF-T contabilístico

Data da revisão: 29-09-2026.

## Administração da plataforma

A administração global usa a entidade `PlatformAdmin`, separada de `User` e sem `tenantId`. Uma conta empresarial, incluindo `OWNER`, não pode ser utilizada nas rotas administrativas.

### Fluxo implementado

1. Um operador autorizado define localmente `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME` e `ADMIN_BOOTSTRAP_PASSWORD`.
2. `npm run admin:bootstrap` recusa a operação quando já existe uma conta administrativa, guarda apenas o hash bcrypt e não imprime a palavra-passe.
3. `POST /admin/auth/login` usa um segredo próprio (`ADMIN_JWT_SECRET`), token de 15 minutos, mensagem genérica para credenciais erradas e bloqueio de 15 minutos após cinco tentativas falhadas.
4. A primeira sessão fica limitada a `GET /admin/auth/me` e `POST /admin/auth/change-password`.
5. A mudança obrigatória incrementa `tokenVersion`, invalida o token anterior e permite então `GET /admin/dashboard`.
6. O painel devolve apenas contagens agregadas de tenants, utilizadores, funcionários, documentos e bytes catalogados.

As operações de autenticação, bootstrap e mudança de palavra-passe são registadas em `PlatformAuditLog`, separado do log empresarial. Não existe endpoint HTTP de bootstrap, palavra-passe hardcoded ou conversão de utilizador de tenant em Super Admin.

### Configuração

- `ADMIN_JWT_SECRET`: obrigatório para autenticação administrativa e distinto de `JWT_SECRET`; mínimo de 32 bytes.
- `ADMIN_BOOTSTRAP_EMAIL`: usado apenas pelo comando de bootstrap.
- `ADMIN_BOOTSTRAP_NAME`: nome da primeira conta.
- `ADMIN_BOOTSTRAP_PASSWORD`: credencial temporária forte, usada apenas pelo comando e obrigatoriamente substituída no primeiro acesso.

Nenhum valor real destas variáveis deve ser versionado. O ficheiro `backend/.env.example` contém apenas marcadores de configuração.

## SAF-T (AO) de contabilidade

Foi implementado um diagnóstico de prontidão em `GET /accounting/saft/readiness?fiscalYear=AAAA`, acessível a `OWNER`, `ADMIN` e `ACCOUNTANT`. O tenant é sempre obtido do JWT; o endpoint não aceita `tenantId` do cliente.

O diagnóstico mede:

- presença dos dados de identificação da empresa;
- quantidades e lacunas básicas de clientes, fornecedores e produtos;
- facturas emitidas, facturas de compra e movimentos fiscais do exercício;
- bloqueios estruturais para uma exportação contabilística válida.

A exportação está desactivada (`canExport: false` e `exportEndpointAvailable: false`). O sistema não produz XML provisório.

### Bloqueios actuais

- falta incorporar e validar um artefacto XML/XSD oficial integral e versionado;
- inexistência de plano de contas;
- inexistência de diários, lançamentos a débito/crédito e saldos contabilísticos;
- campos monetários relevantes ainda usam `Float`;
- documentos comerciais e movimentos fiscais existentes não constituem um razão contabilístico.

### Fundamento confirmado

O [comunicado oficial da AGT sobre o SAF-T de contabilidade](https://portaldocontribuinte.minfin.gov.ao/noticia?id=985578), consultado em 29-09-2026, refere o Decreto Executivo n.º 317/20, de 14 de Dezembro, e confirma as secções cabeçalho, tabelas mestres e movimentos contabilísticos. O mesmo comunicado distingue a obrigação contabilística referente ao exercício de 2026 da submissão relativa a 2025.

Esta referência permite estruturar o diagnóstico. Não é suficiente, isoladamente, para implementar campos XML ou afirmar validação contra o XSD oficial.

## Evidência local

- Prisma: schema validado e migration `20260929120000_platform_admin_foundation` aplicada apenas em PostgreSQL local de testes.
- Super Admin unitário: 3 suites, 9 testes aprovados.
- Super Admin HTTP/PostgreSQL: 1 suite, 3 testes aprovados.
- Suite HTTP/PostgreSQL existente após a migração: 1 suite, 12 testes aprovados.
- SAF-T readiness unitário: 1 suite, 2 testes aprovados.
- Backend e frontend TypeScript: aprovados após estas alterações.
- Backend build: aprovado.
- Frontend build: aprovado, incluindo `/admin/login`, `/admin/dashboard` e, antes da última página SAF-T, 39 páginas estáticas; requer nova execução depois da integração visual SAF-T para fechar a evidência desta rota.

Nenhum teste ou migração desta fase usou a Neon ou dados de produção.
