-- Integridade aditiva das notas de crédito e débito.
--
-- Esta migração não altera, recalcula nem remove documentos históricos. As
-- relações são acrescentadas como NOT VALID para que referências históricas
-- eventualmente incompletas não bloqueiem a instalação; todas as novas notas
-- passam a ser verificadas pela base de dados.

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "adjustmentOperationId" TEXT,
  ADD COLUMN IF NOT EXISTS "adjustmentValidationStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "adjustmentValidationRuleVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "adjustmentValidatedAt" TIMESTAMP(3);

ALTER TABLE "InvoiceItem"
  ADD COLUMN IF NOT EXISTS "sourceInvoiceItemId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_tenantId_adjustmentOperationId_key"
  ON "Invoice"("tenantId", "adjustmentOperationId");

CREATE INDEX IF NOT EXISTS "Invoice_tenantId_rectifiesInvoiceId_fiscalDocumentType_status_idx"
  ON "Invoice"("tenantId", "rectifiesInvoiceId", "fiscalDocumentType", "status");

CREATE INDEX IF NOT EXISTS "InvoiceItem_sourceInvoiceItemId_idx"
  ON "InvoiceItem"("sourceInvoiceItemId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Invoice_rectifiesInvoiceId_fkey'
  ) THEN
    ALTER TABLE "Invoice"
      ADD CONSTRAINT "Invoice_rectifiesInvoiceId_fkey"
      FOREIGN KEY ("rectifiesInvoiceId")
      REFERENCES "Invoice"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'InvoiceItem_sourceInvoiceItemId_fkey'
  ) THEN
    ALTER TABLE "InvoiceItem"
      ADD CONSTRAINT "InvoiceItem_sourceInvoiceItemId_fkey"
      FOREIGN KEY ("sourceInvoiceItemId")
      REFERENCES "InvoiceItem"("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
      NOT VALID;
  END IF;
END
$$;

-- Reversão documentada (executar apenas após confirmar que não há notas novas
-- dependentes das colunas): remover primeiro as chaves estrangeiras e índices,
-- depois as colunas adicionadas. Não há reversão automática para preservar
-- documentos emitidos.
