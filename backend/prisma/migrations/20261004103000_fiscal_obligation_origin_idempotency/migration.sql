-- Additive provenance and idempotency metadata for future non-calendar obligations.
-- Existing rows intentionally keep NULL origin and idempotencyKey: no origin is inferred.
-- Prisma cannot represent this PostgreSQL partial unique index with @@unique.

CREATE TYPE "FiscalObligationOrigin" AS ENUM (
  'CALENDAR',
  'PAYROLL',
  'FISCAL_ENGINE',
  'MANUAL',
  'LEGACY'
);

ALTER TABLE "FiscalObligation"
  ADD COLUMN "origin" "FiscalObligationOrigin",
  ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "FiscalObligation_tenant_origin_idempotency_key_unique"
ON "FiscalObligation" ("tenantId", "origin", "idempotencyKey")
WHERE "fiscalCalendarId" IS NULL
  AND "origin" IS NOT NULL
  AND "idempotencyKey" IS NOT NULL;
