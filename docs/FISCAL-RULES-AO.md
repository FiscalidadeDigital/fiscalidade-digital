# Regras fiscais usadas pelo SAF-T (AO)

## Regra: ficheiros baseados na verdade fiscal persistida

- **Fonte:** Decreto Presidencial n.º 312/18, artigo 4.º.
- **Referência:** o ficheiro deve ser preenchido com a informação constante do sistema de processamento electrónico do contribuinte.
- **Implementação:** SAF-T não pode recalcular ou corrigir silenciosamente facturas durante a exportação.
- **Teste exigido:** PDF, API e SAF-T devem usar a mesma classificação, base, taxa e montante fiscal persistidos.

## Regra: período

- **Fonte:** anexo do Decreto Presidencial n.º 312/18.
- **Referência:** geração para período anual total ou parcial desde o início do período de tributação.
- **Implementação actual:** o diagnóstico contabilístico recebe exercício e limita as consultas ao tenant e ao ano.
- **Teste:** limites inclusivo no início e exclusivo no fim do exercício.

## Regra: validação XSD

- **Fonte:** Decreto Presidencial n.º 312/18 e Decreto Executivo n.º 74/19.
- **Implementação:** exportação permanece bloqueada enquanto não houver versão aplicável confirmada e validação real.
- **Teste exigido:** XML gerado deve validar integralmente; erro de schema impede download como ficheiro válido.

## Regra: assinatura e inviolabilidade

- **Fonte:** Decreto Executivo n.º 74/19, de 6 de Março, Anexo I, [Diário da República disponibilizado pelo Ministério das Finanças](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw40/otq5/~edisp/minfin4949834.pdf).
- **Implementação:** ainda pendente; não existe hash fictício.
- **Teste exigido:** vector oficial, cadeia determinística, primeiro documento e documentos subsequentes.

## Regra: taxa zero e isenção

- **Fonte:** estrutura SAF-T e legislação material de IVA aplicável.
- **Implementação:** taxa zero não é automaticamente classificada como isenção. O modelo actual não possui código e motivo de isenção por linha, portanto a exportação fiscal permanece bloqueada nesses casos.
- **Teste exigido:** taxa zero, isento e não sujeito têm representações distintas e fundamentadas.

### Persistência implementada

`InvoiceItem` passa a preservar `taxType`, `taxCode`, `taxRate`, `taxAmount`, `taxExemptionCode` e `taxExemptionReason`. Os campos são opcionais para manter compatibilidade com documentos históricos. Novas facturas normais com taxa positiva guardam explicitamente `IVA`, código `NOR`, taxa e montante por linha. Uma taxa zero não recebe automaticamente `ISE`, `NS` ou fundamento; o preflight deve bloquear a exportação até existir classificação explícita.

`Invoice` passa a preservar tipo fiscal, série, sequência, exercício, motivo de anulação e referência de rectificação. A migration é aditiva e não renumera documentos existentes.

## Regra: certificação

- **Fonte:** Decreto Executivo n.º 74/19.
- **Implementação:** `NOT_CERTIFIED`; nenhum número ou alegação é criado sem atribuição oficial.
- **Teste:** a interface nunca apresenta certificação quando o estado não é `CERTIFIED`.
