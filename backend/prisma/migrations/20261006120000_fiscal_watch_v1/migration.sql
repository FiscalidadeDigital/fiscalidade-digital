-- Fiscal Watch V1: versioned IVA threshold infrastructure.
CREATE TYPE "FiscalThresholdOperator" AS ENUM ('GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'EQUAL');
CREATE TYPE "FiscalThresholdStatus" AS ENUM ('OFFICIAL_CONFIRMED', 'NEEDS_OFFICIAL_CONFIRMATION', 'LEGACY_UNVERIFIED');
CREATE TYPE "FiscalWatchEventType" AS ENUM ('REACHED');
CREATE TYPE "FiscalWatchEventStatus" AS ENUM ('REQUIRES_REVIEW', 'RESOLVED');

CREATE TABLE "FiscalThresholdRule" (
  "id" TEXT NOT NULL,
  "taxType" "TaxType" NOT NULL,
  "regimeFrom" "FiscalRegime",
  "regimeTo" "FiscalRegime",
  "metric" TEXT NOT NULL,
  "operator" "FiscalThresholdOperator" NOT NULL,
  "threshold" DECIMAL(20,2) NOT NULL,
  "periodBasis" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "legalDiploma" TEXT,
  "legalArticle" TEXT,
  "officialSource" TEXT,
  "version" TEXT NOT NULL,
  "status" "FiscalThresholdStatus" NOT NULL,
  "tenantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FiscalThresholdRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FiscalWatchEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "ruleId" TEXT NOT NULL,
  "fiscalPeriod" TEXT NOT NULL,
  "eventType" "FiscalWatchEventType" NOT NULL,
  "metric" TEXT NOT NULL,
  "metricValue" DECIMAL(20,2) NOT NULL,
  "threshold" DECIMAL(20,2) NOT NULL,
  "status" "FiscalWatchEventStatus" NOT NULL DEFAULT 'REQUIRES_REVIEW',
  "notificationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FiscalWatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FiscalWatchEvent_tenantId_ruleId_fiscalPeriod_eventType_key" ON "FiscalWatchEvent"("tenantId", "ruleId", "fiscalPeriod", "eventType");
CREATE INDEX "FiscalThresholdRule_taxType_status_idx" ON "FiscalThresholdRule"("taxType", "status");
CREATE INDEX "FiscalThresholdRule_effectiveFrom_effectiveTo_idx" ON "FiscalThresholdRule"("effectiveFrom", "effectiveTo");
CREATE INDEX "FiscalThresholdRule_tenantId_idx" ON "FiscalThresholdRule"("tenantId");
CREATE INDEX "FiscalWatchEvent_tenantId_fiscalPeriod_idx" ON "FiscalWatchEvent"("tenantId", "fiscalPeriod");

ALTER TABLE "FiscalThresholdRule" ADD CONSTRAINT "FiscalThresholdRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FiscalWatchEvent" ADD CONSTRAINT "FiscalWatchEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FiscalWatchEvent" ADD CONSTRAINT "FiscalWatchEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "FiscalThresholdRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "FiscalThresholdRule" ("id", "taxType", "metric", "operator", "threshold", "periodBasis", "legalDiploma", "legalArticle", "officialSource", "version", "status", "updatedAt") VALUES
  ('fiscal-watch-iva-25m', 'IVA', 'TURNOVER', 'GREATER_THAN', 25000000, 'RELEVANT_PERIOD', 'Código do IVA', '60.º, 61.º e 62.º', 'Documentação fiscal local; vigência exacta pendente de confirmação', 'LOCAL-DOC-PENDING', 'NEEDS_OFFICIAL_CONFIRMATION', CURRENT_TIMESTAMP),
  ('fiscal-watch-iva-350m', 'IVA', 'TURNOVER', 'GREATER_THAN_OR_EQUAL', 350000000, 'PREVIOUS_FISCAL_YEAR', 'Código do IVA', '62.º', 'Documentação fiscal local; vigência exacta pendente de confirmação', 'LOCAL-DOC-PENDING', 'NEEDS_OFFICIAL_CONFIRMATION', CURRENT_TIMESTAMP);
