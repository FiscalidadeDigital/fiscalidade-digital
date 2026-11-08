# Regras fiscais Angola — fontes oficiais e estado do produto

> Actualizado em 8 de Novembro de 2026. Este registo técnico não substitui a confirmação da AGT, do INSS ou de um profissional habilitado para o caso concreto.

## Leitura dos estados

- **Implementada (parcial):** há fonte oficial para a parte indicada, mas faltam factos, classificações ou cenários.
- **Por apurar — confirme na AGT/INSS:** não calcular nem trocar valor nulo por 0 Kz.
- **Conflito resolvido pela fonte primária:** diploma publicado no Diário da República prevalece sobre guia ou página operacional antiga.
- As datas do Calendário Fiscal são instâncias de **2026** e não podem ser copiadas para 2027 sem nova publicação oficial.

## Fontes oficiais consultadas

| Id | Fonte oficial | Uso |
| --- | --- | --- |
| CIVA-2023 | [Lei n.º 14/23, de 28-12-2023, DR I Série n.º 246 — CIVA republicado](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4z/nzu5/~edisp/minfin3759673.pdf) | Taxas, simplificado, caixa e início de actividade. |
| OGE-2026 | [Lei n.º 14/25, de 30-12-2025, DR I Série n.º 244](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw41/mje2/~edisp/minfin5216784.pdf) | IRT 2026; art. 21.º, n.º 3 e Anexo I. Art. 43.º: vigora desde 01-01-2026. |
| CIRT | [Lei n.º 18/14, de 22-10-2014](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4x/mjm3/~edisp/minfin1237856.pdf) e [Lei n.º 28/20, de 22-07-2020](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4x/mjm3/~edisp/minfin1237855.pdf) | Incidência, grupos e base de IRT. |
| CII | [Lei n.º 19/14, de 22-10-2014](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4x/mjm3/~edisp/minfin1237856.pdf), [Lei n.º 26/20, de 20-07-2020](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4y/njky/~edisp/minfin2692601.pdf) e [Lei n.º 27/22, de 22-08-2022](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4z/mziy/~edisp/minfin3322805.pdf) | II, provisório e retenções. |
| INSS-2018 | [Decreto Presidencial n.º 227/18, de 27-09-2018](https://portal.inss.gov.ao/wp-content/uploads/2021/10/227_18.pdf) | Vinculação, taxas, base e prazo. Art. 37.º: vigora 90 dias após publicação. |
| INSS-especial | [Decreto Presidencial n.º 295/20, de 18-11-2020](https://portal.inss.gov.ao/wp-content/uploads/2021/10/295_20.pdf) | Regime de trabalhadores por conta de outrem de baixos rendimentos. |
| AGT-2026 | [Calendário Fiscal AGT 2026](https://portaldocontribuinte.minfin.gov.ao/pdfs/CALENDARIO_FISCAL_2026.pdf) | Prazos operacionais apenas de 2026. |
| AGT-IVA | [IVA — Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-valor-acrescentado), [Tabela de procedimentos IVA da AGT](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw4z/oty4/~edisp/minfin3968223.pdf) e [início de actividade IVA/Modelo 6](https://portaldocontribuinte.minfin.gov.ao/noticias/inicio-actividade-iva) | Cadastro, enquadramento e procedimento. |
| AGT-II | [Imposto Industrial — Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-industrial) e [comunicado II provisório 2026](https://portaldocontribuinte.minfin.gov.ao/noticia?id=985597) | Obrigações, taxas divulgadas e prazo provisório. |
| AGT-IRT | [IRT — Portal do Contribuinte](https://portaldocontribuinte.minfin.gov.ao/impostos-e-taxas/imposto-sobre-rendimentos-do-trabalho) | Base Grupo A, componentes e obrigações. |

## Contagem de regras e critério de implementação

Nas 26 linhas de regras fiscais das matrizes IVA, II, IRT e INSS há **12
implementadas parcialmente**, **14 por apurar** e **1 conflito de fonte
resolvido** (a dedução de IVA simplificado de 10%, em que o CIVA republicado
prevalece sobre guias antigos). Não há regra marcada como totalmente
implementada: cada cálculo permanece limitado aos factos, período e fonte
indicados na tabela.

Nenhuma regra sem ligação oficial acima é implementada. Nos restantes casos o
produto mantém montante nulo e apresenta “Por apurar — confirme na AGT/INSS”.

## IVA — Imposto sobre o Valor Acrescentado

**Diploma e vigência:** Lei n.º 14/23, publicada em 28-12-2023. Pelo art. 19.º, n.º 4 do CIVA, a taxa é a vigente quando o imposto se torna exigível. Rever a fonte antes de calcular períodos posteriores a 2026.

| Regime/operação | Regra oficial | Obrigação/período | Fonte | Estado no produto |
| --- | --- | --- | --- | --- |
| Geral — taxa normal | 14% para importações, transmissões de bens e prestações de serviços. | Modelo 7, anexos e pagamento até dia 15 de cada mês em 2026; SAF-T até ao fim de cada mês. | CIVA, art. 19.º, n.º 1, al. a); Calendário 2026. | **Implementada (parcial).** A factura grava 14%, mas sem classificação fiscal por linha não pode afastar taxas/isenções especiais. |
| Geral — hotelaria/restauração | 7% somente se forem cumpridas cumulativamente as condições do art. 19.º, n.º 2. | Conforme regime geral. | CIVA, art. 19.º, n.º 1, al. c) e n.º 2. | **Por apurar — confirme na AGT.** Faltam actividade e prova das condições. |
| Geral — bens alimentares/insumos | 5% somente para bens dos Anexos I e II. | Conforme operação. | CIVA, art. 19.º, n.º 1, al. d). | **Por apurar — confirme na AGT.** Não existe classificação pelos anexos. |
| Geral — Cabinda | 1% para operações abrangidas pelo regime especial, com as excepções legais. | Conforme operação. | CIVA, art. 19.º, n.º 1, al. e). | **Por apurar — confirme na AGT.** Não há dado territorial/classificação. |
| Simplificado — enquadramento | Volume de negócios/operações de importação do ano anterior igual ou superior a Kz 25.000.000 e inferior a Kz 350.000.000. No início, usa previsão do ano corrente, verificável pela Administração Tributária. | Cadastro/alteração deve ter comprovativo. | CIVA, art. 69.º-A, n.os 1–2. | **Implementada (parcial).** Há enquadramento por imposto/período; não há validação oficial do limiar/previsão. |
| Simplificado — apuramento | 7% sobre volume de negócios **efectivamente recebido**, incluindo isentas, adiantamentos e pagamentos antecipados. A locação de imóveis fica fora desta regra. | Declaração simplificada e anexos, mensalmente, sobre operações do mês anterior. | CIVA, arts. 19.º, n.º 1, al. b), 69.º-B, n.º 1 e 69.º-C, n.os 1–3; Calendário 2026. | **Por apurar — confirme na AGT.** Não há recebimentos conciliados nem apuramento mensal. |
| Simplificado — dedução/factura | Dedução de 10% da totalidade do IVA suportado; os restantes 90% são dedutíveis ao imposto sobre rendimento. Factura deve dizer “IVA - Regime Simplificado”. | Mensal; menção obrigatória na factura. | CIVA, arts. 69.º-B, n.º 2 e 69.º-C, n.os 4–5. | **Implementada (parcial).** A menção existe; a dedução de 10% e ligação às compras/rendimento não. |
| Exclusão/adesão | A tabela AGT identifica exclusão abaixo de Kz 25.000.000, simplificado entre Kz 25.000.000 e menos de Kz 350.000.000 e geral desde Kz 350.000.000. | Alteração baseada no cadastro e aprovação quando exigida. | Tabela AGT, com remissão para CIVA arts. 60.º, 62.º e 69.º-A. | **Por apurar — confirme na AGT.** O produto não infere regime por facturação. |
| Caixa, isenções e outros | Têm regras, recibos e direito à dedução próprios. | Depende do enquadramento/documentos. | CIVA, arts. 67.º–69.º e regras de isenção. | **Por apurar — confirme na AGT.** Não há dados para activação segura. |

### Nota sobre fontes antigas

Páginas históricas do Portal descrevem o regime transitório e limiares em USD,
expressamente ligados a 2020; não servem para calcular em 2026. Guias antigos
apresentam dedução de 7%, mas a fonte primária actual prevalece: CIVA,
art. 69.º-C, n.º 4 determina 10%. **Conflito resolvido pela fonte primária**;
o produto continua sem implementar o cálculo.

## Imposto Industrial (II)

**Diplomas a consolidar:** Lei n.º 19/14, com alterações das Leis n.º 26/20 e
n.º 27/22. Não calcular a matéria colectável definitiva só com receitas menos
custos; é necessário apurar correcções, prejuízos, actividade e sector.

| Regime/operação | Regra oficial | Obrigação/período | Fonte | Estado no produto |
| --- | --- | --- | --- | --- |
| Geral — definitivo | Incide sobre lucros. AGT publica 25% geral, 10% para certas actividades primárias e 35% para banca, seguros, telecomunicações e petrolíferas angolanas. | Modelo 1 e pagamento até último dia útil de Maio; em 2026, 29-05. | CII; AGT-II; Calendário 2026. | **Por apurar — confirme na AGT.** O motor não calcula definitivo sem matéria colectável fiscal. |
| Geral — provisório 2026 | 2% sobre vendas de bens e serviços não sujeitos a retenção dos primeiros seis meses. Prejuízo no exercício anterior dispensa liquidação, mas exige declaração. | 31-08-2026. | CII, art. 66.º, n.os 1, 2, 4 e 10, conforme comunicado AGT 985597; Calendário 2026. | **Por apurar — confirme na AGT.** Faltam vendas excluídas, prejuízo e excepções sectoriais. |
| Simplificado — enquadramento | Aplica-se aos sujeitos de II abrangidos pelo regime de não sujeição/exclusão de IVA, segundo a AGT. | Exige prova da situação IVA. | AGT-II. | **Implementada (parcial).** Há enquadramento por imposto/período, não validação da condição. |
| Simplificado — definitivo | Declaração simplificada/livro de compras, vendas e serviços e pagamento anual; o calendário 2026 distingue modalidade com e sem contabilidade. | O calendário mostra instâncias Fevereiro/Abril e 30-04 para modalidade sem contabilidade; escolher pelo canal real do contribuinte. | AGT-II; Calendário 2026. | **Por apurar — confirme na AGT.** Não há fórmula definitiva nem selector documental. |
| Retenção de serviços | Taxas/regras de 6,5% dependem de serviço, residência/estabelecimento e artigo aplicável. Lei 26/20 altera art. 67.º; Lei 27/22 altera art. 73.º, vigente desde 01-01-2023. | Calendário inclui entrega de retenções de serviços pagos no mês anterior. | Lei 26/20, art. 67.º; Lei 27/22, art. 1.º; Calendário 2026. | **Por apurar — confirme na AGT.** Não aplicar percentagem universal por empresa. |

## IRT — Imposto sobre os Rendimentos do Trabalho

**Âmbito do produto:** só Grupo A, ano de 2026. Não prolongar a tabela a
2027, nem aplicá-la a Grupo B, Grupo C ou regimes especiais.

### Grupo A — tabela de 2026

Fonte: Lei n.º 14/25, art. 21.º, n.º 3 e Anexo I.

| Rendimento colectável mensal (Kz) | Cálculo |
| --- | --- |
| Até 150.000 | Isento |
| Mais de 150.000 até 200.000 | 12.500 + 16% do excesso sobre 150.000 |
| Mais de 200.000 até 300.000 | 31.250 + 18% do excesso sobre 200.000 |
| Mais de 300.000 até 500.000 | 49.250 + 19% do excesso sobre 300.000 |
| Mais de 500.000 até 1.000.000 | 87.250 + 20% do excesso sobre 500.000 |
| Mais de 1.000.000 até 1.500.000 | 187.250 + 21% do excesso sobre 1.000.000 |
| Mais de 1.500.000 até 2.000.000 | 292.250 + 22% do excesso sobre 1.500.000 |
| Mais de 2.000.000 até 2.500.000 | 402.250 + 23% do excesso sobre 2.000.000 |
| Mais de 2.500.000 até 5.000.000 | 517.250 + 24% do excesso sobre 2.500.000 |
| Mais de 5.000.000 até 10.000.000 | 1.117.250 + 24,5% do excesso sobre 5.000.000 |
| Mais de 10.000.000 | 2.342.250 + 25% do excesso sobre 10.000.000 |

| Regra/obrigação | Regra oficial | Fonte/período | Estado no produto |
| --- | --- | --- | --- |
| Base Grupo A | Remunerações em dinheiro ou espécie, menos contribuições obrigatórias SS e componentes não sujeitas/isentas. | CIRT e AGT-IRT. | **Implementada (parcial).** A folha subtrai SS e aplica limites de alimentação/transporte; faltam classificações para todas as rubricas não sujeitas/isentas. |
| Alimentação/transporte | Não sujeitos até Kz 30.000 mensais, nas condições legais. | AGT-IRT. A consulta pública IRPS da AGT confirma o limite então actual de Kz 30.000, mas proposta não é lei. | **Implementada (parcial).** O limite existe; é preciso prova/tipo de cada componente. |
| Liquidação/entrega Grupo A | Mapa de remunerações e imposto retido sobre o mês anterior. | Calendário 2026; Modelo 2 anual em 27-02-2026. | **Implementada (parcial).** Só nasce com trabalhador/folha; não copiar calendário a 2027. |
| Grupos B e C | Base, retenções e declarações variam por grupo, contabilidade e rendimento. | CIRT, AGT-IRT e Calendário 2026. | **Por apurar — confirme na AGT.** A folha não os calcula. |
| Auto-facturação B/C | AGT distingue retenções de 2% ou 6,5% e entrega em cinco dias. | AGT-IRT e Calendário 2026. | **Por apurar — confirme na AGT.** Não é uma retenção genérica de factura. |

## INSS / Protecção Social Obrigatória

| Regra/obrigação | Regra oficial | Artigo/vigência | Estado no produto |
| --- | --- | --- | --- |
| Inscrição da entidade | Obrigatória até 30 dias após a constituição e declaração de trabalhadores. | DP 227/18, art. 7.º, n.º 1. | **Por apurar — confirme no INSS.** Onboarding deve guardar data e evidência, sem concluir inscrição automaticamente. |
| Inscrição do trabalhador | Entidade inscreve trabalhador e dependentes até 30 dias do início do vínculo; extensão a 60 dias só nos termos legais. | DP 227/18, art. 7.º, n.os 2–5. | **Implementada (parcial).** Há dados de trabalhador, não confirmação/cálculo completo do prazo. |
| Regime geral | Entidade empregadora 8%; trabalhador 3%, sobre remunerações da base. | DP 227/18, arts. 11.º–12.º, n.º 1. | **Implementada (parcial).** Aritmética Decimal das duas parcelas; rever diplomas futuros. |
| Trabalhador reformado | Empregador mantém 8%; trabalhador já reformado 8%. | DP 227/18, art. 12.º, n.º 2. | **Implementada (parcial).** Categoria RETIRED usa 8%/8%; condição precisa de prova. |
| Base contributiva | Remuneração ilíquida e espécie monetizada; exclui prestações sociais PSO, subsídio de férias e protecção social complementar legalmente prevista. | DP 227/18, art. 13.º, n.os 1–4. | **Implementada (parcial).** Férias são excluídas; rubricas restantes precisam classificação explícita. A obrigação agregada deve reportar base contributiva, não apenas bruto. |
| Folha/pagamento | Empregador declara folha, base e taxa e paga ambas parcelas até ao dia 10 do mês seguinte, salvo regime especial. | DP 227/18, arts. 14.º–15.º. | **Implementada (parcial).** Gerar somente com trabalhador/folha; sem folha, valor nulo. |
| Especiais | Existem taxas/bases próprias, incluindo DP 295/20 para baixos rendimentos. | DP 227/18, art. 12.º, n.º 3; DP 295/20. | **Por apurar — confirme no INSS.** Falha fechado; não converter para standard. |

## Início de actividade e empresa nova

| Evento | Fonte/regra oficial | Tratamento seguro |
| --- | --- | --- |
| Antes de actividade comercial/industrial | AGT-II informa inscrição no Registo Geral de Contribuintes antes do exercício. Para intenção de iniciar, confirma/actualiza elementos em 60 dias ou comunica que não iniciou. | Guardar data de início de actividade, distinta da criação da conta. Não gerar obrigações anteriores. |
| Início/alteração IVA | Portal disponibiliza Modelo 6; para Simplificado, previsão do ano corrente é base de enquadramento no início. | Regime IVA separado, opção “Não sei” e comprovativo/revisão antes do cálculo. |
| Início II | A AGT esclarece que cadastramento e declaração de início não implicam por si pagamento; pessoa singular poderá estar em IRT Grupo C. | Regime II separado do IVA; não criar valor de II só por existir empresa. |
| Primeiro trabalhador | Inscrição INSS e IRT/INSS apenas com vínculo/folha. | Gerar apenas a partir de factos laborais; nunca valor sem folha. |
| História anterior | Não há base para apurar dívida/multa sem declaração/documento oficial. | Criar estado “obrigações anteriores por confirmar”; nunca reescrever paga/submetida. |

## Confronto com o código actual

| Área | Resultado | Acção/documentação |
| --- | --- | --- |
| backend/src/fiscal-rules/iva-rules.ts e invoice | Taxas estão centralizadas, mas factura do Geral aplica 14% e código NOR a todas as linhas sem classificá-las. | **Parcial.** Bloquear/por apurar a classificação ausente antes de tratar o valor persistido como definitivo. |
| IVA Simplificado | Não acrescenta 14% e inclui menção, mas não modela recebimentos nem dedução legal de 10%. | **Por apurar.** Falta modelo/implementação, não fonte primária. |
| II | Motor não transforma receitas/custos em definitivo e não automatiza provisório. | **Por apurar.** Preservar bloqueio até haver factos e versão consolidada. |
| Retenções | RetentionEngine falha fechado, mas InvoiceService aplica Tenant.retentionRate a toda factura normal. | **Por apurar — risco activo.** Taxa por empresa não prova incidência, natureza, residência, artigo ou vigência. |
| IRT 2026 | Tabela Grupo A corresponde ao Anexo I e é limitada a 2026. | **Parcial.** Manter falha fechada fora de 2026 e classificar rubricas. |
| INSS | Taxas 8%/3% e 8%/8%, e exclusão de férias, são compatíveis com DP 227/18. | **Parcial.** Conferir base/reporting e regimes especiais. |
| Calendário | Seed aponta para Calendário AGT 2026 e extensão excepcional IVA de Abril. | **Parcial.** Conservar URL, ano e prorrogação; não propagar datas. |

## Não automatizar sem nova confirmação

1. IVA reduzido, isento, Cabinda, caixa ou linha sem classificação.
2. IVA Simplificado sem recebimentos conciliados e IVA suportado documentalmente elegível.
3. II definitivo sem matéria colectável, ajustamentos, prejuízos e sector.
4. Retenção baseada só numa percentagem da empresa.
5. IRT fora de Grupo A/2026 ou rubrica sem tratamento jurídico.
6. INSS especial ou categoria de segurado sem prova.
7. Qualquer limite, calendário ou vigência para 2027 e seguintes.

Nestes casos, apresentar **“Por apurar — confirme na AGT/INSS”** e manter o montante nulo, nunca substituí-lo por 0 Kz.

## Matriz de testes de cálculo e bloqueio seguro

Os casos abaixo são executados nas suites `iva.engine.spec.ts`,
`industrial.engine.spec.ts` e `payroll-calculator.spec.ts`. A coluna
**obtido** regista a execução local de 08-11-2026: 56 testes de cálculo,
geração e vigências passaram. Os resultados que dizem “sem cálculo” são
deliberados: não são valores fiscais de zero.

| Cálculo/caso | Fonte e vigência | Esperado | Obtido |
| --- | --- | --- | --- |
| IVA Geral, operação de Kz 1.000,05 | CIVA-2023, art. 19.º, n.º 1, al. a), 2026 | IVA Kz 140,01; total Kz 1.140,06 com arredondamento Decimal | IVA Kz 140,01; total Kz 1.140,06 |
| IVA Geral, valor zero | CIVA-2023, art. 19.º, n.º 1, al. a) | IVA e total Kz 0,00 | IVA e total Kz 0,00 |
| IVA Simplificado | CIVA-2023, arts. 69.º-B e 69.º-C, 2026 | Sem liquidação automática enquanto faltarem recebimentos e IVA suportado elegível | Estado de confirmação oficial; sem liquidação |
| IRT Grupo A, fronteiras 150.000 / 200.000 / 10.000.000 Kz | OGE-2026, art. 21.º, n.º 3 e Anexo I | Kz 0,00 / 20.500,00 / 2.342.250,00 | Kz 0,00 / 20.500,00 / 2.342.250,00 |
| IRT Grupo A, arredondamento de fronteira 150.000,004 / 150.000,005 Kz | OGE-2026, art. 21.º, n.º 3 e Anexo I | Kz 0,00 / 12.500,00 | Kz 0,00 / 12.500,00 |
| INSS regime geral, base Kz 260.002,00 | INSS-2018, arts. 11.º–13.º | Trabalhador Kz 7.800,06 (3%); entidade Kz 20.800,16 (8%) | Kz 7.800,06 / Kz 20.800,16 |
| INSS de reformado, base Kz 100.000,00 | INSS-2018, art. 12.º, n.º 2 | Kz 8.000,00 para trabalhador e entidade | Kz 8.000,00 / Kz 8.000,00 |
| II Geral, receitas/custos sem todos os factos fiscais | CII e AGT-II, 2026 | Definitivo e provisório por apurar; taxa nula | Ambos nulos; revisão necessária |
| II sem enquadramento por imposto | CII e AGT-II, 2026 | Sem cálculo e sem herdar o regime legado | Regime nulo; sem cálculo |

Os testes de geração confirmam adicionalmente que IVA e II são independentes,
que IRT/INSS só nascem com facto laboral e que uma vigência encerrada não muda
obrigações já existentes.

## Simulação para empresas existentes

O comando `npm run fiscal:simulate` dentro de `backend/` é **somente de
leitura**: não aceita `--apply`, não cria nem altera registos e apresenta um
relatório JSON com contagens e exemplos anonimizados. Ele identifica, entre
outros pontos, empresas ainda só com o regime legado, obrigações anteriores à
data declarada de início, valores por apurar e obrigações sem `referenceYear`.

Por segurança, uma base remota é recusada por defeito. Só pode ser lida após
definir `FISCAL_SIMULATION_ALLOW_REMOTE_READ=true` e confirmar previamente que
a credencial usada é de leitura. O resultado deve ser revisto antes de aplicar
a migração em qualquer ambiente depois de um backup confirmado.
