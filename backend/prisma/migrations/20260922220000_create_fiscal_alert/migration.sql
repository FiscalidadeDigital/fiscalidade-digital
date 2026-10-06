-- Repair the migration history for fresh databases. FiscalAlert was present in
-- the Prisma schema and existing environments, but had no CREATE TABLE migration.
CREATE TABLE IF NOT EXISTS "FiscalAlert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailStatus" TEXT,
    "notificationId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalAlert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FiscalAlert_obligationId_daysBefore_key"
ON "FiscalAlert"("obligationId", "daysBefore");

CREATE INDEX IF NOT EXISTS "FiscalAlert_tenantId_idx"
ON "FiscalAlert"("tenantId");

CREATE INDEX IF NOT EXISTS "FiscalAlert_obligationId_idx"
ON "FiscalAlert"("obligationId");

CREATE INDEX IF NOT EXISTS "FiscalAlert_sentAt_idx"
ON "FiscalAlert"("sentAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FiscalAlert_tenantId_fkey'
    ) THEN
        ALTER TABLE "FiscalAlert"
        ADD CONSTRAINT "FiscalAlert_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FiscalAlert_obligationId_fkey'
    ) THEN
        ALTER TABLE "FiscalAlert"
        ADD CONSTRAINT "FiscalAlert_obligationId_fkey"
        FOREIGN KEY ("obligationId") REFERENCES "FiscalObligation"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
