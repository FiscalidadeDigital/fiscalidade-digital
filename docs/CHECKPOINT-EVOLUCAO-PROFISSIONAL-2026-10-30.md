# Checkpoint — evolução profissional (2026-10-30)

## Estado recuperável

- Worktree: `.tmp/evolve-professional-platform`
- Branch: `codex/evolve-professional-platform`
- Base: `2fce5a2` (Merge PR #8)
- A missão de recuperação administrativa mantém-se suspensa. Não foram alteradas credenciais, dados produtivos, migrations ou schema Prisma.

## Implementado neste delta

- Navegação unificada de Gestão de facturas e estados/permiteções coerentes nos módulos de facturas, compras, pró-formas e facturação electrónica.
- Interface de painel refinada, incluindo logo oficial legível e foco de teclado no menu móvel.
- Landing PT-AO/EN com preferência local, conteúdo e biografias traduzidos, animações respeitando redução de movimento, modal de biografia acessível e logos de parceiros legíveis no mobile.
- A landing foi simplificada sem tocar na área autenticada: foram removidas as secções Assistente Fiscal, Gestão documental e Central Fiscal, os respectivos previews/animações e todas as âncoras; a navegação passou a apontar para Funcionalidades e o resumo de funcionalidades ficou limitado à operação e pessoas.
- Respostas do assistente apresentadas com parsing seguro, fontes clicáveis apenas com URL segura, mensagens de falha sem detalhes técnicos e foco preso no diálogo.
- IA protegida contra afirmações actuais de taxa, vigência, obrigação ou regra sem fonte oficial verificável; perguntas públicas de IVA/IRT/INSS/Imposto Industrial também caem na resposta prudente quando a pesquisa não estiver disponível.
- Pesquisa de IA só aceita uma `url_citation` HTTPS de domínio oficial permitido como fonte; uma URL apenas descoberta não basta. Respostas fiscais protegidas precisam incluir uma citação `[W]` válida, e URLs com credenciais são rejeitados enquanto query/fragmento e URLs de texto não confiável são saneados antes de chegar ao cliente ou ao prompt seguinte.
- Estado comercial em Definições descrito de acordo com o contrato `PREPARED_NOT_APPLIED`, sem sugerir um bloqueio que ainda não existe.

## Validações concluídas

- TypeScript frontend (`tsc --noEmit`): aprovado após a simplificação da landing.
- Lint dirigido de `frontend/app/page.tsx`: aprovado, sem erros.
- Teste isolado da landing (`tests/landing-locale.test.cjs`): 3/3 aprovado, incluindo a ausência de âncoras das áreas removidas.
- Build frontend (`npm run build`): aprovado após a simplificação; 53 páginas geradas. A primeira execução foi interrompida pelo limite de 120 s quando ainda compilava; uma segunda execução única, com margem de tempo, concluiu em 155 s.
- Teste isolado de apresentação do assistente: 5/5 aprovado, sem chamadas reais de IA.
- Runner TypeScript transitório do assistente, inteiramente mockado: 4/4 cenários aprovados (pesquisa desligada, URL descoberta sem citação, resposta final sem `[W]` e URL saneado). O enum Prisma foi simulado apenas nesse runner porque o cliente instalado não corresponde ao schema; não é teste de integração.
- Validação backend numa cópia temporária independente, com Prisma `6.19.3` gerado para este schema: `ai.service.spec.ts` e `ai.controller.spec.ts` aprovaram 28/28 testes com mocks, sem chave local nem chamadas reais à IA.
- Build backend na mesma cópia isolada (`prisma generate && nest build`): aprovado em 226 s, sem erros de compilação.
- Prettier dos dois ficheiros backend de IA: aprovado. `git diff --check`: aprovado.
- Revisão local real antes da simplificação da landing: 360, 390, 430, 768 e 1440 px sem overflow horizontal; menu móvel, selector PT-AO/EN, biografias e fecho por Escape verificados.
- Publicação: o commit `2635ef1` foi enviado por fast-forward para `main` e para `codex/evolve-professional-platform`. A landing pública confirmou a remoção de `#plataforma`, `#assistente` e `#documentos`, bem como a navegação para Funcionalidades.

## Validações pendentes e bloqueios

- O `node_modules` do worktree preservado continua reutilizado e incompatível; por isso os resultados backend foram obtidos apenas na cópia temporária independente, sem alterar dependências partilhadas. O lint backend completo continua pendente porque o pacote isolado não disponibilizou o binário ESLint.
- Não houve chamada real ao serviço de IA. No Render, `OPENAI_API_KEY` está presente e permaneceu mascarada, mas `OPENAI_WEB_SEARCH_ENABLED` e `OPENAI_WEB_SEARCH_MODEL` não estão na lista de variáveis da instância. Assim, a pesquisa oficial fica desactivada pelo fallback seguro do código; não declarar pesquisa oficial funcional em produção até configurar as duas variáveis e validar numa sessão autenticada.
- A nova revisão visual local da landing está bloqueada pelo runtime desta sessão: `next start` foi tentado uma vez em segundo plano e uma vez em primeiro plano, mas não abriu a porta 3000; ambos os processos temporários foram encerrados e não ficou servidor activo. O build, TypeScript, lint e teste dirigido passaram, mas isto não substitui a revisão visual das remoções.
- A sonda anónima ao backend Render não identifica a revisão. O painel Render confirmou o deploy automático bem-sucedido do commit `2635ef1`, mas o código só activa pesquisa com `OPENAI_WEB_SEARCH_ENABLED=true` e `OPENAI_WEB_SEARCH_MODEL` não vazio; ambas as variáveis precisam ser adicionadas com um modelo compatível antes de uma chamada autenticada e autorizada.
- Ainda não há medições comparáveis antes/depois para afirmar melhoria de desempenho.
- O staging/commit local no worktree preservado continua bloqueado por ACL, mas a publicação foi feita num clone temporário limpo, sem alterar permissões nem o worktree original.
- A propagação pública da landing e o deploy do backend foram confirmados. A integração real de pesquisa permanece bloqueada pela ausência das duas variáveis de configuração e, depois de as configurar, ainda requer uma sessão autenticada no produto.

## Retoma segura

1. Adicionar no Render, sem expor segredos, `OPENAI_WEB_SEARCH_ENABLED=true` e `OPENAI_WEB_SEARCH_MODEL` com um modelo compatível com pesquisa web na Responses API; a alteração deve desencadear um novo deploy.
2. Numa sessão autenticada autorizada, enviar uma pergunta fiscal actual a `POST /ai/chat` e confirmar uma citação `[W#]` e fonte `OFFICIAL_WEB` HTTPS permitida. Um estado `DISABLED`, `UNAVAILABLE` ou ausência de fonte verificável deve ser tratado como falha segura, não como pesquisa bem-sucedida.
3. Se voltar a ser necessário trabalhar no worktree preservado, reparar a ACL de Git apenas pelo proprietário; não apagar worktrees, ficheiros de bloqueio nem dependências partilhadas.
