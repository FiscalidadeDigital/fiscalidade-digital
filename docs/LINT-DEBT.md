# Dívida de lint anterior ao portão por delta

O portão desta entrega é o lint dos ficheiros modificados/criados no delta
relevante face a `origin/main`, acrescido dos ficheiros não rastreados. O lint
global do backend não é um portão desta entrega, porque contém dívida herdada.

- Referência: `origin/main`.
- Medição histórica: **2.849 erros** no lint global do backend, registados em
  08-11-2026 antes da adopção deste portão.
- Auditoria dirigida ao delta backend actual: **352 erros e 31 avisos** em 29
  ficheiros após aplicar a formatação. São regras tipadas herdadas em serviços
  extensos e testes antigos (por exemplo, `no-unsafe-*` e
  `no-redundant-type-constituents`), não erros de formatação novos.
- Componentes novos desta entrega (ciclo de enrollment, filtro de excepções e
  scripts de simulação/auditoria): **0 erros de lint**.
- Frontend: lint em 83 ficheiros do delta, **0 erros e 6 avisos** de hooks e
  imagens existentes.
- Destino: tarefa própria de redução de dívida; não ocultar nem corrigir em
  massa como parte de uma alteração fiscal.

Os resultados do lint do delta e qualquer erro corrigido nesta entrega devem
ser registados no relatório de release. Problemas localizados em linhas não
alteradas de ficheiros herdados continuam dívida técnica e não são uma razão
para flexibilizar regras novas.
