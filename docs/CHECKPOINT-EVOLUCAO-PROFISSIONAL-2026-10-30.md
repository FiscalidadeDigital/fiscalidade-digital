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
- Prettier dos dois ficheiros backend de IA: aprovado. `git diff --check`: aprovado.
- Revisão local real antes da simplificação da landing: 360, 390, 430, 768 e 1440 px sem overflow horizontal; menu móvel, selector PT-AO/EN, biografias e fecho por Escape verificados.

## Validações pendentes e bloqueios

- A suite Jest backend não é executável neste worktree: o `node_modules` reutilizado não contém o runner Jest; ao usar o runner alternativo, o cliente Prisma gerado é incompatível (`TaxType` ausente). O runner Jest e o lint type-aware excederam o timeout de 60 segundos sem resultado; a compilação Nest também excedeu o mesmo timeout. Não foi instalada, regenerada ou alterada nenhuma dependência partilhada.
- O lint frontend continua aprovado nos ficheiros alterados, com apenas o aviso preexistente de `no-img-element`. O lint backend completo não está aprovado nem foi usado como critério de publicação devido ao bloqueio acima.
- Não houve chamada real ao serviço de IA. Não existe chave local configurada e não há acesso autorizado ao painel Render para confirmar apenas a presença das variáveis necessárias. Não declarar pesquisa oficial funcional em produção.
- A nova revisão visual local da landing está bloqueada pelo runtime desta sessão: `next start` foi tentado uma vez em segundo plano e uma vez em primeiro plano, mas não abriu a porta 3000; ambos os processos temporários foram encerrados e não ficou servidor activo. O build, TypeScript, lint e teste dirigido passaram, mas isto não substitui a revisão visual das remoções.
- A sonda anónima confirma que `fiscalidade-digital-api.onrender.com` responde através do Render, mas não identifica a revisão nem expõe configuração. Nesta sessão não existe conector/CLI Render autorizado para confirmar a presença de `OPENAI_WEB_SEARCH_ENABLED` e do modelo sem revelar valores. No código, a pesquisa só é activada com `OPENAI_WEB_SEARCH_ENABLED=true` e `OPENAI_WEB_SEARCH_MODEL` não vazio; a compatibilidade efectiva requer uma chamada autenticada e autorizada.
- A inspeção anónima da landing de produção ainda encontrou as três áreas removidas, portanto este delta ainda não está publicado.
- Ainda não há medições comparáveis antes/depois para afirmar melhoria de desempenho.
- O staging/commit local também está bloqueado por ACL: não existe `index.lock` nem processo Git activo, mas `.git/worktrees/evolve-professional-platform` nega escrita ao processo actual. Nenhuma permissão foi alterada para contornar a protecção e nada ficou staged.
- PR, integração e deployment ficam pendentes da validação backend acima, da permissão Git local e do acesso de publicação. A sonda de leitura ao GitHub falhou pelo proxy/rede e não existe `gh` ou conector GitHub disponível nesta sessão.

## Retoma segura

1. Antes de instalar, voltar a medir o espaço livre no C:. Com espaço aprovado, preparar uma cópia de dependências backend descartável e independente, com cliente Prisma gerado para este schema, sem tocar em worktrees existentes.
2. Executar apenas `ai.service.spec.ts` e `ai.controller.spec.ts` com mocks; não requer base de dados nem chave OpenAI.
3. Confirmar acesso read-only ao Render para verificar a configuração por presença, sem revelar valores; fazer chamada real apenas com autorização e ambiente confirmado.
4. Pelo proprietário do repositório, restaurar apenas a permissão de escrita de Git em `.git/worktrees/evolve-professional-platform`; não apagar `index.lock` (não existe) nem worktrees.
5. Rever diff, criar commits selectivos, push e PR. Integrar somente após os checks obrigatórios passarem.
