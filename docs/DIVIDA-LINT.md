# Dívida de lint

## 2026-11-08 — hotfix de lembretes fiscais

O portão de lint deste hotfix usa a linha de base de `b20ccfa`. Os
ficheiros legados `backend/src/mail/alerts.service.ts` e
`backend/src/obligations/obligations.service.ts` já reportavam 1.038 erros
de lint nessa base, sobretudo regras de formatação e `no-unsafe-*`.

O hotfix não aceita aumento desse número: as linhas novas são verificadas
individualmente e a dívida histórica permanece registada aqui para correção
numa tarefa própria, sem reformatar estes ficheiros inteiros nesta publicação.
