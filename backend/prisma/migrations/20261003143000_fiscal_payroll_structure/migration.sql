-- Additive, review-required migration. Do not apply without production review.
-- No historical payroll values are recomputed or backfilled by this migration.

ALTER TYPE "EmployeeStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';
CREATE TYPE "RemunerationComponentType" AS ENUM ('SALARY', 'MEAL_ALLOWANCE', 'TRANSPORT_ALLOWANCE', 'HOLIDAY_ALLOWANCE', 'CHRISTMAS_ALLOWANCE', 'OVERTIME', 'BONUS', 'REPRESENTATION_ALLOWANCE', 'HOUSING_ALLOWANCE', 'FAMILY_ALLOWANCE', 'REIMBURSEMENT', 'OTHER');
CREATE TYPE "FiscalTreatment" AS ENUM ('INCLUDED', 'EXCLUDED', 'PARTIALLY_EXEMPT', 'NEEDS_OFFICIAL_CONFIRMATION');
CREATE TYPE "PayrollSnapshotStatus" AS ENUM ('LEGACY_INCOMPLETE', 'CAPTURED', 'IMMUTABLE', 'REVIEW_REQUIRED');
CREATE TYPE "TaxRegimeAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'REVIEW_REQUIRED');

ALTER TABLE "Payroll" ADD COLUMN "fiscalSnapshot" JSONB;
ALTER TABLE "Payroll" ADD COLUMN "snapshotStatus" "PayrollSnapshotStatus" NOT NULL DEFAULT 'LEGACY_INCOMPLETE';
ALTER TABLE "PayrollItem" ADD COLUMN "fiscalSnapshot" JSONB;
ALTER TABLE "PayrollItem" ADD COLUMN "remunerationComponents" JSONB;

CREATE TABLE "EmployeeRemunerationComponent" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "salaryId" TEXT,
  "type" "RemunerationComponentType" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "irtTreatment" "FiscalTreatment" NOT NULL DEFAULT 'NEEDS_OFFICIAL_CONFIRMATION',
  "inssTreatment" "FiscalTreatment" NOT NULL DEFAULT 'NEEDS_OFFICIAL_CONFIRMATION',
  "exemptAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "legalReference" TEXT,
  "officialSourceUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmployeeRemunerationComponent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmployeeRemunerationComponent_employeeId_effectiveFrom_idx" ON "EmployeeRemunerationComponent"("employeeId", "effectiveFrom");
CREATE INDEX "EmployeeRemunerationComponent_salaryId_idx" ON "EmployeeRemunerationComponent"("salaryId");
ALTER TABLE "EmployeeRemunerationComponent" ADD CONSTRAINT "EmployeeRemunerationComponent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeRemunerationComponent" ADD CONSTRAINT "EmployeeRemunerationComponent_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "EmployeeSalary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TaxRegimeAssignment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "taxType" "TaxType" NOT NULL,
  "regime" "FiscalRegime" NOT NULL,
  "status" "TaxRegimeAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3),
  "legalReference" TEXT,
  "officialSourceUrl" TEXT,
  "sourceDiploma" TEXT,
  "sourceArticle" TEXT,
  "decisionDate" TIMESTAMP(3),
  "decisionType" TEXT,
  "reviewStatus" "TaxRegimeAssignmentStatus" NOT NULL DEFAULT 'REVIEW_REQUIRED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TaxRegimeAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TaxRegimeAssignment_tenantId_taxType_validFrom_idx" ON "TaxRegimeAssignment"("tenantId", "taxType", "validFrom");
ALTER TABLE "TaxRegimeAssignment" ADD CONSTRAINT "TaxRegimeAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
