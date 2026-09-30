-- Extensão aditiva para rastreabilidade e cálculo exacto da folha salarial.
-- Não remove nem transforma os valores de folhas existentes.
DO $$
BEGIN
    CREATE TYPE "SocialSecurityCategory" AS ENUM (
        'STANDARD',
        'RETIRED',
        'SPECIAL'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Employee"
  ADD COLUMN "socialSecurityCategory" "SocialSecurityCategory" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "Payroll"
  ADD COLUMN "employerSocialSecurityAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "taxRuleVersion" TEXT,
  ADD COLUMN "calculationStatus" TEXT;

ALTER TABLE "PayrollItem"
  ADD COLUMN "socialSecurityCategory" "SocialSecurityCategory" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "employeeSocialSecurityRate" DECIMAL(7,6) NOT NULL DEFAULT 0,
  ADD COLUMN "employerSocialSecurityRate" DECIMAL(7,6) NOT NULL DEFAULT 0,
  ADD COLUMN "employerSocialSecurityAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "taxRuleVersion" TEXT,
  ADD COLUMN "calculationStatus" TEXT;

-- A obrigação mantém o campo Float legado para compatibilidade, mas os
-- valores produzidos por Payroll passam a ter uma representação exacta.
ALTER TABLE "FiscalObligation"
  ADD COLUMN "amountValue" DECIMAL(18,2);

UPDATE "FiscalObligation"
SET "amountValue" = ROUND("amount"::numeric, 2)
WHERE "amount" IS NOT NULL;
