# Facturação Electrónica AGT — Base técnica

**Estado:** `NOT_CERTIFIED`
**Data de revisão:** 3 de Outubro de 2026
**Âmbito:** preparação técnica e homologação; nenhuma chamada de produção foi executada.

## Contrato oficial revisto

| Propriedade | Valor confirmado | Fonte oficial |
|---|---|---|
| Schema | 2.0; o Portal do Parceiro informa que o schema 1 deixou de ser suportado | Portal do Parceiro |
| Autenticação | HTTP Basic Auth em cada chamada | AGT, Autenticação & Autorização |
| Homologação | `https://sifphml.minfin.gov.ao/sigt/fe/v1` | páginas dos serviços AGT |
| Produção | `https://sifp.minfin.gov.ao/sigt/fe/v1` | páginas dos serviços AGT |
| Assinatura | JWS compacto, RS256, RSA mínimo 2048 bits; 4096 recomendado | AGT, Estrutura JWS |
| UUID | UUID RFC 4122 único por submissão do emissor | AGT, Registar Factura |
| Lote | máximo de 30 documentos | AGT, Registar Factura |
| Processamento | assíncrono; `requestID` confirma recepção, não valida a factura | AGT, Modelo assíncrono e Registar Factura |
| Estado | `obterEstado`; assinatura sobre NIF e `requestID` | AGT, Consultar Estado |
| Consulta | `consultarFactura`; assinatura sobre NIF e `documentNo` | AGT, Consultar Factura |
| Séries | solicitadas à AGT; assinatura da requisição sobre NIF, ano, tipo, estabelecimento e contingência | AGT, Solicitar Criação de Série |

Fontes:

- https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/api.html
- https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/servicos/registar.html
- https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/servicos/consultar.html
- https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/servicos/consultar_fatura.html
- https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/servicos/solicitar.html
- https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/estrutura.html
- https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/modelo.html
- Decreto Executivo n.º 683/25: https://www.ucm.minfin.gov.ao/cs/groups/public/documents/document/aw40/otuy/~edisp/minfin4952361.pdf

### Divergência documental observada

A página oficial `consultarFactura` mostra `invoiceNo` no exemplo, mas a tabela de parâmetros e o payload assinado usam `documentNo`. A implementação usa `documentNo`, por ser o nome definido na especificação dos parâmetros e na assinatura. Este ponto deve ser confirmado com a AGT durante homologação.

A página `solicitarSerie` apresenta um URL de homologação inconsistente (`/ws/v1/registarFactura`) apesar de descrever `solicitarSerie`. A implementação combina a base homologação comum publicada nos restantes serviços com o caminho lógico `solicitarSerie`; exige confirmação em homologação.

Na mesma página, o exemplo do payload de assinatura da série inclui `seriesContingencyIndicator`, enquanto a lista textual dos campos assinados o omite. A implementação inclui o indicador para corresponder ao payload explícito; esta opção deve ser confirmada com a AGT durante homologação.

## Arquitectura implementada

O módulo `electronic-invoicing` é independente do motor SAF-T e da assinatura fiscal local. Ele inclui:

- configuração exclusiva por variáveis de ambiente;
- cliente HTTP server-side com Basic Auth, timeout e validação de resposta;
- JWS RS256 com JSON canónico e rejeição de RSA inferior a 2048 bits;
- preflight próprio, com dados, imposto, tipo de operação, série e configuração;
- submissão idempotente por factura e reutilização de `submissionUUID`;
- persistência de `requestID`, estado, tentativas, timestamps, erros e histórico;
- consulta de estado e consulta de factura sem alterar a factura histórica;
- solicitação e persistência de séries atribuídas pela AGT;
- isolamento por tenant e RBAC nos endpoints de escrita;
- interface de preparação/homologação e painel no detalhe da factura.

## Bloqueios deliberados

- Produção é sempre bloqueada enquanto `CERTIFICATION_STATUS = NOT_CERTIFIED`.
- Homologação exige configuração completa e `AGT_EINVOICE_TRANSMISSION_ENABLED=true`.
- A classificação `operationType` é explícita e persistida; não é inferida da unidade ou descrição.
- Séries locais existentes não são tratadas como séries oficiais AGT.
- Ausência de dados obrigatórios bloqueia o preflight; nenhum valor oficial é inventado.

## Configuração

Consultar `backend/.env.example`. As credenciais, o Product ID, o número de validação e a chave privada devem ser fornecidos por canais oficiais. A chave da facturação electrónica não deve reutilizar a chave SAF-T. Nenhum segredo pode ser exposto ao frontend.

## Migration

`20261003120000_electronic_invoicing_base` é aditiva e cria tabelas de submissões e séries, snapshots explícitos de tipo de operação e histórico de respostas. Não foi aplicada à Neon nem a qualquer base de produção.

## Validação pendente externa

- credenciais e chaves oficiais;
- Product ID e SoftwareValidationNumber;
- série AGT de homologação;
- confirmação das duas divergências documentais acima;
- execução acompanhada em homologação;
- processo formal de certificação AGT.

Até essas etapas, o produto não deve afirmar certificação, homologação concluída ou aptidão para transmissão oficial.
