# Fluxo operacional actual

**Estado revisto em:** 29-09-2026. Este documento descreve o que existe no checkout e assinala passos que ainda dependem de validação ou implementação. Não descreve integração electrónica com AGT/INSS.

## Fluxo actualmente observado

1. **Registo** — `POST /auth/register` cria um tenant, o utilizador OWNER, preferências de empresa e tenta sincronizar obrigações a partir do calendário local. O formulário pede NIF, tipo de pessoa colectiva/empresa e regime geral ou simplificado. O `Tenant` nasce com `status=TRIAL` e `planType=FREE`; `createdAt` regista o início e `trialEndsAt` é calculado em UTC com `TRIAL_DURATION_DAYS` (7 por omissão; duração inteira positiva que produza uma data válida). A sincronização falhada não impede o registo e é devolvida como pendente. A aplicação ainda não bloqueia o acesso quando o trial expira.
2. **Autenticação** — `POST /auth/login` devolve JWT. O frontend guarda-o em `localStorage` e consulta `/auth/me`; o backend recarrega o utilizador activo e a função/tenant actuais em cada validação do token. Não existem endpoints de recuperação, verificação de e-mail, refresh ou revogação de sessão observados.
3. **Configuração empresarial/fiscal** — dados da empresa são consultados e alterados por rotas protegidas; o `PATCH /company` está limitado a OWNER/ADMIN e usa DTO validado. Regime e tipo de empresa são recolhidos no registo, mas não há prova documental de validação externa do NIF, actividade ou enquadramento fiscal.
4. **Dados de operação** — os módulos de clientes, fornecedores, produtos, facturas, compras, receitas, trabalhadores e payroll têm rotas próprias. A página de facturas recebidas agora carrega a API de compras/fornecedores do tenant e envia o registo à API; o fornecedor é seleccionado da lista da empresa. IVA e retenção são transcritos da factura, não calculados por taxa presumida. A ligação ao módulo Documentos ainda não existe. A cobertura de isolamento e permissões não foi concluída em todos os endpoints. Os testes de autorização actuais são unitários com dependências simuladas, não chamadas HTTP A/B reais.
5. **Obrigações** — a sincronização usa calendário e regras locais. O dashboard consulta dados do tenant autenticado. Uma obrigação pode ser actualizada por operações próprias; não há integração AGT demonstrada para validar declaração, pagamento ou comprovativo. O cálculo/geração não comprova pagamento.
6. **Payroll/INSS/IRT** — as rotas geram folhas e sincronizam obrigações relacionadas. `approve`/`pay` são acções internas; não foi demonstrado pagamento bancário, declaração ao INSS ou retenção oficial. Há escalões de IRT codificados e precisão monetária ainda inconsistente; ver a [auditoria fiscal](AUDITORIA-FISCAL-ANGOLA.md).
7. **Documentos** — upload autenticado guarda localmente em `DOCUMENT_STORAGE_DIR` ou `backend/uploads/documents`, com limite por ficheiro de 10 MiB, nome UUID, filtro MIME e validação básica de assinatura. Listagem, metadata e download filtram por tenant; o caminho local não é devolvido. O resumo agrega `Document.size` em bytes por tenant, mas não verifica quota nem reconcilia ficheiros físicos; não há antivírus ou storage privado de produção comprovado.
8. **Alertas** — o agendador executa verificação global interna. O endpoint manual exige JWT e OWNER/ADMIN e filtra obrigações pela empresa do token. Os canais dependem de variáveis do fornecedor. O estado interno `SENT` representa resposta aceite pelo fornecedor, não confirmação de entrega ao destinatário.
9. **Pagamento/subscrição** — existem enums/modelo `Subscription`, plano e estado de pagamento, mas não foi demonstrado fluxo de checkout ou confirmação de fornecedor. Nenhuma cobrança real foi executada. O fim de `trialEndsAt` não é imposto por guard de acesso no backend.

## Estados operacionais que devem ser separados

O sistema deve representar separadamente cálculo, revisão, declaração, pagamento confirmado, atraso, anulação e correcção. No checkout, essa separação não está demonstrada em todos os módulos nem ligada a comprovativos oficiais. O estado `PAID` numa acção interna não é, por si, confirmação de pagamento externo.

O calendário fiscal indica prazos e tipos de obrigação. Não prova que o cálculo esteja correcto nem que uma obrigação foi submetida. A aplicação não deve afirmar que submeteu, pagou ou consultou dados na AGT/INSS sem integração oficial configurada e confirmação verificável.

## Matriz resumida

| Etapa | Fonte de dados observada | Estado | Dependência para aceitar comercialmente |
|---|---|---|---|
| Registo/tenant | DTO, Prisma e credenciais do utilizador | Parcial | Idempotência/transacção, validação empresarial, backfill de tenants antigos e enforcement do fim do trial |
| Sessão | JWT + consulta do utilizador activo | Parcial | Sessões/revogação, recuperação e verificação de e-mail; rever risco de `localStorage`/XSS |
| Configuração fiscal | Campos enviados pelo utilizador | Parcial | Validar NIF, actividade, regime e períodos com processo auditável |
| Dashboard | Consultas tenant-scoped | Parcial | Confirmar todos os campos/relatórios e não exibir resultados fiscais não validados como oficiais |
| Payroll/obrigações | Prisma + fórmulas locais | Não validado | Matriz legal, precisão Decimal ponta a ponta, testes independentes e trilho de auditoria |
| Documentos | Disco local privado | Parcial | Provider privado de produção, quota transaccional, varredura, retenção e testes HTTP |
| Alertas | Scheduler e fornecedores configuráveis | Parcial | Idempotência concorrente, confirmação/retry, consentimento e teste por tenant |
| Subscrição/trial | Campos e modelo Prisma | Incompleto | Regras de acesso, trial configurável e estados do fornecedor; planos/preços requerem decisão comercial |

## Ambiente e salvaguardas

Não houve ligação à Neon, leitura de dados da base de produção, migrações, deploy ou chamadas de pagamento. Os testes HTTP com PostgreSQL isolado não foram executados porque não foi identificada uma configuração de BD de testes isolada nesta ronda. Os módulos de calendário ou ficheiros locais não devem ser tratados como API oficial da AGT.
