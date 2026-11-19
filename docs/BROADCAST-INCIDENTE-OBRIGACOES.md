# Broadcast de correcção de alertas de vencimento — rascunho, não enviar

> Estado: **NÃO ENVIAR**. A lista de destinatários e o texto exigem aprovação
> explícita do responsável antes de qualquer contacto.

## 1. Auditoria de destinatários (somente leitura)

O script `backend/scripts/audit-undue-deadline-email-recipients.ts` não possui
integração de envio, não chama o Resend e não contém mutações Prisma. Só aceita
uma ligação a uma branch Neon e exige que a saída esteja fora do repositório.

Exemplo para o operador, **apenas depois de criar a branch Neon cópia da
produção**:

```powershell
$env:FISCAL_AUDIT_NEON_BRANCH = 'nome-da-branch-neon-de-ensaio'
$env:FISCAL_BROADCAST_REPORT_PATH = "$env:USERPROFILE\Documents\auditoria-alertas-vencimento.json"
# DATABASE_URL deve apontar apenas para a branch Neon de ensaio.
npm run fiscal:broadcast-audit
```

O terminal mostra somente contagens e o caminho do relatório. A lista local
contém dados pessoais mínimos para revisão humana e não deve ser anexada a
issues, commits, logs de CI ou chats. O relatório distingue:

- candidatos confirmados: prazo da obrigação anterior à data de início de
  actividade declarada;
- casos para revisão: data de início ausente ou obrigação ainda por apurar.

Um utilizador só é listado se o e-mail activo coincidir com o e-mail actual da
empresa. Como os logs históricos guardam o destinatário com máscara, isso é
uma referência para confirmação humana, não uma alegação automática de entrega.

## 2. Modelo Resend — rascunho para aprovação

Classificação: mensagem de incidente/transaccional, sem promoção ou conteúdo
comercial.

**Assunto:** Correcção de notificação de prazo — Fiscalidade Digital

**Preheader:** Identificámos um erro de sistema numa notificação de prazo.

**Texto simples:**

```text
Olá, {{nome_empresa}}.

Identificámos um erro de sistema que pode ter feito chegar uma notificação de
vencimento que não devia ter sido enviada para a sua empresa.

Pedimos desculpa pelo incómodo. Estamos a corrigir o processo e a rever o
registo afectado. Esta mensagem não altera, por si só, qualquer obrigação fiscal
nem substitui a confirmação junto da AGT ou do INSS quando aplicável.

Pode consultar a sua área de Obrigações na Fiscalidade Digital. Se tiver alguma
dúvida, responda a este e-mail ou contacte {{contacto_suporte}}.

Fiscalidade Digital
```

**HTML mínimo:** usar o mesmo conteúdo, com `{{nome_empresa}}` e
`{{contacto_suporte}}` escapados e uma ligação para a área de Obrigações.

O pedido menciona “texto abaixo”, mas não veio texto adicional nesta conversa;
este é um rascunho neutro e está marcado para aprovação. Não criar broadcast,
segmento ou envio no Resend antes da aprovação do texto e da lista.

## 3. Plano de envio depois de aprovado

1. Guardar a versão aprovada do texto, a hash do relatório de auditoria e a
   lista explicitamente aprovada num registo de incidente restrito.
2. Enviar primeiro **um único teste** apenas para o e-mail do responsável
   indicado por ele, com dados fictícios/mascarados e sem destinatários em CC ou
   BCC. **[CONFIRMAR e-mail de teste]**
3. Confirmar conteúdo, remetente, ligação e recepção. Rever o log de entrega
   antes de avançar.
4. Criar envios individuais em lotes pequenos (por exemplo, 10 de cada vez),
   com exactamente um destinatário no campo `to` por mensagem. Não usar CC,
   BCC nem uma lista visível aos destinatários.
5. Para cada destinatário, criar uma entrada de registo antes do envio com:
   `incidentId`, hash do destinatário, versão do modelo, data, estado, ID de
   mensagem Resend e chave de idempotência determinística
   `deadline-incident-v1:<tenantId>:<alertId>`.
6. Reutilizar a mesma chave nas tentativas. Tratar apenas falhas transitórias
   (429/5xx/timeout) com backoff; não repetir 4xx sem correcção. Consultar os
   eventos do Resend e actualizar o registo para enviado/falhou/suprimido.
7. Entre lotes, reconciliar contagens de aprovados, enviados, suprimidos e
   falhados. Parar se houver divergência, bounce anormal ou reclamação.

Uma criação de broadcast no Resend deve permanecer em *draft* até à aprovação
final; este repositório não contém qualquer comando que crie ou envie esse
broadcast.
