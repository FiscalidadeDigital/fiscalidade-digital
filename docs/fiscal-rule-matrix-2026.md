# TaxBrain 2026 — matriz de evidência jurídica e estado de implementação

> Consultada em 2026-10-10. Este documento é um registo técnico de fontes e
> decisões de produto: não substitui o diploma aplicável nem autoriza um
> cálculo automático quando o estado não é `CONFIRMED`.

## Critério de confirmação

Uma taxa, uma base, uma fórmula e um prazo são elementos independentes. Só
uma afirmação suportada por uma fonte primária é `CONFIRMED`. Quando o Portal
do Contribuinte publica uma data operacional, ela é uma instância de calendário
para 2026 e não uma regra que se propaga para outros exercícios.

Fontes primárias consultadas:

- [Calendário Fiscal 2026 — Portal do Contribuinte/AGT](https://portaldocontribuinte.minfin.gov.ao/pdfs/CALENDARIO_FISCAL_2026.pdf)
- [Legislação — Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/legislacao)
- [Lei n.º 14/25, OGE 2026 — Diário da República](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf)
- [Código do IVA republicado pela Lei n.º 14/23 — Diário da República](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4z/nzu5/~edisp/minfin3759673.pdf)
- [Imposto Industrial — informação AGT](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial)
- [Comunicado II provisório 2026 — AGT](https://portaldocontribuinte.minfin.gov.ao/noticia?id=985597)
- [Extensão IVA de Abril de 2026 — AGT](https://portaldocontribuinte.minfin.gov.ao/noticia?id=985577)
- [Decreto Presidencial n.º 227/18 — Diário da República/INSS](https://portal.inss.gov.ao/wp-content/uploads/2021/10/227_18.pdf)
- [Decreto Presidencial n.º 295/20 — Diário da República/INSS](https://portal.inss.gov.ao/wp-content/uploads/2021/10/295_20.pdf)

## Matriz jurídica granular

| TaxType / operação | Regime | Regra, base ou prazo | Fundamento e vigência | Estado | Tratamento TaxBrain |
| --- | --- | --- | --- | --- | --- |
| IVA / venda | Geral | Taxa normal de 14%; o tratamento de taxa reduzida, isenção e Cabinda depende da classificação da operação. | Código do IVA republicado pela Lei n.º 14/23; informação AGT. Vigente em 2026. | `CONFIRMED` para a taxa normal; `NEEDS_OFFICIAL_CONFIRMATION` para exceções sem classificação no documento. | Prévia de 14% apenas como `PREVIEW_ONLY`; não transforma IVA suportado indicado em dedução automática. |
| IVA / apuramento | Simplificado | A AGT informa taxa de 7% sobre facturação efectivamente recebida e exclui operações isentas. A fonte oficial de apoio não permite fixar de forma inequívoca a dedução aplicável: a FAQ refere 4% mediante mapa de fornecedores; o guia antigo mostra 7% no formulário. | Código do IVA / informação e guia AGT; exercício 2026. | `CONFLICT_FOUND` para fórmula de dedução; `CONFIRMED` somente para reconhecimento do enquadramento e necessidade de recebimento efectivo. | Sem `paidAt`/recebimento conciliado e sem fórmula confirmada, cálculo definitivo continua bloqueado em `NEEDS_OFFICIAL_CONFIRMATION`. |
| IVA / calendário | Geral | Modelo 7, anexos e pagamento: dia 15 de cada mês em 2026; SAF-T tem entradas próprias. | Calendário Fiscal AGT 2026. | `CONFIRMED` como calendário 2026. | `FiscalCalendar` armazena as instâncias anuais; não são copiadas para 2027. |
| IVA / calendário | Simplificado | Declaração e pagamento nas datas mensais publicadas pelo calendário 2026. | Calendário Fiscal AGT 2026. | `CONFIRMED` como calendário 2026. | Gera obrigação de calendário apenas quando houver enrollment; montante depende de assessment confirmado. |
| IVA / prorrogação | Geral | Obrigações cujo prazo terminava em 15-04-2026 podem ser cumpridas até 30-04-2026 sem penalidade, por danos das fortes chuvas. | Comunicado AGT `985577`, 17-04-2026. | `CONFIRMED`. | `FiscalDeadlineOverride` específico preserva a regra permanente e limita a extensão ao item oficial afectado. |
| INDUSTRIAL / definitivo | Geral | Taxa geral 25%; 10% para actividades exclusivamente qualificadas do sector primário; 35% para banca, seguros, telecomunicações e petrolíferas angolanas. | Código do II, Lei n.º 19/14 alterada pela Lei n.º 26/20; página AGT. | `CONFIRMED` para categorias publicadas; seleção requer sector/factos. | Não calcula imposto definitivo só de receitas/custos; exige matéria colectável e ajustamentos fiscais. |
| INDUSTRIAL / definitivo | Geral | Declaração Modelo 1 e pagamento: último dia útil de Maio; em 2026, 29-05. | Código do II; Calendário Fiscal AGT 2026. | `CONFIRMED`. | Instância de calendário 2026, sem propagação anual. |
| INDUSTRIAL / definitivo | Simplificado | Aplicável a sujeitos de II abrangidos pela não sujeição de IVA; o calendário fixa 30-04-2026. A hierarquia integral de base/deduções não foi extraída de fonte primária nesta revisão. | Página AGT; Calendário Fiscal AGT 2026. | `CONFIRMED` para enquadramento e data; `NEEDS_OFFICIAL_CONFIRMATION` para fórmula automatizada. | Sem cálculo definitivo automático. |
| INDUSTRIAL / provisório | Geral | 2% sobre vendas de bens e prestações de serviços não sujeitas a retenção nos primeiros seis meses de 2026; prazo 31-08-2026. Prejuízo no exercício anterior dispensa liquidação, mas a declaração continua exigida. | Comunicado AGT `985597`, art. 66.º referido no comunicado. | `CONFIRMED` para exercício 2026. | Regra permanece em revisão enquanto os dados de exclusão por retenção e prejuízo não forem suficientemente estruturados. |
| INDUSTRIAL / não residente | Geral | Taxa candidata de 15%. | Não obtida fonte primária com pressupostos completos nesta revisão. | `NEEDS_OFFICIAL_CONFIRMATION`. | Não activar. |
| INDUSTRIAL / retenção de serviços | Geral/Simplificado | Taxa candidata 6,5% e condições específicas. | Não obtida fonte primária com incidência, exclusões e prazo completos nesta revisão. | `NEEDS_OFFICIAL_CONFIRMATION`. | A retenção genérica continua desactivada. |
| INDUSTRIAL / autofactura de bens e serviços | — | Taxas candidatas de 2% e 6,5%. | Não obtida fonte primária completa nesta revisão. | `NEEDS_OFFICIAL_CONFIRMATION`. | Não activar. |
| IRT / Grupo A | Laboral | Tabela progressiva de 11 escalões; isenção até Kz 150.000, parcela fixa e taxa marginal do Anexo I. | Lei n.º 14/25, art. 21.º, n.º 3 e Anexo I; vigência do OGE 2026. | `CONFIRMED` para 2026. | Tabela versionada exclusivamente para 2026; folha histórica preserva `fiscalSnapshot`. |
| IRT / calendário | Grupo A | Mapa de remunerações e entrega do imposto do mês anterior nas datas mensais do calendário; por exemplo, 29-05-2026. | Calendário Fiscal AGT 2026. | `CONFIRMED` como calendário 2026. | A obrigação deriva de Payroll persistido, não de um regime IVA. |
| SS / conta de outrem | Standard | Empregador 8%; trabalhador 3%; base definida no art. 13.º. | DP n.º 227/18, art. 12.º, n.º 1 e art. 13.º. | `CONFIRMED`. | `STANDARD` suportado com `Decimal`. |
| SS / reformado em actividade | Retired | Empregador 8%; trabalhador reformado 8%. | DP n.º 227/18, art. 12.º, n.º 2. | `CONFIRMED`. | `RETIRED` suportado com `Decimal`. |
| SS / outros regimes | Low income, independente, doméstico, desporto, religioso | As categorias e as taxas exigem diploma, base e elegibilidade próprios. | DP n.º 295/20 e demais diplomas devem ser extraídos e verificados por categoria. | `REMODEL_REQUIRED`. | `SPECIAL` falha fechado; não é convertido silenciosamente em `STANDARD`. |
| SS / prazo | Standard/Retired | Pagamento até ao dia 10 do mês seguinte. | DP n.º 227/18, art. 15.º, n.º 2. | `CONFIRMED`. | Calendário/obrigações devem manter a fonte e o período. |

## Comparação com o código

| Área | Resultado | Evidência / decisão |
| --- | --- | --- |
| Enquadramento | `MATCH` | `TaxRegimeAssignment` é resolvido por imposto e período; a área fiscal não usa `Tenant.regime` como fallback. |
| IRT 2026 | `MATCH` após limitação temporal | A tabela e os limites implementados correspondem ao Anexo I; a regra não pode ser aplicada automaticamente a 2027 sem nova fonte. |
| INSS Standard/Retired | `MATCH` | As taxas 8%/3% e 8%/8% usam `Prisma.Decimal`; `SPECIAL` falha fechado. |
| IVA Geral | `MATCH` parcial | Há prévia de 14%, com revisão para classificação e dedução; não há taxa universal para exceções. |
| IVA Simplificado | `MISMATCH` corrigido | Código legado morto que descrevia apuramento por `issuedAt` é removido; o motor continua a devolver montante indeterminado até haver recebimentos e fórmula oficialmente reconciliada. |
| Industrial | `MATCH` de segurança | O motor não transforma receitas/custos em imposto definitivo sem matéria colectável, ajustamentos e categoria sectorial. |
| Retenções | `MATCH` de segurança | Não há cálculo genérico de 6,5%. |
| Calendário 2026 | `MATCH` | Os ficheiros oficiais 2026 estão versionados em `backend/prisma/data`; itens 2026 registam URL oficial e a prorrogação AGT de Abril é um `FiscalDeadlineOverride` aditivo. |

## Salvaguardas obrigatórias

- `Tenant.regime` pode existir por compatibilidade, mas nunca decide IVA, II, IRT ou INSS.
- Um enrollment posterior não reinterpreta Payroll, TaxAssessment, FiscalObligation paga, documento ou snapshot histórico.
- Sem fonte oficial 2027, calendário e regra que dependem do exercício retornam estado pendente; não há cópia cega de 2026.
- Não apresentar `0 Kz` como imposto conhecido quando o motor devolve `NEEDS_CONFIGURATION`, `REVIEW_REQUIRED` ou `NEEDS_OFFICIAL_CONFIRMATION`.
