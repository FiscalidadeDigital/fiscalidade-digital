# Documentos, quotas e subscrições

**Estado revisto em:** 29-09-2026. Este documento separa o que já existe do desenho necessário. Não há preços, capacidades comerciais nem fornecedor de pagamento escolhidos neste repositório.

## Estado actual do módulo Documentos

- O modelo `Document` guarda tenant, nome original, tipo MIME, `size` inteiro, categoria e `filePath` interno. O valor `size` recebido do Multer é medido em bytes. `DocumentService.getSummary` agrega `SUM(size)` filtrado pelo tenant e devolve `totalSize`, mas não compara com uma quota, não reserva espaço em concorrência e não reconcilia metadados com bytes existentes no disco.
- O upload tem limite de 10 MiB por ficheiro. O ficheiro é escrito antes da validação final da empresa associada; erros são limpos em alguns caminhos, mas falta uma rotina de staging/limpeza e reconciliação completa.
- Os novos documentos ficam em `DOCUMENT_STORAGE_DIR` ou, por omissão, em `backend/uploads/documents`. O servidor estático público foi removido. O download passa por JWT e filtro de tenant. A metadata devolvida não deve incluir `filePath`, `fileUrl` nem `tenantId`.
- O armazenamento é local. Não foi encontrada interface provider que comprove compatibilidade operacional com storage privado em produção; o disco do backend de produção não foi validado quanto a persistência, backup, cifra, retenção ou escalabilidade.
- Testes actuais são unitários/mockados: cobrem saneamento de metadata, tenant, confinamento de caminho e assinatura de ficheiro. Não provam acesso HTTP directo, funcionamento do disco do Render, quota ou isolamento concorrente entre empresas.

## Desenho de quota recomendado

Unidade canónica: **bytes inteiros**, usando GiB binário apenas na apresentação: `1 GiB = 1.073.741.824 bytes`. A API e a base de dados não devem armazenar texto como “GB” nem usar ponto flutuante para capacidade.

Campos necessários, sujeitos a migração aditiva e revisão do schema:

- `storageQuotaBytes`: capacidade atribuída ao tenant, separada da subscrição;
- `storageUsedBytes`: contador reconciliável de bytes persistidos;
- extensão temporária/reserva para uploads em curso, se necessário ao desenho concorrente;
- identificador opaco do provider/object, sem URL pública ou caminho do servidor na API.

Fluxo exigido antes de produção:

1. Autenticar e resolver o tenant a partir da sessão; validar DTO/MIME/assinatura e limite por ficheiro.
2. Transmitir para staging privado com limite de streaming. Não confiar apenas no `Content-Length` indicado pelo cliente.
3. Reservar bytes através de operação atómica/transactional condicionada a `used + reserved + fileSize <= quota`; uploads simultâneos têm de competir na BD para nunca ultrapassar a quota.
4. Persistir o objecto privado e o registo do documento com a mesma semântica de falha/compensação. Se qualquer passo falhar, libertar reserva e eliminar apenas o objecto temporário criado por essa tentativa.
5. No delete, autorizar tenant, apagar o objecto privado e actualizar contador de forma idempotente. Registar falhas para reconciliação, sem reduzir o contador se o objecto ainda existir.
6. Manter rotina de reconciliação que compara metadados e bytes do provider, sem ler documentos de outro tenant pela API pública.

O valor de `storageQuotaBytes` não foi definido: depende dos planos/capacidades comerciais do proprietário. Não se deve adoptar quota zero, ilimitada ou um número arbitrário silenciosamente. Até existir capacidade válida para cada tenant, não afirmar que o controlo de quota está implementado.

## Abstracção de armazenamento

Definir uma interface de armazenamento privado com operações equivalentes a `put`, `open/read`, `delete`, `stat` e `healthCheck`, com ID opaco e escopo por tenant. O adaptador local serve desenvolvimento e testes, com directório fora de qualquer root estático e permissões restritas. Um provider de produção só deve ser seleccionado após decisão, credenciais por ambiente, configuração de retenção/cifra e testes de autorização. URLs assinadas, caso venham a ser usadas, devem ser curtas, privadas e emitidas depois de verificar tenant.

Não foram criadas credenciais nem escolhido S3, bucket, fornecedor, retenção ou região. A implementação actual usa filesystem e ainda não satisfaz esta interface de produção.

## Trial e subscrição

### Persistência existente

- `Tenant` tem `status` (`TRIAL` por omissão), `planType` (`FREE`) e `trialEndsAt` opcional. Novos registos gravam `createdAt` como início e calculam `trialEndsAt` em UTC pela variável `TRIAL_DURATION_DAYS` (7 por omissão; inteiro positivo que produza uma data válida). Não há coluna separada `trialStartedAt`.
- `Subscription` tem plano, `priceKwanza` como `Float`, datas, estado activo, `paymentRef` e `paymentStatus` (por omissão `PENDING`).
- Não há coluna separada `trialStartedAt`, guard de fim do trial nem fluxo de checkout/webhook validado. `trialEndsAt` só é preenchido em novos registos; os tenants existentes com `trialEndsAt` nulo precisam de política de backfill antes de qualquer bloqueio.
- Não foi comprovada separação de acesso a funcionalidades pagas no backend. Frontend, enum de plano ou status isolado não protegem operações.

### Preparação requerida, sem cobrança activa

- Configuração central `TRIAL_DURATION_DAYS=7`; gravar instante de início e fim em UTC no servidor, nunca aceitar datas do cliente. Tornar a duração configurável sem alterar código.
- Estados explícitos do trial: não iniciado, activo, expirado; manter separadamente estado da subscrição, plano/capacidades, quota e estado de pagamento.
- Política de acesso no backend por capacidade. Durante o trial não bloquear funções essenciais. Depois do trial, aplicar política de acesso acordada e manter um caminho para exportação/consulta necessária, sem eliminar dados.
- Histórico imutável de alterações de plano/estado, idempotência de eventos futuros e validação de webhook com segredo/provider quando houver fornecedor escolhido.
- Estados de pagamento pendente, confirmado, recusado, reembolsado e contestado devem vir de eventos verificáveis do fornecedor. Nenhum operador/cliente pode tornar-se `PAID` apenas por enviar um campo no body.
- Capacidades de armazenamento devem ser configuradas por plano e adicionais, separadas de preço. Não há preços, níveis, fornecedor ou processo de compra definidos; não implementar checkout fictício.

## Compatibilidade e migrações

Não foi criada nem executada migração de quota/trial nesta fase. Qualquer mudança futura deve ser aditiva, com backfill explícito, validação de contadores numa BD local descartável e plano de compatibilidade antes de produção. A Neon de produção não foi consultada.

## Critério para considerar concluído

Só considerar quotas e subscrições prontos depois de haver: migração testada em BD descartável; limites numéricos aprovados; uploads simultâneos de tenants diferentes e iguais cobertos; falhas de provider reconciliadas; storage privado de produção escolhido e testado; guard de capacidades no backend; trial de sete dias testado nos limites de tempo; eventos de pagamento idempotentes; nenhuma cobrança real sem autorização separada.
