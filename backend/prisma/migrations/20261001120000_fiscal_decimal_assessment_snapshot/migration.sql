-- Fundação aditiva para montantes fiscais exactos e rastreabilidade.
-- As colunas Float legadas permanecem para compatibilidade durante a transição.
ALTER TABLE "TaxTransaction"
  ADD COLUMN "baseAmountValue" DECIMAL(20,2),
  ADD COLUMN "taxAmountValue" DECIMAL(20,2),
  ADD COLUMN "deductibleAmountValue" DECIMAL(20,2),
  ADD COLUMN "withheldAmountValue" DECIMAL(20,2),
  ADD COLUMN "calculationStatus" TEXT NOT NULL DEFAULT 'LEGACY_UNVERIFIED',
  ADD COLUMN "ruleVersion" TEXT,
  ADD COLUMN "legalReference" TEXT,
  ADD COLUMN "officialSource" TEXT,
  ADD COLUMN "calculationDetails" JSONB;

UPDATE "TaxTransaction"
SET
  "baseAmountValue" = ROUND("baseAmount"::numeric, 2),
  "taxAmountValue" = ROUND("taxAmount"::numeric, 2),
  "deductibleAmountValue" = ROUND("deductibleAmount"::numeric, 2),
  "withheldAmountValue" = ROUND("withheldAmount"::numeric, 2);

ALTER TABLE "TaxAssessment"
  ADD COLUMN "taxableAmountValue" DECIMAL(20,2),
  ADD COLUMN "taxDueAmountValue" DECIMAL(20,2),
  ADD COLUMN "deductibleAmountValue" DECIMAL(20,2),
  ADD COLUMN "withheldAmountValue" DECIMAL(20,2),
  ADD COLUMN "adjustmentsAmountValue" DECIMAL(20,2),
  ADD COLUMN "finalAmountValue" DECIMAL(20,2),
  ADD COLUMN "creditAmountValue" DECIMAL(20,2),
  ADD COLUMN "payableAmountValue" DECIMAL(20,2),
  ADD COLUMN "calculationStatus" TEXT NOT NULL DEFAULT 'LEGACY_UNVERIFIED',
  ADD COLUMN "ruleVersion" TEXT,
  ADD COLUMN "legalReference" TEXT,
  ADD COLUMN "officialSource" TEXT,
  ADD COLUMN "calculationSnapshot" JSONB;

UPDATE "TaxAssessment"
SET
  "taxableAmountValue" = ROUND("taxableAmount"::numeric, 2),
  "taxDueAmountValue" = ROUND("taxDueAmount"::numeric, 2),
  "deductibleAmountValue" = ROUND("deductibleAmount"::numeric, 2),
  "withheldAmountValue" = ROUND("withheldAmount"::numeric, 2),
  "adjustmentsAmountValue" = ROUND("adjustmentsAmount"::numeric, 2),
  "finalAmountValue" = ROUND("finalAmount"::numeric, 2),
  "payableAmountValue" = GREATEST(ROUND("finalAmount"::numeric, 2), 0),
  "creditAmountValue" = 0;
