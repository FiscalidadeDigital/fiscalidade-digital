-- Enquadramento e estados fiscais: alteração aditiva e sem migração de dados
-- destrutiva. Não executar esta migração manualmente em produção; o processo
-- de deploy deve aplicá-la apenas depois de existir uma cópia de segurança.

-- Tenant.regime continua disponível apenas para compatibilidade com registos
-- históricos. A aplicação deixa de lhe atribuir GERAL por omissão.
ALTER TABLE "Tenant"
  ALTER COLUMN "regime" DROP DEFAULT,
  ALTER COLUMN "regime" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "activityStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "hasPriorUnregularizedObligations" BOOLEAN NOT NULL DEFAULT false;

-- Um regime desconhecido é representado sem inventar um valor de regime.
ALTER TABLE "TaxRegimeAssignment"
  ALTER COLUMN "regime" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaxRegimeKnowledgeStatus') THEN
    CREATE TYPE "TaxRegimeKnowledgeStatus" AS ENUM ('CONFIRMED', 'UNKNOWN');
  END IF;
END
$$;

ALTER TABLE "TaxRegimeAssignment"
  ADD COLUMN IF NOT EXISTS "knowledgeStatus" "TaxRegimeKnowledgeStatus" NOT NULL DEFAULT 'CONFIRMED';

-- O ano de referência é independente do ano do vencimento (por exemplo,
-- declarações de Dezembro com prazo em Janeiro).
ALTER TABLE "FiscalObligation"
  ADD COLUMN IF NOT EXISTS "referenceYear" INTEGER;

CREATE INDEX IF NOT EXISTS "FiscalObligation_tenant_referenceYear_idx"
  ON "FiscalObligation" ("tenantId", "referenceYear");

-- Estados acrescentados sem alterar estados já guardados. Os estados de
-- urgência são calculados em leitura; só HISTORICAL_CONFIRMATION pode ser
-- guardado para uma declaração explícita do utilizador.
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'FUTURE';
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'DUE_SOON';
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'IN_DEADLINE';
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'OVERDUE';
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'FULFILLED';
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'TO_DETERMINE';
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'HISTORICAL_CONFIRMATION';

-- Reversão documentada (a executar somente depois de confirmar que não há
-- linhas com os estados novos):
-- ALTER TABLE "FiscalObligation" DROP COLUMN "referenceYear";
-- ALTER TABLE "TaxRegimeAssignment" DROP COLUMN "knowledgeStatus";
-- ALTER TABLE "Tenant" DROP COLUMN "hasPriorUnregularizedObligations", DROP COLUMN "activityStartedAt";
-- Os valores adicionados a enums PostgreSQL não são removíveis de forma segura
-- sem recriar o tipo; por isso não há down migration automática.
