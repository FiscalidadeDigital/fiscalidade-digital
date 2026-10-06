# SAF-T (AO)

## Estado

`CERTIFICATION_STATUS = NOT_CERTIFIED`

A aplicação ainda não gera nem apresenta ficheiros SAF-T como válidos. O endpoint existente faz diagnóstico contabilístico por tenant e mantém a exportação bloqueada.

## Fontes confirmadas

- Decreto Presidencial n.º 312/18, de 21 de Dezembro: estabelece a submissão electrónica dos elementos de facturação, aquisição de bens e serviços, contabilidade e inventário; define a estrutura SAF-T (AO) e exige conformidade com XSD.
- Decreto Executivo n.º 74/19, de 6 de Março: exige exportação SAF-T (AO), assinatura dos documentos fiscalmente relevantes e protecção da chave privada do produtor.
- Comunicado AGT sobre SAF-T contabilístico e Decreto Executivo n.º 317/20, de 14 de Dezembro: confirma cabeçalho, tabelas mestres e movimentos contabilísticos para o ficheiro contabilístico.
- `backend/src/saft/schemas/SAFTAO1.01_01.xsd`: referência técnica obtida do projecto ASSOFT. O próprio artefacto declara versão `1.01_01` e estado `Development`; não é tratado como prova de homologação ou como artefacto oficial autenticado.

## Arquitectura actual

- `GET /accounting/saft/readiness` usa exclusivamente o tenant do JWT.
- O diagnóstico inventaria empresa, clientes, fornecedores, produtos, facturas emitidas, facturas recebidas e movimentos fiscais.
- A exportação XML está desactivada.
- Não existe plano de contas, diário, razão nem lançamentos de partidas dobradas.
- Invoice/InvoiceItem não persistem todos os campos fiscais exigidos para uma exportação segura: série formal, tipo/código fiscal por linha, motivo/código de isenção, hash e hash control.

## Implementado nesta fase

- Metadados fiscais aditivos no documento: tipo fiscal, série, sequência, exercício, anulação e referência de rectificação.
- Verdade fiscal por linha: tipo, código, taxa, montante e dados de isenção.
- Novas linhas tributadas guardam taxa e montante calculados pelo mesmo serviço que cria a factura.
- IVA zero permanece sem classificação automática; não é convertido silenciosamente em isenção.
- Migration local `20261002120000_saft_fiscal_document_metadata`; não aplicada em produção.

## Preflight

O preflight deve bloquear exportação quando faltar:

- identidade e morada fiscal completa da empresa;
- identificação obrigatória de clientes, fornecedores ou produtos referenciados;
- classificação fiscal por linha e informação de isenção quando aplicável;
- assinatura/hash conforme especificação confirmada;
- XSD oficial aplicável e validador executável;
- configuração de certificação que seja obrigatória para o tipo de ficheiro.

## Segurança

- O tenant é derivado da autenticação.
- Chaves privadas nunca podem ser armazenadas no frontend, Git, base de dados operacional ou logs.
- Uma futura configuração deve usar secrets do backend e expor apenas estado e identificadores públicos.
- O download deve ser produzido pelo backend e nunca revelar caminhos locais.

## Pendências exclusivamente dependentes da AGT

- confirmação oficial do XSD e versão aplicáveis ao processo actual;
- número oficial de certificação do software;
- ProductID e demais identificadores atribuídos;
- processo de homologação e data efectiva da certificação.

## Pendências técnicas

- persistência da verdade fiscal por linha;
- séries e tipos documentais completos, incluindo documentos rectificativos;
- cadeia criptográfica validada por vector oficial;
- serializador ordenado segundo o XSD;
- validação XSD executável no backend;
- plano de contas, diários e razão para SAF-T contabilístico;
- movimentos e valorização de stock para SAF-T de inventário;
- testes de isolamento, totais, arredondamento, escaping e downloads.

Nenhuma destas pendências deve ser mascarada por valores inventados ou por XML aproximado.
# Assinatura fiscal técnica — checkpoint de 2 de Outubro de 2026

O motor implementa a assinatura no momento da emissão do documento. O exportador SAF-T apenas consome `fiscalHash`, `fiscalHashControl` e a versão da chave persistidos; não recalcula nem cria assinaturas retroactivas.

Fonte normativa principal: Decreto Executivo n.º 74/19, de 6 de Março, publicado no Diário da República e disponibilizado pelo [Ministério das Finanças](https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw40/otq5/~edisp/minfin4949834.pdf). O anexo técnico define RSA, chave PEM de 1024 bits, SHA-1, PKCS#1 v1.5, UTF-8, Base64 sem quebras de linha e o texto `InvoiceDate;SystemEntryDate;InvoiceNo;GrossTotal;HashAnterior`. O primeiro documento usa o último campo vazio e conserva o ponto e vírgula final. `HashControl` guarda a versão inteira e sequencial da chave privada.

O ficheiro `minfin055809.pdf`, anteriormente consultado para localizar o detalhe técnico, identifica-se no próprio conteúdo como proposta de Decreto Executivo. É apenas material preparatório e não é tratado como a fonte normativa final.

Configuração exclusiva do backend:

- `FISCAL_SIGNATURE_PRIVATE_KEY`: chave privada RSA PEM de 1024 bits, armazenada num secret manager;
- `FISCAL_SIGNATURE_KEY_VERSION`: versão inteira positiva comunicada para a chave;
- `SAFT_PRODUCT_COMPANY_TAX_ID`, `AGT_SOFTWARE_CERTIFICATE_NUMBER`, `AGT_SOFTWARE_PRODUCT_ID` e `SAFT_PRODUCT_VERSION`: metadados oficiais do software para o cabeçalho.

A ausência destes dados produz blockers estruturados. `CERTIFICATION_STATUS` permanece `NOT_CERTIFIED`. A validação verde contra `SAFTAO1.01_01.xsd` comprova somente conformidade estrutural da fixture técnica completa; o próprio XSD versionado declara estado `Development` e não prova certificação AGT.

Documentos históricos sem assinatura persistida são classificados como `LEGACY_UNSIGNED_DOCUMENT`. O sistema não oferece backfill criptográfico retroactivo.
